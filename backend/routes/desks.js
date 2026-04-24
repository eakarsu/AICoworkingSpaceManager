const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all desks
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT d.*, u.name AS assigned_to_name FROM desks d LEFT JOIN users u ON d.assigned_to = u.id ORDER BY d.floor, d.name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET desk by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT d.*, u.name AS assigned_to_name FROM desks d LEFT JOIN users u ON d.assigned_to = u.id WHERE d.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Desk not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create desk
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, floor, zone, status, assigned_to, features } = req.body;
    const result = await pool.query(
      'INSERT INTO desks (name, type, floor, zone, status, assigned_to, features) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, type, floor, zone, status || 'available', assigned_to || null, features || '[]']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update desk
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, floor, zone, status, assigned_to, features } = req.body;
    const result = await pool.query(
      'UPDATE desks SET name = $1, type = $2, floor = $3, zone = $4, status = $5, assigned_to = $6, features = $7 WHERE id = $8 RETURNING *',
      [name, type, floor, zone, status, assigned_to, features, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Desk not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT assign desk to user
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const { user_id } = req.body;
    const result = await pool.query(
      'UPDATE desks SET assigned_to = $1, status = $2 WHERE id = $3 RETURNING *',
      [user_id, user_id ? 'occupied' : 'available', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Desk not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT unassign desk
router.put('/:id/unassign', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE desks SET assigned_to = NULL, status = $1 WHERE id = $2 RETURNING *',
      ['available', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Desk not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE desk
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM desks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Desk not found' });
    res.json({ message: 'Desk deleted', desk: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
