const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all invoices
router.get('/', async (req, res) => {
  try {
    const { status, user_id } = req.query;
    let query = 'SELECT i.*, u.name AS user_name, u.email AS user_email FROM invoices i JOIN users u ON i.user_id = u.id';
    const params = [];
    const conditions = [];
    if (status) { params.push(status); conditions.push(`i.status = $${params.length}`); }
    if (user_id) { params.push(user_id); conditions.push(`i.user_id = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY i.due_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET invoice by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT i.*, u.name AS user_name, u.email AS user_email FROM invoices i JOIN users u ON i.user_id = u.id WHERE i.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create invoice
router.post('/', auth, async (req, res) => {
  try {
    const { user_id, amount, description, status, due_date } = req.body;
    const result = await pool.query(
      'INSERT INTO invoices (user_id, amount, description, status, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, amount, description, status || 'pending', due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update invoice
router.put('/:id', auth, async (req, res) => {
  try {
    const { amount, description, status, due_date, paid_date } = req.body;
    const result = await pool.query(
      'UPDATE invoices SET amount = $1, description = $2, status = $3, due_date = $4, paid_date = $5 WHERE id = $6 RETURNING *',
      [amount, description, status, due_date, paid_date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT mark invoice as paid
router.put('/:id/pay', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE invoices SET status = 'paid', paid_date = CURRENT_DATE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE invoice
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted', invoice: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
