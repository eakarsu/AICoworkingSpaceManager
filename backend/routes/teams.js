const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET all teams
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.*, u.name AS primary_contact_name, mp.name AS plan_name FROM teams t LEFT JOIN users u ON t.primary_contact_id = u.id LEFT JOIN membership_plans mp ON t.plan_id = mp.id ORDER BY t.name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET team by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.*, u.name AS primary_contact_name, mp.name AS plan_name FROM teams t LEFT JOIN users u ON t.primary_contact_id = u.id LEFT JOIN membership_plans mp ON t.plan_id = mp.id WHERE t.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Team not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET team members
router.get('/:id/members', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT tm.*, u.name, u.email, u.company FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = $1',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create team
router.post('/', auth, async (req, res) => {
  try {
    const { name, company, plan_id, primary_contact_id, billing_email } = req.body;
    const result = await pool.query(
      'INSERT INTO teams (name, company, plan_id, primary_contact_id, billing_email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, company, plan_id, primary_contact_id, billing_email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add member to team
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { user_id, role } = req.body;
    const result = await pool.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, user_id, role || 'member']
    );
    // Update member count
    await pool.query('UPDATE teams SET member_count = member_count + 1 WHERE id = $1', [req.params.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update team
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, company, plan_id, primary_contact_id, billing_email } = req.body;
    const result = await pool.query(
      'UPDATE teams SET name = $1, company = $2, plan_id = $3, primary_contact_id = $4, billing_email = $5 WHERE id = $6 RETURNING *',
      [name, company, plan_id, primary_contact_id, billing_email, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Team not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove member from team
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.params.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Team member not found' });
    await pool.query('UPDATE teams SET member_count = GREATEST(member_count - 1, 0) WHERE id = $1', [req.params.id]);
    res.json({ message: 'Member removed from team' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE team
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM teams WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Team not found' });
    res.json({ message: 'Team deleted', team: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
