// Custom Views routes - 4 new endpoints for coworking space management
const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// VIZ 1: Occupancy Heatmap (zone x hour)
// Aggregates usage_analytics by area (zone) and hour
// ============================================================
router.get('/occupancy-heatmap', auth, async (req, res) => {
  try {
    const { days } = req.query;
    const daysBack = Math.max(1, Math.min(365, parseInt(days || 30)));

    const result = await db.query(
      `SELECT area AS zone, hour, SUM(occupancy_count)::int AS occupancy
       FROM usage_analytics
       WHERE date >= CURRENT_DATE - INTERVAL '${daysBack} days'
       GROUP BY area, hour
       ORDER BY area, hour`
    );

    const zones = [...new Set(result.rows.map(r => r.zone))];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Build matrix
    const matrix = zones.map(zone => {
      return hours.map(h => {
        const cell = result.rows.find(r => r.zone === zone && r.hour === h);
        return cell ? cell.occupancy : 0;
      });
    });

    const maxOcc = Math.max(1, ...result.rows.map(r => r.occupancy));

    res.json({
      zones,
      hours,
      matrix,
      max: maxOcc,
      total_cells: result.rows.length,
      days_back: daysBack,
    });
  } catch (err) {
    console.error('occupancy-heatmap error:', err);
    res.status(500).json({ error: 'Failed to compute heatmap.' });
  }
});

// ============================================================
// VIZ 2: Member Growth & Retention (line chart series)
// Monthly new members, active members, and retention %
// ============================================================
router.get('/member-growth', auth, async (req, res) => {
  try {
    const { months } = req.query;
    const monthsBack = Math.max(3, Math.min(36, parseInt(months || 12)));

    const newMembers = await db.query(
      `SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month,
              COUNT(*)::int AS new_members
       FROM users
       WHERE role = 'member'
         AND created_at >= CURRENT_DATE - INTERVAL '${monthsBack} months'
       GROUP BY 1
       ORDER BY 1`
    );

    const activeMembers = await db.query(
      `SELECT TO_CHAR(date_trunc('month', check_in_time), 'YYYY-MM') AS month,
              COUNT(DISTINCT user_id)::int AS active_members
       FROM checkins
       WHERE check_in_time >= CURRENT_DATE - INTERVAL '${monthsBack} months'
       GROUP BY 1
       ORDER BY 1`
    );

    // Build month series
    const months_list = [];
    const now = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months_list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const newMap = Object.fromEntries(newMembers.rows.map(r => [r.month, r.new_members]));
    const actMap = Object.fromEntries(activeMembers.rows.map(r => [r.month, r.active_members]));

    let cumulative = 0;
    const series = months_list.map((m, idx) => {
      const newM = newMap[m] || 0;
      cumulative += newM;
      const active = actMap[m] || 0;
      const retention = cumulative > 0 ? Math.round((active / cumulative) * 100) : 0;
      return { month: m, new_members: newM, active_members: active, cumulative, retention };
    });

    res.json({
      months: months_list,
      series,
      total_growth: cumulative,
      avg_retention: Math.round(series.reduce((s, r) => s + r.retention, 0) / Math.max(1, series.length)),
    });
  } catch (err) {
    console.error('member-growth error:', err);
    res.status(500).json({ error: 'Failed to compute member growth.' });
  }
});

