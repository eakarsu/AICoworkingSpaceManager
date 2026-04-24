const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all day passes
router.get('/', async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = 'SELECT dp.*, d.name AS desk_name FROM day_passes dp LEFT JOIN desks d ON dp.desk_id = d.id';
    const params = [];
    const conditions = [];
    if (status) { params.push(status); conditions.push(`dp.status = $${params.length}`); }
    if (date) { params.push(date); conditions.push(`dp.date = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY dp.date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET day pass by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT dp.*, d.name AS desk_name FROM day_passes dp LEFT JOIN desks d ON dp.desk_id = d.id WHERE dp.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Day pass not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create day pass
router.post('/', auth, async (req, res) => {
  try {
    const { guest_name, guest_email, guest_phone, date, desk_id, price } = req.body;
    const result = await pool.query(
      'INSERT INTO day_passes (guest_name, guest_email, guest_phone, date, desk_id, price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [guest_name, guest_email, guest_phone, date, desk_id, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update day pass
router.put('/:id', auth, async (req, res) => {
  try {
    const { guest_name, guest_email, guest_phone, date, desk_id, status, price } = req.body;
    const result = await pool.query(
      'UPDATE day_passes SET guest_name = $1, guest_email = $2, guest_phone = $3, date = $4, desk_id = $5, status = $6, price = $7 WHERE id = $8 RETURNING *',
      [guest_name, guest_email, guest_phone, date, desk_id, status, price, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Day pass not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE day pass
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM day_passes WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Day pass not found' });
    res.json({ message: 'Day pass deleted', dayPass: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
