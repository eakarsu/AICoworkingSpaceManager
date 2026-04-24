const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all access logs
router.get('/', async (req, res) => {
  try {
    const { user_id, access_type, access_point } = req.query;
    let query = 'SELECT a.*, u.name AS user_name FROM access_logs a JOIN users u ON a.user_id = u.id';
    const params = [];
    const conditions = [];
    if (user_id) { params.push(user_id); conditions.push(`a.user_id = $${params.length}`); }
    if (access_type) { params.push(access_type); conditions.push(`a.access_type = $${params.length}`); }
    if (access_point) { params.push(access_point); conditions.push(`a.access_point = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.timestamp DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET access log by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT a.*, u.name AS user_name FROM access_logs a JOIN users u ON a.user_id = u.id WHERE a.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Access log not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create access log
router.post('/', auth, async (req, res) => {
  try {
    const { user_id, access_point, access_type, method } = req.body;
    const result = await pool.query(
      'INSERT INTO access_logs (user_id, access_point, access_type, method) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id || req.user.id, access_point, access_type, method]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update access log
router.put('/:id', auth, async (req, res) => {
  try {
    const { access_point, access_type, method } = req.body;
    const result = await pool.query(
      'UPDATE access_logs SET access_point = $1, access_type = $2, method = $3 WHERE id = $4 RETURNING *',
      [access_point, access_type, method, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Access log not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE access log
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM access_logs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Access log not found' });
    res.json({ message: 'Access log deleted', log: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
