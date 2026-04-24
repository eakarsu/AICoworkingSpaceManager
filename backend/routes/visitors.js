const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

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

// POST register visitor
router.post('/', auth, async (req, res) => {
  try {
    const { host_user_id, visitor_name, visitor_email, visitor_company, purpose, badge_number } = req.body;
    const result = await pool.query(
      'INSERT INTO visitors (host_user_id, visitor_name, visitor_email, visitor_company, purpose, badge_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [host_user_id || req.user.id, visitor_name, visitor_email, visitor_company, purpose, badge_number]
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
