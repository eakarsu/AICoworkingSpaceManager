const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// ── Helpers ───────────────────────────────────────────────────────────────────

function validateGenerateInvoice(body) {
  const errors = [];
  if (!body.user_id) errors.push('user_id is required.');
  if (!body.billing_period) errors.push('billing_period is required (e.g. "2026-05").');
  return errors;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/billing/generate-invoice
// Creates a monthly invoice for a member based on their plan + usage
router.post('/generate-invoice', auth, async (req, res) => {
  try {
    const errors = validateGenerateInvoice(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { user_id, billing_period } = req.body;

    // Validate period format
    if (!/^\d{4}-\d{2}$/.test(billing_period)) {
      return res.status(400).json({ error: 'billing_period must be in YYYY-MM format.' });
    }

    const [year, month] = billing_period.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1).toISOString();
    const periodEnd = new Date(year, month, 0, 23, 59, 59).toISOString();

    // Get member info
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [user_id]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    const user = userResult.rows[0];

    // Get active membership plan (via most recent invoice or memberships table)
    const planResult = await pool.query(
      `SELECT mp.* FROM membership_plans mp
       INNER JOIN memberships m ON m.plan_id = mp.id
       WHERE m.user_id = $1 AND m.status = 'active'
       LIMIT 1`,
      [user_id]
    );
    const plan = planResult.rows[0] || null;
    const baseAmount = plan ? parseFloat(plan.price_monthly) : 0;

    // Calculate meeting-room usage charges
    const roomUsageResult = await pool.query(
      `SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 * r.hourly_rate) AS usage_charge
       FROM meeting_room_bookings b
       JOIN meeting_rooms r ON b.room_id = r.id
       WHERE b.user_id = $1
         AND b.start_time >= $2
         AND b.start_time <= $3
         AND b.status = 'confirmed'`,
      [user_id, periodStart, periodEnd]
    );
    const usageCharge = parseFloat(roomUsageResult.rows[0]?.usage_charge || 0);

    // Calculate day-pass usage if any
    const dayPassResult = await pool.query(
      `SELECT SUM(price) AS day_pass_total FROM day_passes
       WHERE guest_email = (SELECT email FROM users WHERE id = $1)
         AND date >= $2 AND date <= $3`,
      [user_id, periodStart, periodEnd]
    );
    const dayPassTotal = parseFloat(dayPassResult.rows[0]?.day_pass_total || 0);

    const totalAmount = baseAmount + usageCharge + dayPassTotal;
    const dueDate = new Date(year, month, 15).toISOString().split('T')[0]; // 15th of next month

    // Check for duplicate
    const existing = await pool.query(
      `SELECT id FROM invoices WHERE user_id = $1 AND period_start = $2`,
      [user_id, periodStart]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Invoice already exists for this period.',
        invoice_id: existing.rows[0].id,
      });
    }

    // Insert invoice
    const invoiceResult = await pool.query(
      `INSERT INTO invoices (user_id, amount, status, due_date, period_start, period_end, line_items)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6)
       RETURNING *`,
      [
        user_id,
        totalAmount.toFixed(2),
        dueDate,
        periodStart,
        periodEnd,
        JSON.stringify({
          membership_plan: plan ? { name: plan.name, amount: baseAmount } : null,
          room_usage: { amount: parseFloat(usageCharge.toFixed(2)) },
          day_passes: { amount: parseFloat(dayPassTotal.toFixed(2)) },
        }),
      ]
    );

    res.status(201).json({
      invoice: invoiceResult.rows[0],
      member: user.name,
      breakdown: {
        membership_fee: baseAmount,
        room_usage_charges: parseFloat(usageCharge.toFixed(2)),
        day_pass_charges: parseFloat(dayPassTotal.toFixed(2)),
        total: parseFloat(totalAmount.toFixed(2)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/invoices?member_id=&page=&limit=
router.get('/invoices', auth, async (req, res) => {
  try {
    const { member_id, status, page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
    const params = [];
    let where = 'WHERE 1=1';

    if (member_id) { params.push(member_id); where += ` AND i.user_id = $${params.length}`; }
    if (status) { params.push(status); where += ` AND i.status = $${params.length}`; }

    params.push(Math.min(100, parseInt(limit)));
    params.push(offset);

    const [invoicesResult, countResult] = await Promise.all([
      pool.query(
        `SELECT i.*, u.name AS member_name, u.email AS member_email
         FROM invoices i JOIN users u ON i.user_id = u.id
         ${where}
         ORDER BY i.due_date DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM invoices i ${where}`,
        params.slice(0, -2)
      ),
    ]);

    res.json({
      data: invoicesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/overdue
// Returns overdue invoices with escalation flags (days overdue tiers)
router.get('/overdue', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, u.name AS member_name, u.email AS member_email,
              EXTRACT(DAY FROM NOW() - i.due_date) AS days_overdue
       FROM invoices i JOIN users u ON i.user_id = u.id
       WHERE i.status = 'overdue' OR (i.status = 'pending' AND i.due_date < NOW())
       ORDER BY i.due_date ASC`
    );

    const withEscalation = result.rows.map((inv) => {
      const days = parseInt(inv.days_overdue || 0);
      let escalation_level;
      if (days <= 7) escalation_level = 'reminder';
      else if (days <= 30) escalation_level = 'warning';
      else if (days <= 60) escalation_level = 'final_notice';
      else escalation_level = 'collections';

      return { ...inv, days_overdue: days, escalation_level };
    });

    res.json({
      total_overdue: withEscalation.length,
      total_amount: withEscalation.reduce((s, i) => s + parseFloat(i.amount || 0), 0).toFixed(2),
      invoices: withEscalation,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
