const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all storage lockers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT s.*, u.name AS assigned_to_name FROM storage_lockers s LEFT JOIN users u ON s.assigned_to = u.id ORDER BY s.floor, s.locker_number'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET storage locker by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT s.*, u.name AS assigned_to_name FROM storage_lockers s LEFT JOIN users u ON s.assigned_to = u.id WHERE s.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Storage locker not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create storage locker
router.post('/', auth, async (req, res) => {
  try {
    const { locker_number, size, floor, status, assigned_to, monthly_rate } = req.body;
    const result = await pool.query(
      'INSERT INTO storage_lockers (locker_number, size, floor, status, assigned_to, monthly_rate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [locker_number, size, floor, status || 'available', assigned_to, monthly_rate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update storage locker
router.put('/:id', auth, async (req, res) => {
  try {
    const { locker_number, size, floor, status, assigned_to, monthly_rate } = req.body;
    const result = await pool.query(
      'UPDATE storage_lockers SET locker_number = $1, size = $2, floor = $3, status = $4, assigned_to = $5, monthly_rate = $6 WHERE id = $7 RETURNING *',
      [locker_number, size, floor, status, assigned_to, monthly_rate, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Storage locker not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT assign locker
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const { user_id } = req.body;
    const result = await pool.query(
      `UPDATE storage_lockers SET assigned_to = $1, status = 'assigned' WHERE id = $2 RETURNING *`,
      [user_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Storage locker not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE storage locker
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM storage_lockers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Storage locker not found' });
    res.json({ message: 'Storage locker deleted', locker: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
