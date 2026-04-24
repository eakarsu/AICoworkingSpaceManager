const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all parking spots
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, u.name AS assigned_to_name FROM parking_spots p LEFT JOIN users u ON p.assigned_to = u.id ORDER BY p.floor, p.spot_number'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET parking spot by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, u.name AS assigned_to_name FROM parking_spots p LEFT JOIN users u ON p.assigned_to = u.id WHERE p.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Parking spot not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create parking spot
router.post('/', auth, async (req, res) => {
  try {
    const { spot_number, floor, type, status, assigned_to, vehicle_info } = req.body;
    const result = await pool.query(
      'INSERT INTO parking_spots (spot_number, floor, type, status, assigned_to, vehicle_info) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [spot_number, floor, type, status || 'available', assigned_to, vehicle_info]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update parking spot
router.put('/:id', auth, async (req, res) => {
  try {
    const { spot_number, floor, type, status, assigned_to, vehicle_info } = req.body;
    const result = await pool.query(
      'UPDATE parking_spots SET spot_number = $1, floor = $2, type = $3, status = $4, assigned_to = $5, vehicle_info = $6 WHERE id = $7 RETURNING *',
      [spot_number, floor, type, status, assigned_to, vehicle_info, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Parking spot not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT assign parking spot
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const { user_id, vehicle_info } = req.body;
    const result = await pool.query(
      `UPDATE parking_spots SET assigned_to = $1, vehicle_info = $2, status = 'assigned' WHERE id = $3 RETURNING *`,
      [user_id, vehicle_info, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Parking spot not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT unassign parking spot
router.put('/:id/unassign', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE parking_spots SET assigned_to = NULL, vehicle_info = NULL, status = 'available' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Parking spot not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE parking spot
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM parking_spots WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Parking spot not found' });
    res.json({ message: 'Parking spot deleted', spot: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
