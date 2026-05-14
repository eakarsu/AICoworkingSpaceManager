const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const axios = require('axios');

const COWORKING_SYSTEM_PROMPT =
  'You are an expert coworking space operations manager. Provide insights on member networking, space optimization, community building, and business growth.';

async function callOpenRouter(prompt, systemPrompt) {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI provider not configured (OPENROUTER_API_KEY missing).');
    err.status = 503;
    throw err;
  }
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt || COWORKING_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:4000',
        'X-Title': 'AI Coworking Space Manager',
      },
    }
  );
  return response.data.choices[0].message.content;
}

// ── Input validation helpers ──────────────────────────────────────────────────

function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  return missing.length ? missing : null;
}

// ── Existing endpoints (model upgraded) ──────────────────────────────────────

// POST /member-matching - Suggest member matches based on skills
router.post('/member-matching', auth, aiRateLimiter, async (req, res) => {
  try {
    const { user_id, member_id } = req.body;
    const targetId = member_id || user_id;
    if (!targetId) {
      return res.status(400).json({ error: 'member_id is required.' });
    }

    const userResult = await pool.query(
      'SELECT id, name, skills, company, bio FROM users WHERE id = $1',
      [targetId]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    const user = userResult.rows[0];

    const membersResult = await pool.query(
      'SELECT id, name, skills, company, bio FROM users WHERE id != $1 AND skills IS NOT NULL',
      [targetId]
    );
    const members = membersResult.rows;

    const prompt = `A coworking space member needs networking suggestions.

Member profile:
- Name: ${user.name}
- Company: ${user.company || 'N/A'}
- Skills: ${user.skills ? user.skills.join(', ') : 'N/A'}
- Bio: ${user.bio || 'N/A'}

Other members in the space:
${members.map((m) => `- ${m.name} (${m.company || 'Independent'}): Skills: ${m.skills ? m.skills.join(', ') : 'N/A'}, Bio: ${m.bio || 'N/A'}`).join('\n')}

Based on complementary skills, shared interests, industry alignment, and potential collaboration opportunities, suggest the top 5 best matches for this member. For each match explain why they would be a good connection and suggest a conversation starter or collaboration idea.
Return as JSON: { "matches": [{ "member_name": "", "reason": "", "collaboration_idea": "", "compatibility_score": 0 }] }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ member: user.name, suggestions: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /space-optimizer - Analyze utilization, suggest layout changes & peak hour management
router.post('/space-optimizer', auth, aiRateLimiter, async (req, res) => {
  try {
    const { booking_history, room_specs } = req.body;

    // Fetch live data to supplement any provided data
    const bookingsResult = await pool.query(
      `SELECT b.*, r.name AS room_name, r.capacity, r.hourly_rate
       FROM meeting_room_bookings b
       JOIN meeting_rooms r ON b.room_id = r.id
       ORDER BY b.start_time DESC
       LIMIT 200`
    );
    const roomsResult = await pool.query('SELECT * FROM meeting_rooms');

    const bookings = booking_history && booking_history.length ? booking_history : bookingsResult.rows;
    const rooms = room_specs && room_specs.length ? room_specs : roomsResult.rows;

    const prompt = `Analyze coworking space utilization and suggest actionable layout improvements.

Meeting Rooms:
${rooms.map((r) => `- ${r.name || r.room_name}: Capacity ${r.capacity}, Rate $${r.hourly_rate || 'N/A'}/hr, Status: ${r.status || 'active'}`).join('\n')}

Recent Booking History (up to 200):
${bookings.map((b) => `- Room: ${b.room_name || b.room}, Start: ${b.start_time}, End: ${b.end_time}, Attendees: ${b.attendees || 'N/A'}, Status: ${b.status}`).join('\n') || 'No booking data'}

Provide:
1. Peak hour analysis and demand patterns
2. Room utilization rates (overbooked vs underutilized)
3. Layout change recommendations with ROI estimates
4. Peak-hour management strategies (dynamic pricing, booking limits)
5. Capacity optimization suggestions
Return as JSON: { "peak_hours": [], "utilization_rates": [], "layout_changes": [], "peak_management_strategies": [], "capacity_recommendations": [] }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ analysis: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /member-churn - Predict churn risk and suggest retention
router.post('/member-churn', auth, aiRateLimiter, async (req, res) => {
  try {
    const { member_id } = req.body;
    if (!member_id) return res.status(400).json({ error: 'member_id is required.' });

    const userResult = await pool.query(
      'SELECT id, name, company, skills, bio, created_at FROM users WHERE id = $1',
      [member_id]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    const user = userResult.rows[0];

    // Gather usage signals
    const [checkinsResult, bookingsResult, postsResult, invoicesResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total, MAX(check_in_time) AS last_checkin,
                AVG(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600) AS avg_hours
         FROM checkins WHERE user_id = $1 AND check_out_time IS NOT NULL`,
        [member_id]
      ),
      pool.query(
        `SELECT COUNT(*) AS total, MAX(start_time) AS last_booking FROM meeting_room_bookings WHERE user_id = $1`,
        [member_id]
      ),
      pool.query(`SELECT COUNT(*) AS total FROM community_posts WHERE user_id = $1`, [member_id]),
      pool.query(
        `SELECT COUNT(*) AS overdue FROM invoices WHERE user_id = $1 AND status = 'overdue'`,
        [member_id]
      ),
    ]);

    const checkins = checkinsResult.rows[0];
    const bookings = bookingsResult.rows[0];
    const posts = postsResult.rows[0];
    const invoices = invoicesResult.rows[0];

    const daysSinceLastCheckin = checkins.last_checkin
      ? Math.floor((Date.now() - new Date(checkins.last_checkin)) / (1000 * 60 * 60 * 24))
      : null;

    const prompt = `Analyze this coworking space member's churn risk based on engagement signals.

Member:
- Name: ${user.name}
- Company: ${user.company || 'Independent'}
- Member since: ${new Date(user.created_at).toLocaleDateString()}

Engagement Data:
- Total check-ins: ${checkins.total}
- Days since last check-in: ${daysSinceLastCheckin !== null ? daysSinceLastCheckin : 'Never checked in'}
- Average hours per visit: ${checkins.avg_hours ? parseFloat(checkins.avg_hours).toFixed(1) : 'N/A'}
- Total meeting room bookings: ${bookings.total}
- Days since last booking: ${bookings.last_booking ? Math.floor((Date.now() - new Date(bookings.last_booking)) / 86400000) : 'Never booked'}
- Community posts: ${posts.total}
- Overdue invoices: ${invoices.overdue}

Provide:
1. Churn Risk Score (0-100, where 100 = certain churn)
2. Churn Risk Category (low/medium/high/critical)
3. Key churn signals driving this assessment
4. Personalized retention interventions ranked by effectiveness
5. Suggested outreach message template
Return as JSON: { "churn_risk_score": 0, "churn_risk_category": "", "key_signals": [], "retention_interventions": [], "outreach_template": "" }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ member: user.name, churn_analysis: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /event-recommender - Suggest events based on member profile
router.post('/event-recommender', auth, aiRateLimiter, async (req, res) => {
  try {
    const { member_profile } = req.body;
    if (!member_profile) return res.status(400).json({ error: 'member_profile is required.' });

    const pastEventsResult = await pool.query(
      `SELECT title, type, attendees_count, capacity, status FROM events ORDER BY event_date DESC LIMIT 20`
    );

    const prompt = `Suggest personalized coworking space events and workshops for this member.

Member Profile:
${JSON.stringify(member_profile, null, 2)}

Past/Upcoming Events (for context):
${pastEventsResult.rows.map((e) => `- ${e.title} (${e.type}): ${e.attendees_count || 0}/${e.capacity} attendees`).join('\n') || 'No events yet'}

Provide 5 tailored event recommendations:
1. Event title and type (workshop/networking/seminar/social)
2. Why this event suits this member's skills/interests
3. Expected format and duration
4. Suggested speakers or activities
5. Potential collaboration opportunities the event unlocks
Return as JSON: { "recommended_events": [{ "title": "", "type": "", "reason": "", "format": "", "duration_hours": 0, "activities": [], "collaboration_opportunities": [] }] }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ recommendations: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /community-insights - Analyze community health and collaboration patterns
router.post('/community-insights', auth, aiRateLimiter, async (req, res) => {
  try {
    const { period_days = 30 } = req.body;
    if (isNaN(Number(period_days)) || Number(period_days) < 1) {
      return res.status(400).json({ error: 'period_days must be a positive number.' });
    }

    const [newMembersResult, checkinsResult, postsResult, eventsResult, bookingsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL '${parseInt(period_days)} days'`
      ),
      pool.query(
        `SELECT COUNT(*) AS total, COUNT(DISTINCT user_id) AS unique_members,
                AVG(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600) AS avg_hours
         FROM checkins WHERE check_in_time >= NOW() - INTERVAL '${parseInt(period_days)} days'
         AND check_out_time IS NOT NULL`
      ),
      pool.query(
        `SELECT COUNT(*) AS total_posts, SUM(likes) AS total_likes, COUNT(DISTINCT user_id) AS active_posters
         FROM community_posts WHERE created_at >= NOW() - INTERVAL '${parseInt(period_days)} days'`
      ),
      pool.query(
        `SELECT COUNT(*) AS total, COUNT(CASE WHEN status='completed' THEN 1 END) AS completed
         FROM events WHERE event_date >= NOW() - INTERVAL '${parseInt(period_days)} days'`
      ),
      pool.query(
        `SELECT COUNT(*) AS total, COUNT(DISTINCT user_id) AS unique_bookers
         FROM meeting_room_bookings WHERE start_time >= NOW() - INTERVAL '${parseInt(period_days)} days'`
      ),
    ]);

    const prompt = `Analyze coworking space community health and collaboration patterns for the last ${period_days} days.

Community Metrics:
- New members joined: ${newMembersResult.rows[0].count}
- Total check-ins: ${checkinsResult.rows[0].total}
- Unique active members: ${checkinsResult.rows[0].unique_members}
- Average hours per visit: ${checkins => checkins}${parseFloat(checkinsResult.rows[0].avg_hours || 0).toFixed(1)}
- Community posts: ${postsResult.rows[0].total_posts}
- Total likes on posts: ${postsResult.rows[0].total_likes}
- Active community contributors: ${postsResult.rows[0].active_posters}
- Events held: ${eventsResult.rows[0].completed}/${eventsResult.rows[0].total}
- Meeting room bookings: ${bookingsResult.rows[0].total} by ${bookingsResult.rows[0].unique_bookers} members

Provide a comprehensive community health report:
1. Community Health Score (1-10)
2. Collaboration activity level assessment
3. Member satisfaction trend analysis
4. Engagement segments (highly engaged / at-risk / dormant)
5. Community-building recommendations for the next ${period_days} days
6. Early warning signs to watch
Return as JSON: { "health_score": 0, "collaboration_level": "", "satisfaction_trend": "", "engagement_segments": {}, "recommendations": [], "early_warnings": [] }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ period_days, community_insights: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /room-optimization - Analyze meeting room usage patterns (existing, upgraded)
router.post('/room-optimization', auth, aiRateLimiter, async (req, res) => {
  try {
    const bookingsResult = await pool.query(
      `SELECT b.*, r.name AS room_name, r.capacity, r.hourly_rate
       FROM meeting_room_bookings b
       JOIN meeting_rooms r ON b.room_id = r.id
       ORDER BY b.start_time DESC
       LIMIT 200`
    );
    const roomsResult = await pool.query('SELECT * FROM meeting_rooms');

    const prompt = `Analyze meeting room usage data and provide optimization recommendations.

Meeting Rooms:
${roomsResult.rows.map((r) => `- ${r.name}: Capacity ${r.capacity}, Rate $${r.hourly_rate}/hr, Status: ${r.status}`).join('\n')}

Recent Bookings (last 200):
${bookingsResult.rows.map((b) => `- Room: ${b.room_name}, Date: ${b.start_time}, Duration: ${b.start_time} to ${b.end_time}, Attendees: ${b.attendees}, Status: ${b.status}`).join('\n')}

Analyze usage patterns and provide:
1. Which rooms are overbooked vs underutilized
2. Peak booking times and days
3. Average utilization rate per room
4. Pricing adjustment recommendations
5. Room configuration change suggestions
Return as JSON: { "analysis": { "utilization_rates": [], "peak_times": [], "recommendations": [] } }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ analysis: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /newsletter - Generate community newsletter (existing, upgraded)
router.post('/newsletter', auth, aiRateLimiter, async (req, res) => {
  try {
    const [eventsResult, newMembersResult, postsResult] = await Promise.all([
      pool.query(
        `SELECT title, description, event_date, type, location FROM events WHERE status = 'upcoming' ORDER BY event_date ASC LIMIT 10`
      ),
      pool.query(
        `SELECT name, company, bio FROM users WHERE created_at >= NOW() - INTERVAL '30 days' ORDER BY created_at DESC LIMIT 10`
      ),
      pool.query(
        `SELECT cp.title, cp.content, cp.category, cp.likes, u.name AS author_name
         FROM community_posts cp JOIN users u ON cp.user_id = u.id
         ORDER BY cp.created_at DESC LIMIT 10`
      ),
    ]);

    const prompt = `Generate an engaging weekly newsletter for coworking space members.

Upcoming Events:
${eventsResult.rows.map((e) => `- ${e.title} (${e.type}) on ${e.event_date} at ${e.location}: ${e.description || ''}`).join('\n') || 'No upcoming events'}

New Members (last 30 days):
${newMembersResult.rows.map((m) => `- ${m.name} from ${m.company || 'Independent'}: ${m.bio || ''}`).join('\n') || 'No new members'}

Recent Community Posts:
${postsResult.rows.map((p) => `- "${p.title}" by ${p.author_name} (${p.category || 'general'}): ${p.likes} likes`).join('\n') || 'No recent posts'}

Generate a warm, professional newsletter with:
1. A catchy subject line
2. Welcome message
3. Spotlight on new members
4. Upcoming events highlights
5. Community highlights from posts
6. A fun tip or quote
Return as JSON: { "subject": "", "sections": [{ "title": "", "content": "" }] }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ newsletter: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /pricing-recommendations - Recommend pricing tiers (existing, upgraded)
router.post('/pricing-recommendations', auth, aiRateLimiter, async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required.' });

    const [checkinsResult, bookingsResult, plansResult, userResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total_checkins, AVG(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600) AS avg_hours
         FROM checkins WHERE user_id = $1 AND check_out_time IS NOT NULL`,
        [user_id]
      ),
      pool.query(
        `SELECT COUNT(*) AS total_bookings FROM meeting_room_bookings WHERE user_id = $1`,
        [user_id]
      ),
      pool.query('SELECT * FROM membership_plans ORDER BY price_monthly'),
      pool.query('SELECT name, company, role FROM users WHERE id = $1', [user_id]),
    ]);

    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const usage = checkinsResult.rows[0];
    const bookings = bookingsResult.rows[0];
    const user = userResult.rows[0];

    const prompt = `Recommend the best membership plan for this coworking space member based on their usage.

User: ${user.name} (${user.company || 'Independent'})
Usage Data:
- Total check-ins: ${usage.total_checkins}
- Average hours per visit: ${usage.avg_hours ? parseFloat(usage.avg_hours).toFixed(1) : 'N/A'}
- Total meeting room bookings: ${bookings.total_bookings}

Available Plans:
${plansResult.rows.map((p) => `- ${p.name} (${p.type}): $${p.price_monthly}/month, Features: ${JSON.stringify(p.features)}`).join('\n')}

Provide:
1. Recommended plan with reasoning
2. Estimated cost savings vs current usage
3. Alternative options
4. Suggestions for add-ons (parking, storage, etc.)
Return as JSON: { "recommended_plan": "", "reasoning": "", "estimated_savings": "", "alternatives": [], "add_on_suggestions": [] }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ user: user.name, recommendations: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /event-suggestions - Suggest new events based on member interests (existing, upgraded)
router.post('/event-suggestions', auth, aiRateLimiter, async (req, res) => {
  try {
    const [membersResult, pastEventsResult] = await Promise.all([
      pool.query(
        `SELECT u.skills, mp.interests FROM users u LEFT JOIN member_profiles mp ON u.id = mp.user_id WHERE u.skills IS NOT NULL OR mp.interests IS NOT NULL`
      ),
      pool.query(
        `SELECT title, type, attendees_count, capacity, status FROM events ORDER BY event_date DESC LIMIT 20`
      ),
    ]);

    const allSkills = membersResult.rows.flatMap((m) => m.skills || []);
    const allInterests = membersResult.rows.flatMap((m) => m.interests || []);

    const prompt = `Suggest new events based on member interests and past event performance.

Member Skills (aggregated): ${[...new Set(allSkills)].join(', ') || 'N/A'}
Member Interests (aggregated): ${[...new Set(allInterests)].join(', ') || 'N/A'}
Total Members with profiles: ${membersResult.rows.length}

Past Events:
${pastEventsResult.rows.map((e) => `- ${e.title} (${e.type}): ${e.attendees_count}/${e.capacity} attendees, Status: ${e.status}`).join('\n') || 'No past events'}

Suggest 5 new events that would appeal to the community. For each event provide:
1. Event title and type
2. Description
3. Expected attendance
4. Best day/time to host
5. Required resources
Return as JSON: { "suggested_events": [{ "title": "", "type": "", "description": "", "expected_attendance": 0, "best_time": "", "resources_needed": [] }] }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ suggestions: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /space-utilization - Analyze space utilization (existing, upgraded)
router.post('/space-utilization', auth, aiRateLimiter, async (req, res) => {
  try {
    const [analyticsResult, desksResult, roomsResult, boothsResult] = await Promise.all([
      pool.query(
        `SELECT area, AVG(occupancy_count) AS avg_occupancy, MAX(occupancy_count) AS peak_occupancy, COUNT(*) AS data_points
         FROM usage_analytics GROUP BY area ORDER BY avg_occupancy DESC`
      ),
      pool.query(`SELECT type, status, COUNT(*) AS count FROM desks GROUP BY type, status`),
      pool.query(
        `SELECT r.name, r.capacity, COUNT(b.id) AS total_bookings
         FROM meeting_rooms r LEFT JOIN meeting_room_bookings b ON r.id = b.room_id AND b.status = 'confirmed'
         GROUP BY r.id, r.name, r.capacity`
      ),
      pool.query(
        `SELECT pb.name, COUNT(b.id) AS total_bookings
         FROM phone_booths pb LEFT JOIN phone_booth_bookings b ON pb.id = b.booth_id AND b.status = 'confirmed'
         GROUP BY pb.id, pb.name`
      ),
    ]);

    const prompt = `Analyze coworking space utilization data and suggest improvements.

Area Utilization:
${analyticsResult.rows.map((a) => `- ${a.area}: Avg occupancy: ${parseFloat(a.avg_occupancy).toFixed(1)}, Peak: ${a.peak_occupancy}, Data points: ${a.data_points}`).join('\n') || 'No analytics data'}

Desk Distribution:
${desksResult.rows.map((d) => `- ${d.type} (${d.status}): ${d.count}`).join('\n') || 'No desk data'}

Meeting Room Usage:
${roomsResult.rows.map((r) => `- ${r.name} (capacity ${r.capacity}): ${r.total_bookings} bookings`).join('\n') || 'No room data'}

Phone Booth Usage:
${boothsResult.rows.map((b) => `- ${b.name}: ${b.total_bookings} bookings`).join('\n') || 'No booth data'}

Provide comprehensive space utilization analysis:
1. Overall utilization score (1-10)
2. Underutilized areas
3. Overcrowded areas
4. Layout change recommendations
5. Suggestions for new amenities or space types
6. Estimated impact of changes
Return as JSON: { "utilization_score": 0, "underutilized": [], "overcrowded": [], "layout_recommendations": [], "new_amenities": [], "estimated_impact": "" }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ analysis: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /predictive-maintenance - Audit recommendation: predictive maintenance
// Stateless analysis given equipment/maintenance history.
router.post('/predictive-maintenance', auth, aiRateLimiter, async (req, res) => {
  try {
    const { equipment, history } = req.body;
    const missing = requireFields(req.body, ['equipment']);
    if (missing) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

    const prompt = `You are reviewing coworking-space equipment to predict maintenance needs.

Equipment list:
${typeof equipment === 'string' ? equipment : JSON.stringify(equipment, null, 2)}

Maintenance history (optional):
${history ? (typeof history === 'string' ? history : JSON.stringify(history, null, 2)) : 'Not provided'}

Provide:
1. RISK SCORE per item (0-100) with rationale.
2. PREDICTED FAILURE WINDOW (e.g., 0-30, 30-90, 90+ days).
3. RECOMMENDED ACTION (inspect / preventive maintenance / replace).
4. PRIORITY ORDER for the next maintenance cycle.
5. COST/RISK SUMMARY across the fleet.

Return as JSON: { "items": [{ "equipment": "", "risk_score": 0, "predicted_window_days": "", "recommended_action": "", "rationale": "" }], "priority_order": [], "summary": "" }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ analysis: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /cleaning-schedule-optimizer - Audit recommendation: optimal cleaning schedules
router.post('/cleaning-schedule-optimizer', auth, aiRateLimiter, async (req, res) => {
  try {
    const { areas, occupancy_pattern, staff_count } = req.body;
    const missing = requireFields(req.body, ['areas']);
    if (missing) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

    const prompt = `You are an expert facilities operations advisor. Optimize a cleaning schedule for the following coworking space.

Areas to clean:
${typeof areas === 'string' ? areas : JSON.stringify(areas, null, 2)}

Occupancy pattern (optional):
${occupancy_pattern ? (typeof occupancy_pattern === 'string' ? occupancy_pattern : JSON.stringify(occupancy_pattern, null, 2)) : 'Not provided'}

Cleaning staff count (optional): ${staff_count || 'Not provided'}

Provide:
1. RECOMMENDED FREQUENCY per area (e.g., daily / 2x daily / weekly).
2. OPTIMAL TIME WINDOWS that minimize disruption to members.
3. STAFF ASSIGNMENT suggestions if staff_count is provided.
4. PRIORITY AREAS (high-touch / restrooms / kitchens).
5. CHECKLIST of tasks per area.

Return as JSON: { "schedule": [{ "area": "", "frequency": "", "time_window": "", "tasks": [] }], "priority_areas": [], "staff_plan": "", "notes": "" }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ analysis: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /parking-utilization - Apply pass 4 backlog: parking demand forecast.
router.post('/parking-utilization', auth, aiRateLimiter, async (req, res) => {
  try {
    const { spaces, demand_history, peak_hours } = req.body;
    const missing = requireFields(req.body, ['spaces']);
    if (missing) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

    const prompt = `You are reviewing parking utilization at a coworking space.

Spaces:
${typeof spaces === 'string' ? spaces : JSON.stringify(spaces, null, 2)}

Demand history (optional):
${demand_history ? (typeof demand_history === 'string' ? demand_history : JSON.stringify(demand_history, null, 2)) : 'Not provided'}

Peak hours (optional): ${peak_hours || 'Not provided'}

Provide:
1. Forecasted utilization by hour/day.
2. Pricing or allocation suggestions.
3. Overflow risk and mitigation.

Return JSON: { "forecast": [], "recommendations": [], "risks": "" }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ analysis: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /storage-allocation - Apply pass 4 backlog: storage assignment optimization.
router.post('/storage-allocation', auth, aiRateLimiter, async (req, res) => {
  try {
    const { units, requests } = req.body;
    const missing = requireFields(req.body, ['units']);
    if (missing) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

    const prompt = `Optimize storage unit allocation for a coworking space.

Storage units:
${typeof units === 'string' ? units : JSON.stringify(units, null, 2)}

Member requests (optional):
${requests ? (typeof requests === 'string' ? requests : JSON.stringify(requests, null, 2)) : 'Not provided'}

Provide:
1. Recommended unit-to-member assignments.
2. Utilization gaps and waitlist suggestions.
3. Pricing tier recommendations.

Return JSON: { "assignments": [], "waitlist": [], "pricing_notes": "" }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ analysis: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /phone-booth-optimization - Apply pass 4 backlog: booth booking optimization.
router.post('/phone-booth-optimization', auth, aiRateLimiter, async (req, res) => {
  try {
    const { booths, bookings } = req.body;
    const missing = requireFields(req.body, ['booths']);
    if (missing) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

    const prompt = `Optimize phone-booth booking patterns.

Booths:
${typeof booths === 'string' ? booths : JSON.stringify(booths, null, 2)}

Bookings (optional):
${bookings ? (typeof bookings === 'string' ? bookings : JSON.stringify(bookings, null, 2)) : 'Not provided'}

Provide:
1. Suggested booking-window policies.
2. Hot/cold booth identification.
3. Capacity expansion or reduction recommendations.

Return JSON: { "policy": "", "hot_booths": [], "cold_booths": [], "capacity_recommendations": "" }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ analysis: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
