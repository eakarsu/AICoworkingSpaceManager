const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all meeting rooms
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meeting_rooms ORDER BY floor, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET meeting room by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meeting_rooms WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Meeting room not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create meeting room
router.post('/', auth, async (req, res) => {
  try {
    const { name, capacity, floor, amenities, hourly_rate, status } = req.body;
    const result = await pool.query(
      'INSERT INTO meeting_rooms (name, capacity, floor, amenities, hourly_rate, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, capacity, floor, amenities || '[]', hourly_rate, status || 'available']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update meeting room
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, capacity, floor, amenities, hourly_rate, status } = req.body;
    const result = await pool.query(
      'UPDATE meeting_rooms SET name = $1, capacity = $2, floor = $3, amenities = $4, hourly_rate = $5, status = $6 WHERE id = $7 RETURNING *',
      [name, capacity, floor, amenities, hourly_rate, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Meeting room not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE meeting room
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM meeting_rooms WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Meeting room not found' });
    res.json({ message: 'Meeting room deleted', room: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BOOKINGS ---

// GET all bookings (optionally filter by room_id)
router.get('/bookings/all', async (req, res) => {
  try {
    const { room_id } = req.query;
    let query = 'SELECT b.*, r.name AS room_name, u.name AS user_name FROM meeting_room_bookings b JOIN meeting_rooms r ON b.room_id = r.id JOIN users u ON b.user_id = u.id';
    const params = [];
    if (room_id) {
      query += ' WHERE b.room_id = $1';
      params.push(room_id);
    }
    query += ' ORDER BY b.start_time DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET bookings for a specific room
router.get('/:id/bookings', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT b.*, u.name AS user_name FROM meeting_room_bookings b JOIN users u ON b.user_id = u.id WHERE b.room_id = $1 ORDER BY b.start_time DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST book a meeting room
router.post('/:id/book', auth, async (req, res) => {
  try {
    const room_id = req.params.id;
    const { user_id, title, start_time, end_time, attendees } = req.body;

    // Check for conflicts
    const conflicts = await pool.query(
      `SELECT id FROM meeting_room_bookings WHERE room_id = $1 AND status = 'confirmed' AND start_time < $3 AND end_time > $2`,
      [room_id, start_time, end_time]
    );
    if (conflicts.rows.length > 0) {
      return res.status(409).json({ error: 'Room is already booked for that time slot' });
    }

    const result = await pool.query(
      'INSERT INTO meeting_room_bookings (room_id, user_id, title, start_time, end_time, attendees) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [room_id, user_id || req.user.id, title, start_time, end_time, attendees || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update booking
router.put('/bookings/:bookingId', auth, async (req, res) => {
  try {
    const { title, start_time, end_time, attendees, status } = req.body;
    const result = await pool.query(
      'UPDATE meeting_room_bookings SET title = $1, start_time = $2, end_time = $3, attendees = $4, status = $5 WHERE id = $6 RETURNING *',
      [title, start_time, end_time, attendees, status, req.params.bookingId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE cancel booking
router.delete('/bookings/:bookingId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE meeting_room_bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [req.params.bookingId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking cancelled', booking: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
