const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all amenities
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = 'SELECT * FROM amenities';
    const params = [];
    const conditions = [];
    if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
    if (type) { params.push(type); conditions.push(`type = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET amenity by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM amenities WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Amenity not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create amenity
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, description, status, location } = req.body;
    const result = await pool.query(
      'INSERT INTO amenities (name, type, description, status, location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, type, description, status || 'available', location]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update amenity
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, description, status, location, usage_count } = req.body;
    const result = await pool.query(
      'UPDATE amenities SET name = $1, type = $2, description = $3, status = $4, location = $5, usage_count = $6 WHERE id = $7 RETURNING *',
      [name, type, description, status, location, usage_count, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Amenity not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT increment usage count
router.put('/:id/use', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE amenities SET usage_count = usage_count + 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Amenity not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE amenity
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM amenities WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Amenity not found' });
    res.json({ message: 'Amenity deleted', amenity: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
