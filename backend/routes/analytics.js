const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all usage analytics
router.get('/', async (req, res) => {
  try {
    const { area, date, start_date, end_date } = req.query;
    let query = 'SELECT * FROM usage_analytics';
    const params = [];
    const conditions = [];
    if (area) { params.push(area); conditions.push(`area = $${params.length}`); }
    if (date) { params.push(date); conditions.push(`date = $${params.length}`); }
    if (start_date) { params.push(start_date); conditions.push(`date >= $${params.length}`); }
    if (end_date) { params.push(end_date); conditions.push(`date <= $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY date DESC, hour ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET peak hours (aggregated)
router.get('/peak-hours', async (req, res) => {
  try {
    const { area } = req.query;
    let query = 'SELECT hour, AVG(occupancy_count) AS avg_occupancy, MAX(occupancy_count) AS max_occupancy FROM usage_analytics';
    const params = [];
    if (area) { params.push(area); query += ' WHERE area = $1'; }
    query += ' GROUP BY hour ORDER BY avg_occupancy DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET popular spaces
router.get('/popular-spaces', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT area, SUM(occupancy_count) AS total_usage, AVG(occupancy_count) AS avg_usage FROM usage_analytics GROUP BY area ORDER BY total_usage DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET daily summary
router.get('/daily-summary', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || 'CURRENT_DATE';
    const result = await pool.query(
      `SELECT area, SUM(occupancy_count) AS total_occupancy, MAX(occupancy_count) AS peak_occupancy, AVG(occupancy_count) AS avg_occupancy FROM usage_analytics WHERE date = $1 GROUP BY area ORDER BY total_occupancy DESC`,
      [date || new Date().toISOString().split('T')[0]]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET analytics by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usage_analytics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Analytics record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create analytics entry
router.post('/', auth, async (req, res) => {
  try {
    const { date, area, hour, occupancy_count } = req.body;
    const result = await pool.query(
      'INSERT INTO usage_analytics (date, area, hour, occupancy_count) VALUES ($1, $2, $3, $4) RETURNING *',
      [date, area, hour, occupancy_count || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update analytics entry
router.put('/:id', auth, async (req, res) => {
  try {
    const { date, area, hour, occupancy_count } = req.body;
    const result = await pool.query(
      'UPDATE usage_analytics SET date = $1, area = $2, hour = $3, occupancy_count = $4 WHERE id = $5 RETURNING *',
      [date, area, hour, occupancy_count, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Analytics record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE analytics entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM usage_analytics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Analytics record not found' });
    res.json({ message: 'Analytics record deleted', record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
