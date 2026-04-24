const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all mail/packages
router.get('/', async (req, res) => {
  try {
    const { status, user_id } = req.query;
    let query = 'SELECT m.*, u.name AS user_name FROM mail_packages m JOIN users u ON m.user_id = u.id';
    const params = [];
    const conditions = [];
    if (status) { params.push(status); conditions.push(`m.status = $${params.length}`); }
    if (user_id) { params.push(user_id); conditions.push(`m.user_id = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY m.received_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET mail/package by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT m.*, u.name AS user_name FROM mail_packages m JOIN users u ON m.user_id = u.id WHERE m.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mail/package not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create mail/package entry
router.post('/', auth, async (req, res) => {
  try {
    const { user_id, type, sender, tracking_number, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO mail_packages (user_id, type, sender, tracking_number, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, type, sender, tracking_number, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update mail/package
router.put('/:id', auth, async (req, res) => {
  try {
    const { type, sender, tracking_number, status, notes } = req.body;
    const result = await pool.query(
      'UPDATE mail_packages SET type = $1, sender = $2, tracking_number = $3, status = $4, notes = $5 WHERE id = $6 RETURNING *',
      [type, sender, tracking_number, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mail/package not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT mark as picked up
router.put('/:id/pickup', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE mail_packages SET status = 'picked_up', picked_up_date = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mail/package not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT notify user
router.put('/:id/notify', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE mail_packages SET status = 'notified' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mail/package not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE mail/package
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM mail_packages WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mail/package not found' });
    res.json({ message: 'Mail/package deleted', item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
