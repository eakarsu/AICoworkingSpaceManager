const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all community posts
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT cp.*, u.name AS author_name, u.avatar_url AS author_avatar FROM community_posts cp JOIN users u ON cp.user_id = u.id';
    const params = [];
    if (category) { params.push(category); query += ' WHERE cp.category = $1'; }
    query += ' ORDER BY cp.pinned DESC, cp.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET post by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT cp.*, u.name AS author_name, u.avatar_url AS author_avatar FROM community_posts cp JOIN users u ON cp.user_id = u.id WHERE cp.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create community post
router.post('/', auth, async (req, res) => {
  try {
    const { user_id, title, content, category } = req.body;
    const result = await pool.query(
      'INSERT INTO community_posts (user_id, title, content, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id || req.user.id, title, content, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update community post
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, category, pinned } = req.body;
    const result = await pool.query(
      'UPDATE community_posts SET title = $1, content = $2, category = $3, pinned = $4 WHERE id = $5 RETURNING *',
      [title, content, category, pinned || false, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT like a post
router.put('/:id/like', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE community_posts SET likes = likes + 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT unlike a post
router.put('/:id/unlike', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE community_posts SET likes = GREATEST(likes - 1, 0) WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE community post
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM community_posts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted', post: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
