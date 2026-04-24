const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

// Helper to generate access code
function generateAccessCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// GET all guest wifi entries
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM guest_wifi';
    const params = [];
    if (status) { params.push(status); query += ' WHERE status = $1'; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET guest wifi by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guest_wifi WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Guest wifi entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST generate guest wifi access code
router.post('/', auth, async (req, res) => {
  try {
    const { guest_name, expires_at } = req.body;
    const access_code = generateAccessCode();
    const expiry = expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // default 24h
    const result = await pool.query(
      'INSERT INTO guest_wifi (guest_name, access_code, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [guest_name, access_code, expiry]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update guest wifi
router.put('/:id', auth, async (req, res) => {
  try {
    const { guest_name, expires_at, status } = req.body;
    const result = await pool.query(
      'UPDATE guest_wifi SET guest_name = $1, expires_at = $2, status = $3 WHERE id = $4 RETURNING *',
      [guest_name, expires_at, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Guest wifi entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT revoke access code
router.put('/:id/revoke', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE guest_wifi SET status = 'revoked' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Guest wifi entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE guest wifi entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM guest_wifi WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Guest wifi entry not found' });
    res.json({ message: 'Guest wifi entry deleted', entry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
