const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all events
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = 'SELECT e.*, u.name AS organizer_name FROM events e JOIN users u ON e.organizer_id = u.id';
    const params = [];
    const conditions = [];
    if (type) { params.push(type); conditions.push(`e.type = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`e.status = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY e.event_date ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET event by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT e.*, u.name AS organizer_name FROM events e JOIN users u ON e.organizer_id = u.id WHERE e.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, event_date, start_time, end_time, location, capacity, organizer_id, type, status } = req.body;
    const result = await pool.query(
      'INSERT INTO events (title, description, event_date, start_time, end_time, location, capacity, organizer_id, type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [title, description, event_date, start_time, end_time, location, capacity, organizer_id || req.user.id, type, status || 'upcoming']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update event
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, event_date, start_time, end_time, location, capacity, attendees_count, type, status } = req.body;
    const result = await pool.query(
      'UPDATE events SET title = $1, description = $2, event_date = $3, start_time = $4, end_time = $5, location = $6, capacity = $7, attendees_count = $8, type = $9, status = $10 WHERE id = $11 RETURNING *',
      [title, description, event_date, start_time, end_time, location, capacity, attendees_count, type, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE event
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted', event: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
