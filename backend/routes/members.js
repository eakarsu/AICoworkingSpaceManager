const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all members (directory)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.company, u.skills, u.bio, u.phone, u.avatar_url, u.created_at,
              mp.interests, mp.availability, mp.linkedin, mp.website
       FROM users u LEFT JOIN member_profiles mp ON u.id = mp.user_id
       ORDER BY u.name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET member by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.company, u.skills, u.bio, u.phone, u.avatar_url, u.created_at,
              mp.interests, mp.availability, mp.linkedin, mp.website
       FROM users u LEFT JOIN member_profiles mp ON u.id = mp.user_id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create member profile
router.post('/', auth, async (req, res) => {
  try {
    const { user_id, skills, interests, availability, linkedin, website } = req.body;
    const result = await pool.query(
      'INSERT INTO member_profiles (user_id, skills, interests, availability, linkedin, website) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id || req.user.id, skills, interests, availability, linkedin, website]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update member profile
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, company, skills, bio, phone, avatar_url } = req.body;
    // Update users table
    const userResult = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), company = COALESCE($2, company), skills = COALESCE($3, skills), bio = COALESCE($4, bio), phone = COALESCE($5, phone), avatar_url = COALESCE($6, avatar_url) WHERE id = $7 RETURNING id, name, email, role, company, skills, bio, phone, avatar_url',
      [name, company, skills, bio, phone, avatar_url, req.params.id]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    res.json(userResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update member extended profile
router.put('/:id/profile', auth, async (req, res) => {
  try {
    const { skills, interests, availability, linkedin, website } = req.body;
    const result = await pool.query(
      `INSERT INTO member_profiles (user_id, skills, interests, availability, linkedin, website)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET skills = $2, interests = $3, availability = $4, linkedin = $5, website = $6
       RETURNING *`,
      [req.params.id, skills, interests, availability, linkedin, website]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE member profile
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM member_profiles WHERE user_id = $1', [req.params.id]);
    res.json({ message: 'Member profile deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