// ============================================================
// NON-VIZ 1: Member Invoice PDF
// Generates a minimal PDF for a given invoice
// ============================================================
function escapePdfText(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildSimplePdf(lines) {
  // Build a minimal one-page PDF with text using core PDF objects
  const fontObj = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  // Content stream: position cursor and draw each line
  let content = 'BT\n/F1 12 Tf\n50 760 Td\n14 TL\n';
  lines.forEach((line, i) => {
    const safe = escapePdfText(line);
    if (i === 0) content += `(${safe}) Tj\n`;
    else content += `T*\n(${safe}) Tj\n`;
  });
  content += 'ET';

  const contentStream = `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`;

  const objs = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`,
    `4 0 obj\n${contentStream}\nendobj\n`,
    `5 0 obj\n${fontObj}\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach(o => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += o;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach(o => {
    pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'binary');
}

router.get('/invoice-pdf/:id', auth, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT i.*, u.name AS user_name, u.email AS user_email, u.company AS user_company
       FROM invoices i JOIN users u ON i.user_id = u.id WHERE i.id = $1`,
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Invoice not found.' });
    const inv = r.rows[0];

    const lines = [
      'COWORKING SPACE - MEMBER INVOICE',
      '================================',
      '',
      `Invoice #: INV-${String(inv.id).padStart(6, '0')}`,
      `Date Issued: ${new Date(inv.created_at).toISOString().slice(0, 10)}`,
      `Due Date: ${inv.due_date ? new Date(inv.due_date).toISOString().slice(0, 10) : 'N/A'}`,
      `Status: ${String(inv.status || '').toUpperCase()}`,
      '',
      'BILL TO:',
      `  ${inv.user_name || ''}`,
      `  ${inv.user_email || ''}`,
      `  ${inv.user_company || ''}`,
      '',
      'DESCRIPTION:',
      `  ${inv.description || 'Membership services'}`,
      '',
      '----------------------------------------',
      `AMOUNT DUE: $${Number(inv.amount).toFixed(2)}`,
      '----------------------------------------',
      '',
      `Paid Date: ${inv.paid_date ? new Date(inv.paid_date).toISOString().slice(0, 10) : 'UNPAID'}`,
      '',
      'Thank you for being a valued member of our coworking community.',
    ];

    const pdfBuffer = buildSimplePdf(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${inv.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('invoice-pdf error:', err);
    res.status(500).json({ error: 'Failed to generate invoice PDF.' });
  }
});

// List invoices (for picking which one to render)
router.get('/invoices', auth, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT i.id, i.amount, i.status, i.due_date, i.description, u.name AS user_name
       FROM invoices i JOIN users u ON i.user_id = u.id
       ORDER BY i.due_date DESC LIMIT 100`
    );
    res.json(r.rows);
  } catch (err) {
    console.error('list invoices error:', err);
    res.status(500).json({ error: 'Failed to list invoices.' });
  }
});

// ============================================================
// NON-VIZ 2: Access Rules / Membership-Tier Editor (CRUD)
// Manages membership_plans with access rule metadata in features JSONB
// ============================================================
router.get('/tiers', auth, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, name, type, price_monthly, features, max_members, created_at
       FROM membership_plans ORDER BY price_monthly ASC`
    );
    res.json(r.rows);
  } catch (err) {
    console.error('list tiers error:', err);
    res.status(500).json({ error: 'Failed to list tiers.' });
  }
});

router.post('/tiers', auth, async (req, res) => {
  try {
    const { name, type, price_monthly, features, max_members, access_rules } = req.body;
    if (!name || !type || price_monthly === undefined) {
      return res.status(400).json({ error: 'name, type, and price_monthly are required.' });
    }
    const allowedTypes = ['hot_desk', 'dedicated_desk', 'private_office'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${allowedTypes.join(', ')}` });
    }

    // Encode access_rules into features JSONB array
    let combinedFeatures = Array.isArray(features) ? features : [];
    if (access_rules && typeof access_rules === 'object') {
      combinedFeatures.push({ __access_rules: access_rules });
    }

    const r = await db.query(
      `INSERT INTO membership_plans (name, type, price_monthly, features, max_members)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, type, price_monthly, JSON.stringify(combinedFeatures), max_members || 1]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('create tier error:', err);
    res.status(500).json({ error: 'Failed to create tier.' });
  }
});

router.put('/tiers/:id', auth, async (req, res) => {
  try {
    const { name, type, price_monthly, features, max_members, access_rules } = req.body;
    const fields = [];
    const values = [];
    if (name !== undefined) { values.push(name); fields.push(`name = $${values.length}`); }
    if (type !== undefined) { values.push(type); fields.push(`type = $${values.length}`); }
    if (price_monthly !== undefined) { values.push(price_monthly); fields.push(`price_monthly = $${values.length}`); }
    if (max_members !== undefined) { values.push(max_members); fields.push(`max_members = $${values.length}`); }
    if (features !== undefined || access_rules !== undefined) {
      let combined = Array.isArray(features) ? features : [];
      if (access_rules) combined.push({ __access_rules: access_rules });
      values.push(JSON.stringify(combined));
      fields.push(`features = $${values.length}`);
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const r = await db.query(
      `UPDATE membership_plans SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Tier not found.' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('update tier error:', err);
    res.status(500).json({ error: 'Failed to update tier.' });
  }
});

router.delete('/tiers/:id', auth, async (req, res) => {
  try {
    const r = await db.query(
      `DELETE FROM membership_plans WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Tier not found.' });
    res.json({ message: 'Deleted.', deleted: r.rows[0] });
  } catch (err) {
    console.error('delete tier error:', err);
    res.status(500).json({ error: 'Failed to delete tier.' });
  }
});

module.exports = router;
