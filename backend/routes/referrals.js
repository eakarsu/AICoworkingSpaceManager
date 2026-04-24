const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all referrals
router.get('/', async (req, res) => {
  try {
    const { status, referrer_id } = req.query;
    let query = 'SELECT r.*, u.name AS referrer_name FROM referrals r JOIN users u ON r.referrer_id = u.id';
    const params = [];
    const conditions = [];
    if (status) { params.push(status); conditions.push(`r.status = $${params.length}`); }
    if (referrer_id) { params.push(referrer_id); conditions.push(`r.referrer_id = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY r.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET referral by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, u.name AS referrer_name FROM referrals r JOIN users u ON r.referrer_id = u.id WHERE r.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Referral not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create referral
router.post('/', auth, async (req, res) => {
  try {
    const { referrer_id, referee_name, referee_email } = req.body;
    const result = await pool.query(
      'INSERT INTO referrals (referrer_id, referee_name, referee_email) VALUES ($1, $2, $3) RETURNING *',
      [referrer_id || req.user.id, referee_name, referee_email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update referral
router.put('/:id', auth, async (req, res) => {
  try {
    const { referee_name, referee_email, status, reward_amount } = req.body;
    const result = await pool.query(
      'UPDATE referrals SET referee_name = $1, referee_email = $2, status = $3, reward_amount = $4 WHERE id = $5 RETURNING *',
      [referee_name, referee_email, status, reward_amount, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Referral not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE referral
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM referrals WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Referral not found' });
    res.json({ message: 'Referral deleted', referral: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
