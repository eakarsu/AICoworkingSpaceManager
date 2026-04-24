const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all maintenance requests
router.get('/', async (req, res) => {
  try {
    const { status, priority } = req.query;
    let query = 'SELECT m.*, u.name AS requester_name FROM maintenance_requests m JOIN users u ON m.user_id = u.id';
    const params = [];
    const conditions = [];
    if (status) { params.push(status); conditions.push(`m.status = $${params.length}`); }
    if (priority) { params.push(priority); conditions.push(`m.priority = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY m.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET maintenance request by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT m.*, u.name AS requester_name FROM maintenance_requests m JOIN users u ON m.user_id = u.id WHERE m.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Maintenance request not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create maintenance request
router.post('/', auth, async (req, res) => {
  try {
    const { user_id, title, description, location, priority, assigned_to } = req.body;
    const result = await pool.query(
      'INSERT INTO maintenance_requests (user_id, title, description, location, priority, assigned_to) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id || req.user.id, title, description, location, priority || 'medium', assigned_to]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update maintenance request
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, location, priority, status, assigned_to } = req.body;
    const resolved_at = status === 'resolved' ? 'CURRENT_TIMESTAMP' : null;
    const result = await pool.query(
      `UPDATE maintenance_requests SET title = $1, description = $2, location = $3, priority = $4, status = $5, assigned_to = $6, resolved_at = ${status === 'resolved' ? 'CURRENT_TIMESTAMP' : '$7'} WHERE id = ${status === 'resolved' ? '$7' : '$8'} RETURNING *`,
      status === 'resolved'
        ? [title, description, location, priority, status, assigned_to, req.params.id]
        : [title, description, location, priority, status, assigned_to, null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Maintenance request not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT resolve maintenance request
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE maintenance_requests SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Maintenance request not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE maintenance request
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM maintenance_requests WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Maintenance request not found' });
    res.json({ message: 'Maintenance request deleted', request: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
