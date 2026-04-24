const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');
const { auth, adminOnly, staffOrAdmin, JWT_SECRET } = require('./middleware/auth');

const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================================
// Middleware
// ============================================================
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ============================================================
// Auth Routes
// ============================================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, company, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, company, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, company, phone, avatar_url, created_at`,
      [email, password_hash, name, company || null, phone || null]
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password_hash
    const { password_hash, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, name, role, company, skills, bio, phone, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Users Routes
// ============================================================
app.get('/api/users', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, role, company, skills, bio, phone, avatar_url, created_at FROM users ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/api/users/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, role, company, skills, bio, phone, avatar_url, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Membership Plans Routes
// ============================================================
app.get('/api/membership-plans', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM membership_plans ORDER BY price_monthly');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/api/membership-plans/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM membership_plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Desks Routes
// ============================================================
app.get('/api/desks', auth, async (req, res) => {
  try {
    const { floor, status, type } = req.query;
    let query = 'SELECT d.*, u.name as assigned_to_name FROM desks d LEFT JOIN users u ON d.assigned_to = u.id WHERE 1=1';
    const params = [];

    if (floor) { params.push(floor); query += ` AND d.floor = $${params.length}`; }
    if (status) { params.push(status); query += ` AND d.status = $${params.length}`; }
    if (type) { params.push(type); query += ` AND d.type = $${params.length}`; }

    query += ' ORDER BY d.name';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/api/desks/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT d.*, u.name as assigned_to_name FROM desks d LEFT JOIN users u ON d.assigned_to = u.id WHERE d.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Desk not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Meeting Rooms Routes
// ============================================================
app.get('/api/meeting-rooms', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM meeting_rooms ORDER BY floor, name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/api/meeting-rooms/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM meeting_rooms WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Meeting room not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Meeting Room Bookings Routes
// ============================================================
app.get('/api/meeting-room-bookings', auth, async (req, res) => {
  try {
    const { room_id, user_id, date } = req.query;
    let query = `SELECT b.*, r.name as room_name, u.name as user_name
                 FROM meeting_room_bookings b
                 JOIN meeting_rooms r ON b.room_id = r.id
                 JOIN users u ON b.user_id = u.id WHERE 1=1`;
    const params = [];

    if (room_id) { params.push(room_id); query += ` AND b.room_id = $${params.length}`; }
    if (user_id) { params.push(user_id); query += ` AND b.user_id = $${params.length}`; }
    if (date) { params.push(date); query += ` AND DATE(b.start_time) = $${params.length}`; }

    query += ' ORDER BY b.start_time';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/meeting-room-bookings', auth, async (req, res) => {
  try {
    const { room_id, title, start_time, end_time, attendees } = req.body;
    const result = await db.query(
      `INSERT INTO meeting_room_bookings (room_id, user_id, title, start_time, end_time, attendees)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [room_id, req.user.id, title, start_time, end_time, attendees || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Phone Booths Routes
// ============================================================
app.get('/api/phone-booths', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM phone_booths ORDER BY floor, name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Phone Booth Bookings Routes
// ============================================================
app.get('/api/phone-booth-bookings', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, p.name as booth_name, u.name as user_name
       FROM phone_booth_bookings b
       JOIN phone_booths p ON b.booth_id = p.id
       JOIN users u ON b.user_id = u.id
       ORDER BY b.start_time`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/phone-booth-bookings', auth, async (req, res) => {
  try {
    const { booth_id, start_time, end_time } = req.body;
    const result = await db.query(
      `INSERT INTO phone_booth_bookings (booth_id, user_id, start_time, end_time)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [booth_id, req.user.id, start_time, end_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Checkins Routes
// ============================================================
app.get('/api/checkins', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, u.name as user_name, d.name as desk_name
       FROM checkins c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN desks d ON c.desk_id = d.id
       ORDER BY c.check_in_time DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/checkins', auth, async (req, res) => {
  try {
    const { desk_id } = req.body;
    const result = await db.query(
      `INSERT INTO checkins (user_id, desk_id) VALUES ($1, $2) RETURNING *`,
      [req.user.id, desk_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.put('/api/checkins/:id/checkout', auth, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE checkins SET check_out_time = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Checkin not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Invoices Routes
// ============================================================
app.get('/api/invoices', auth, async (req, res) => {
  try {
    const { user_id, status } = req.query;
    let query = `SELECT i.*, u.name as user_name FROM invoices i JOIN users u ON i.user_id = u.id WHERE 1=1`;
    const params = [];

    if (user_id) { params.push(user_id); query += ` AND i.user_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND i.status = $${params.length}`; }

    query += ' ORDER BY i.due_date DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Visitors Routes
// ============================================================
app.get('/api/visitors', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT v.*, u.name as host_name FROM visitors v JOIN users u ON v.host_user_id = u.id ORDER BY v.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/visitors', auth, async (req, res) => {
  try {
    const { visitor_name, visitor_email, visitor_company, purpose, check_in_time } = req.body;
    const result = await db.query(
      `INSERT INTO visitors (host_user_id, visitor_name, visitor_email, visitor_company, purpose, check_in_time)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, visitor_name, visitor_email, visitor_company, purpose, check_in_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Events Routes
// ============================================================
app.get('/api/events', async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = `SELECT e.*, u.name as organizer_name FROM events e JOIN users u ON e.organizer_id = u.id WHERE 1=1`;
    const params = [];

    if (status) { params.push(status); query += ` AND e.status = $${params.length}`; }
    if (type) { params.push(type); query += ` AND e.type = $${params.length}`; }

    query += ' ORDER BY e.event_date, e.start_time';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, u.name as organizer_name FROM events e JOIN users u ON e.organizer_id = u.id WHERE e.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/events', auth, async (req, res) => {
  try {
    const { title, description, event_date, start_time, end_time, location, capacity, type } = req.body;
    const result = await db.query(
      `INSERT INTO events (title, description, event_date, start_time, end_time, location, capacity, organizer_id, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, description, event_date, start_time, end_time, location, capacity, req.user.id, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Member Profiles Routes
// ============================================================
app.get('/api/member-profiles', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT mp.*, u.name, u.email, u.company, u.avatar_url
       FROM member_profiles mp JOIN users u ON mp.user_id = u.id ORDER BY u.name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/api/member-profiles/:userId', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT mp.*, u.name, u.email, u.company, u.bio, u.avatar_url
       FROM member_profiles mp JOIN users u ON mp.user_id = u.id WHERE mp.user_id = $1`,
      [req.params.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profile not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Maintenance Requests Routes
// ============================================================
app.get('/api/maintenance-requests', auth, async (req, res) => {
  try {
    const { status, priority } = req.query;
    let query = `SELECT m.*, u.name as user_name FROM maintenance_requests m JOIN users u ON m.user_id = u.id WHERE 1=1`;
    const params = [];

    if (status) { params.push(status); query += ` AND m.status = $${params.length}`; }
    if (priority) { params.push(priority); query += ` AND m.priority = $${params.length}`; }

    query += ' ORDER BY m.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/maintenance-requests', auth, async (req, res) => {
  try {
    const { title, description, location, priority } = req.body;
    const result = await db.query(
      `INSERT INTO maintenance_requests (user_id, title, description, location, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, title, description, location, priority || 'medium']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.put('/api/maintenance-requests/:id', auth, async (req, res) => {
  try {
    const { status, assigned_to } = req.body;
    const resolved_at = status === 'resolved' ? 'CURRENT_TIMESTAMP' : null;
    const result = await db.query(
      `UPDATE maintenance_requests SET status = $1, assigned_to = $2,
       resolved_at = ${status === 'resolved' ? 'CURRENT_TIMESTAMP' : '$4'}
       WHERE id = $3 RETURNING *`,
      status === 'resolved'
        ? [status, assigned_to, req.params.id]
        : [status, assigned_to, req.params.id, null]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Day Passes Routes
// ============================================================
app.get('/api/day-passes', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT dp.*, d.name as desk_name FROM day_passes dp LEFT JOIN desks d ON dp.desk_id = d.id ORDER BY dp.date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/day-passes', auth, async (req, res) => {
  try {
    const { guest_name, guest_email, guest_phone, date, desk_id, price } = req.body;
    const result = await db.query(
      `INSERT INTO day_passes (guest_name, guest_email, guest_phone, date, desk_id, price)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [guest_name, guest_email, guest_phone, date, desk_id, price || 35.00]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Teams Routes
// ============================================================
app.get('/api/teams', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, mp.name as plan_name, u.name as contact_name
       FROM teams t
       LEFT JOIN membership_plans mp ON t.plan_id = mp.id
       LEFT JOIN users u ON t.primary_contact_id = u.id
       ORDER BY t.name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/api/teams/:id/members', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT tm.*, u.name, u.email, u.company, u.avatar_url
       FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Parking Spots Routes
// ============================================================
app.get('/api/parking-spots', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, u.name as assigned_to_name FROM parking_spots p LEFT JOIN users u ON p.assigned_to = u.id ORDER BY p.spot_number`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Storage Lockers Routes
// ============================================================
app.get('/api/storage-lockers', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, u.name as assigned_to_name FROM storage_lockers s LEFT JOIN users u ON s.assigned_to = u.id ORDER BY s.locker_number`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Mail & Packages Routes
// ============================================================
app.get('/api/mail-packages', auth, async (req, res) => {
  try {
    const { user_id, status } = req.query;
    let query = `SELECT m.*, u.name as user_name FROM mail_packages m JOIN users u ON m.user_id = u.id WHERE 1=1`;
    const params = [];

    if (user_id) { params.push(user_id); query += ` AND m.user_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND m.status = $${params.length}`; }

    query += ' ORDER BY m.received_date DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Amenities Routes
// ============================================================
app.get('/api/amenities', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM amenities ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Access Logs Routes
// ============================================================
app.get('/api/access-logs', auth, async (req, res) => {
  try {
    const { user_id, date } = req.query;
    let query = `SELECT a.*, u.name as user_name FROM access_logs a JOIN users u ON a.user_id = u.id WHERE 1=1`;
    const params = [];

    if (user_id) { params.push(user_id); query += ` AND a.user_id = $${params.length}`; }
    if (date) { params.push(date); query += ` AND DATE(a.timestamp) = $${params.length}`; }

    query += ' ORDER BY a.timestamp DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Community Posts Routes
// ============================================================
app.get('/api/community-posts', auth, async (req, res) => {
  try {
    const { category } = req.query;
    let query = `SELECT cp.*, u.name as author_name, u.avatar_url as author_avatar
                 FROM community_posts cp JOIN users u ON cp.user_id = u.id WHERE 1=1`;
    const params = [];

    if (category) { params.push(category); query += ` AND cp.category = $${params.length}`; }

    query += ' ORDER BY cp.pinned DESC, cp.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/community-posts', auth, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const result = await db.query(
      `INSERT INTO community_posts (user_id, title, content, category)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, title, content, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Referrals Routes
// ============================================================
app.get('/api/referrals', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, u.name as referrer_name FROM referrals r JOIN users u ON r.referrer_id = u.id ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/referrals', auth, async (req, res) => {
  try {
    const { referee_name, referee_email } = req.body;
    const result = await db.query(
      `INSERT INTO referrals (referrer_id, referee_name, referee_email)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, referee_name, referee_email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Usage Analytics Routes
// ============================================================
app.get('/api/usage-analytics', auth, async (req, res) => {
  try {
    const { date, area } = req.query;
    let query = 'SELECT * FROM usage_analytics WHERE 1=1';
    const params = [];

    if (date) { params.push(date); query += ` AND date = $${params.length}`; }
    if (area) { params.push(area); query += ` AND area = $${params.length}`; }

    query += ' ORDER BY date DESC, hour';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Cleaning Schedules Routes
// ============================================================
app.get('/api/cleaning-schedules', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM cleaning_schedules WHERE 1=1';
    const params = [];

    if (status) { params.push(status); query += ` AND status = $${params.length}`; }

    query += ' ORDER BY scheduled_time';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Guest WiFi Routes
// ============================================================
app.get('/api/guest-wifi', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM guest_wifi ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/guest-wifi', auth, async (req, res) => {
  try {
    const { guest_name, expires_at } = req.body;
    const access_code = 'GUEST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await db.query(
      `INSERT INTO guest_wifi (guest_name, access_code, expires_at)
       VALUES ($1, $2, $3) RETURNING *`,
      [guest_name, access_code, expires_at]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Dashboard / Stats Route
// ============================================================
app.get('/api/dashboard/stats', auth, async (req, res) => {
  try {
    const [members, desks, activeCheckins, pendingMaintenance, todayVisitors, upcomingEvents] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users WHERE role = $1', ['member']),
      db.query('SELECT status, COUNT(*) FROM desks GROUP BY status'),
      db.query('SELECT COUNT(*) FROM checkins WHERE check_out_time IS NULL'),
      db.query('SELECT COUNT(*) FROM maintenance_requests WHERE status IN ($1, $2)', ['open', 'in_progress']),
      db.query('SELECT COUNT(*) FROM visitors WHERE DATE(check_in_time) = CURRENT_DATE OR (status = $1 AND DATE(created_at) = CURRENT_DATE)', ['expected']),
      db.query('SELECT COUNT(*) FROM events WHERE status = $1', ['upcoming']),
    ]);

    res.json({
      total_members: parseInt(members.rows[0].count),
      desk_status: desks.rows.reduce((acc, row) => ({ ...acc, [row.status]: parseInt(row.count) }), {}),
      active_checkins: parseInt(activeCheckins.rows[0].count),
      pending_maintenance: parseInt(pendingMaintenance.rows[0].count),
      today_visitors: parseInt(todayVisitors.rows[0].count),
      upcoming_events: parseInt(upcomingEvents.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// AI Routes (OpenRouter)
// ============================================================
app.use('/api/ai', aiRoutes);

// ============================================================
// Generic CRUD: PUT and DELETE for all entities
// ============================================================
const crudTables = {
  'membership-plans': 'membership_plans',
  'desks': 'desks',
  'meeting-rooms': 'meeting_rooms',
  'meeting-room-bookings': 'meeting_room_bookings',
  'phone-booths': 'phone_booths',
  'phone-booth-bookings': 'phone_booth_bookings',
  'checkins': 'checkins',
  'invoices': 'invoices',
  'visitors': 'visitors',
  'events': 'events',
  'maintenance-requests': 'maintenance_requests',
  'day-passes': 'day_passes',
  'teams': 'teams',
  'parking-spots': 'parking_spots',
  'storage-lockers': 'storage_lockers',
  'mail-packages': 'mail_packages',
  'amenities': 'amenities',
  'access-logs': 'access_logs',
  'community-posts': 'community_posts',
  'referrals': 'referrals',
  'cleaning-schedules': 'cleaning_schedules',
  'guest-wifi': 'guest_wifi',
};

// Generic PUT (update) for all entities
Object.entries(crudTables).forEach(([route, table]) => {
  app.put(`/api/${route}/:id`, auth, async (req, res) => {
    try {
      const fields = Object.keys(req.body);
      if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map(f => req.body[f]);
      values.push(req.params.id);
      const result = await db.query(
        `UPDATE ${table} SET ${setClause} WHERE id = $${values.length} RETURNING *`,
        values
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found.' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error.' });
    }
  });

  // Generic DELETE for all entities
  app.delete(`/api/${route}/:id`, auth, async (req, res) => {
    try {
      const result = await db.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found.' });
      res.json({ message: 'Deleted successfully.', deleted: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error.' });
    }
  });

  // Generic GET by ID (for tables that don't have a specific one)
  app.get(`/api/${route}/:id`, auth, async (req, res) => {
    try {
      const result = await db.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found.' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error.' });
    }
  });

  // Generic POST create (for tables that don't have a specific one)
  app.post(`/api/${route}`, auth, async (req, res) => {
    try {
      const fields = Object.keys(req.body);
      if (fields.length === 0) return res.status(400).json({ error: 'No fields provided.' });
      const columns = fields.join(', ');
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const values = fields.map(f => req.body[f]);
      const result = await db.query(
        `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error.' });
    }
  });
});

// Like a community post
app.post('/api/community-posts/:id/like', auth, async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE community_posts SET likes = likes + 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// Health Check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// 404 handler
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ============================================================
// Error handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  console.log(`AI Coworking Space Manager API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
