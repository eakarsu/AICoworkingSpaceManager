const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all cleaning schedules
router.get('/', async (req, res) => {
  try {
    const { status, area } = req.query;
    let query = 'SELECT * FROM cleaning_schedules';
    const params = [];
    const conditions = [];
    if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
    if (area) { params.push(area); conditions.push(`area = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY scheduled_time ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET cleaning schedule by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cleaning_schedules WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cleaning schedule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create cleaning schedule
router.post('/', auth, async (req, res) => {
  try {
    const { area, scheduled_time, status, assigned_to, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO cleaning_schedules (area, scheduled_time, status, assigned_to, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [area, scheduled_time, status || 'pending', assigned_to, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update cleaning schedule
router.put('/:id', auth, async (req, res) => {
  try {
    const { area, scheduled_time, status, assigned_to, notes } = req.body;
    const result = await pool.query(
      'UPDATE cleaning_schedules SET area = $1, scheduled_time = $2, status = $3, assigned_to = $4, notes = $5 WHERE id = $6 RETURNING *',
      [area, scheduled_time, status, assigned_to, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cleaning schedule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT mark cleaning as completed
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE cleaning_schedules SET status = 'completed' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cleaning schedule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE cleaning schedule
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cleaning_schedules WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cleaning schedule not found' });
    res.json({ message: 'Cleaning schedule deleted', schedule: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
