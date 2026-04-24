const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all phone booths
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM phone_booths ORDER BY floor, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET phone booth by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM phone_booths WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Phone booth not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create phone booth
router.post('/', auth, async (req, res) => {
  try {
    const { name, floor, status } = req.body;
    const result = await pool.query(
      'INSERT INTO phone_booths (name, floor, status) VALUES ($1, $2, $3) RETURNING *',
      [name, floor, status || 'available']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update phone booth
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, floor, status } = req.body;
    const result = await pool.query(
      'UPDATE phone_booths SET name = $1, floor = $2, status = $3 WHERE id = $4 RETURNING *',
      [name, floor, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Phone booth not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE phone booth
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM phone_booths WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Phone booth not found' });
    res.json({ message: 'Phone booth deleted', booth: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BOOKINGS ---

// GET all phone booth bookings
router.get('/bookings/all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT b.*, pb.name AS booth_name, u.name AS user_name FROM phone_booth_bookings b JOIN phone_booths pb ON b.booth_id = pb.id JOIN users u ON b.user_id = u.id ORDER BY b.start_time DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET bookings for a specific booth
router.get('/:id/bookings', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT b.*, u.name AS user_name FROM phone_booth_bookings b JOIN users u ON b.user_id = u.id WHERE b.booth_id = $1 ORDER BY b.start_time DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST book a phone booth
router.post('/:id/book', auth, async (req, res) => {
  try {
    const booth_id = req.params.id;
    const { user_id, start_time, end_time } = req.body;

    // Check for conflicts
    const conflicts = await pool.query(
      `SELECT id FROM phone_booth_bookings WHERE booth_id = $1 AND status = 'confirmed' AND start_time < $3 AND end_time > $2`,
      [booth_id, start_time, end_time]
    );
    if (conflicts.rows.length > 0) {
      return res.status(409).json({ error: 'Phone booth is already booked for that time slot' });
    }

    const result = await pool.query(
      'INSERT INTO phone_booth_bookings (booth_id, user_id, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *',
      [booth_id, user_id || req.user.id, start_time, end_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update booking
router.put('/bookings/:bookingId', auth, async (req, res) => {
  try {
    const { start_time, end_time, status } = req.body;
    const result = await pool.query(
      'UPDATE phone_booth_bookings SET start_time = $1, end_time = $2, status = $3 WHERE id = $4 RETURNING *',
      [start_time, end_time, status, req.params.bookingId]
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
      `UPDATE phone_booth_bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [req.params.bookingId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking cancelled', booking: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
