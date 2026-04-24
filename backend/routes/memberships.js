const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all membership plans
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM membership_plans ORDER BY price_monthly ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET membership plan by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM membership_plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Membership plan not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create membership plan
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, price_monthly, features, max_members } = req.body;
    const result = await pool.query(
      'INSERT INTO membership_plans (name, type, price_monthly, features, max_members) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, type, price_monthly, features || '[]', max_members || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update membership plan
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, price_monthly, features, max_members } = req.body;
    const result = await pool.query(
      'UPDATE membership_plans SET name = $1, type = $2, price_monthly = $3, features = $4, max_members = $5 WHERE id = $6 RETURNING *',
      [name, type, price_monthly, features, max_members, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Membership plan not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE membership plan
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM membership_plans WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Membership plan not found' });
    res.json({ message: 'Membership plan deleted', plan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
