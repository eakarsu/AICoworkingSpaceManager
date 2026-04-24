const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all checkins
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT c.*, u.name AS user_name, d.name AS desk_name FROM checkins c JOIN users u ON c.user_id = u.id LEFT JOIN desks d ON c.desk_id = d.id ORDER BY c.check_in_time DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET checkin by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT c.*, u.name AS user_name, d.name AS desk_name FROM checkins c JOIN users u ON c.user_id = u.id LEFT JOIN desks d ON c.desk_id = d.id WHERE c.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Checkin not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET checkin history for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT c.*, d.name AS desk_name FROM checkins c LEFT JOIN desks d ON c.desk_id = d.id WHERE c.user_id = $1 ORDER BY c.check_in_time DESC',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET currently checked-in users
router.get('/active/now', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT c.*, u.name AS user_name, d.name AS desk_name FROM checkins c JOIN users u ON c.user_id = u.id LEFT JOIN desks d ON c.desk_id = d.id WHERE c.check_out_time IS NULL ORDER BY c.check_in_time DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST check-in
router.post('/', auth, async (req, res) => {
  try {
    const { user_id, desk_id } = req.body;
    const result = await pool.query(
      'INSERT INTO checkins (user_id, desk_id, check_in_time) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *',
      [user_id || req.user.id, desk_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT check-out
router.put('/:id/checkout', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE checkins SET check_out_time = CURRENT_TIMESTAMP WHERE id = $1 AND check_out_time IS NULL RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Active checkin not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update checkin
router.put('/:id', auth, async (req, res) => {
  try {
    const { check_in_time, check_out_time, desk_id } = req.body;
    const result = await pool.query(
      'UPDATE checkins SET check_in_time = $1, check_out_time = $2, desk_id = $3 WHERE id = $4 RETURNING *',
      [check_in_time, check_out_time, desk_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Checkin not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE checkin
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM checkins WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Checkin not found' });
    res.json({ message: 'Checkin deleted', checkin: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
