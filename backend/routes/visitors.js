const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// ── Input validation helper ───────────────────────────────────────────────────
function validateVisitor(body) {
  const errors = [];
  if (!body.visitor_name || String(body.visitor_name).trim() === '') errors.push('visitor_name is required.');
  if (!body.purpose || String(body.purpose).trim() === '') errors.push('purpose is required.');
  return errors;
}

// GET /api/visitors/today - Today's visitor log
router.get('/today', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, u.name AS host_name
       FROM visitors v JOIN users u ON v.host_user_id = u.id
       WHERE DATE(COALESCE(v.check_in_time, v.created_at)) = CURRENT_DATE
       ORDER BY COALESCE(v.check_in_time, v.created_at) DESC`
    );
    res.json({
      date: new Date().toISOString().split('T')[0],
      total: result.rows.length,
      visitors: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all visitors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT v.*, u.name AS host_name FROM visitors v JOIN users u ON v.host_user_id = u.id ORDER BY v.created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET visitor by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT v.*, u.name AS host_name FROM visitors v JOIN users u ON v.host_user_id = u.id WHERE v.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visitor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST register visitor with host, purpose, duration
router.post('/', auth, async (req, res) => {
  try {
    const errors = validateVisitor(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { host_user_id, visitor_name, visitor_email, visitor_company, purpose, badge_number, expected_duration_hours } = req.body;
    const hostId = host_user_id || req.user.id;

    // Validate host exists
    const hostCheck = await pool.query('SELECT id FROM users WHERE id = $1', [hostId]);
    if (hostCheck.rows.length === 0) return res.status(404).json({ error: 'Host member not found.' });

    const result = await pool.query(
      `INSERT INTO visitors (host_user_id, visitor_name, visitor_email, visitor_company, purpose, badge_number, expected_duration_hours, check_in_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, 'checked_in')
       RETURNING *`,
      [hostId, visitor_name.trim(), visitor_email || null, visitor_company || null, purpose.trim(), badge_number || null, expected_duration_hours || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT check-in visitor
router.put('/:id/checkin', auth, async (req, res) => {
  try {
    const { badge_number } = req.body;
    const result = await pool.query(
      `UPDATE visitors SET status = 'checked_in', check_in_time = CURRENT_TIMESTAMP, badge_number = COALESCE($1, badge_number) WHERE id = $2 RETURNING *`,
      [badge_number, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visitor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT check-out visitor
router.put('/:id/checkout', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE visitors SET status = 'checked_out', check_out_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visitor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update visitor
router.put('/:id', auth, async (req, res) => {
  try {
    const { visitor_name, visitor_email, visitor_company, purpose, badge_number, status } = req.body;
    const result = await pool.query(
      'UPDATE visitors SET visitor_name = $1, visitor_email = $2, visitor_company = $3, purpose = $4, badge_number = $5, status = $6 WHERE id = $7 RETURNING *',
      [visitor_name, visitor_email, visitor_company, purpose, badge_number, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visitor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE visitor
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM visitors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visitor not found' });
    res.json({ message: 'Visitor deleted', visitor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
