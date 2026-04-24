const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');
const axios = require('axios');

async function callOpenRouter(prompt) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
    messages: [{ role: 'user', content: prompt }]
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.choices[0].message.content;
}

// POST /member-matching - Suggest member matches based on skills
router.post('/member-matching', auth, async (req, res) => {
  try {
    const { user_id } = req.body;

    // Get the user's skills
    const userResult = await pool.query(
      'SELECT id, name, skills, company, bio FROM users WHERE id = $1',
      [user_id]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userResult.rows[0];

    // Get all other members with their skills
    const membersResult = await pool.query(
      'SELECT id, name, skills, company, bio FROM users WHERE id != $1 AND skills IS NOT NULL',
      [user_id]
    );
    const members = membersResult.rows;

    const prompt = `You are a coworking space community manager AI. A member needs networking suggestions.

Member profile:
- Name: ${user.name}
- Company: ${user.company || 'N/A'}
- Skills: ${user.skills ? user.skills.join(', ') : 'N/A'}
- Bio: ${user.bio || 'N/A'}

Other members in the space:
${members.map(m => `- ${m.name} (${m.company || 'Independent'}): Skills: ${m.skills ? m.skills.join(', ') : 'N/A'}, Bio: ${m.bio || 'N/A'}`).join('\n')}

Based on complementary skills, shared interests, and potential collaboration opportunities, suggest the top 5 best matches for this member. For each match, explain why they would be a good connection and suggest a conversation starter or collaboration idea. Return the response as JSON with format: { "matches": [{ "member_name": "", "reason": "", "collaboration_idea": "" }] }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ user: user.name, suggestions: aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /room-optimization - Analyze meeting room usage patterns
router.post('/room-optimization', auth, async (req, res) => {
  try {
    // Get meeting room bookings with room details
    const bookingsResult = await pool.query(
      `SELECT b.*, r.name AS room_name, r.capacity, r.hourly_rate
       FROM meeting_room_bookings b
       JOIN meeting_rooms r ON b.room_id = r.id
       ORDER BY b.start_time DESC
       LIMIT 200`
    );
    const bookings = bookingsResult.rows;

    const roomsResult = await pool.query('SELECT * FROM meeting_rooms');
    const rooms = roomsResult.rows;

    const prompt = `You are a coworking space operations AI. Analyze the meeting room usage data and provide optimization recommendations.

Meeting Rooms:
${rooms.map(r => `- ${r.name}: Capacity ${r.capacity}, Rate $${r.hourly_rate}/hr, Status: ${r.status}`).join('\n')}

Recent Bookings (last 200):
${bookings.map(b => `- Room: ${b.room_name}, Date: ${b.start_time}, Duration: ${b.start_time} to ${b.end_time}, Attendees: ${b.attendees}, Status: ${b.status}`).join('\n')}

Analyze the usage patterns and provide:
1. Which rooms are overbooked vs underutilized
2. Peak booking times and days
3. Average utilization rate per room
4. Recommendations for pricing adjustments
5. Suggestions for room configuration changes
Return as JSON: { "analysis": { "utilization_rates": [], "peak_times": [], "recommendations": [] } }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ analysis: aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /newsletter - Generate community newsletter
router.post('/newsletter', auth, async (req, res) => {
  try {
    // Get recent events
    const eventsResult = await pool.query(
      `SELECT title, description, event_date, type, location FROM events WHERE status = 'upcoming' ORDER BY event_date ASC LIMIT 10`
    );

    // Get new members (last 30 days)
    const newMembersResult = await pool.query(
      `SELECT name, company, bio FROM users WHERE created_at >= NOW() - INTERVAL '30 days' ORDER BY created_at DESC LIMIT 10`
    );

    // Get recent community posts
    const postsResult = await pool.query(
      `SELECT cp.title, cp.content, cp.category, cp.likes, u.name AS author_name
       FROM community_posts cp JOIN users u ON cp.user_id = u.id
       ORDER BY cp.created_at DESC LIMIT 10`
    );

    const prompt = `You are a coworking space community manager. Generate an engaging weekly newsletter for the coworking space members.

Upcoming Events:
${eventsResult.rows.map(e => `- ${e.title} (${e.type}) on ${e.event_date} at ${e.location}: ${e.description || ''}`).join('\n') || 'No upcoming events'}

New Members (last 30 days):
${newMembersResult.rows.map(m => `- ${m.name} from ${m.company || 'Independent'}: ${m.bio || ''}`).join('\n') || 'No new members'}

Recent Community Posts:
${postsResult.rows.map(p => `- "${p.title}" by ${p.author_name} (${p.category || 'general'}): ${p.likes} likes`).join('\n') || 'No recent posts'}

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
    res.status(500).json({ error: err.message });
  }
});

// POST /pricing-recommendations - Recommend pricing tiers based on usage
router.post('/pricing-recommendations', auth, async (req, res) => {
  try {
    const { user_id } = req.body;

    // Get user's checkin data
    const checkinsResult = await pool.query(
      `SELECT COUNT(*) AS total_checkins, AVG(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600) AS avg_hours
       FROM checkins WHERE user_id = $1 AND check_out_time IS NOT NULL`,
      [user_id]
    );

    // Get user's meeting room bookings
    const bookingsResult = await pool.query(
      `SELECT COUNT(*) AS total_bookings FROM meeting_room_bookings WHERE user_id = $1`,
      [user_id]
    );

    // Get available plans
    const plansResult = await pool.query('SELECT * FROM membership_plans ORDER BY price_monthly');

    // Get user info
    const userResult = await pool.query('SELECT name, company, role FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const usage = checkinsResult.rows[0];
    const bookings = bookingsResult.rows[0];
    const user = userResult.rows[0];

    const prompt = `You are a coworking space pricing advisor AI. Recommend the best membership plan for this user based on their usage.

User: ${user.name} (${user.company || 'Independent'})
Usage Data:
- Total check-ins: ${usage.total_checkins}
- Average hours per visit: ${usage.avg_hours ? parseFloat(usage.avg_hours).toFixed(1) : 'N/A'}
- Total meeting room bookings: ${bookings.total_bookings}

Available Plans:
${plansResult.rows.map(p => `- ${p.name} (${p.type}): $${p.price_monthly}/month, Features: ${JSON.stringify(p.features)}`).join('\n')}

Provide:
1. Recommended plan with reasoning
2. Estimated cost savings vs current usage
3. Alternative options
4. Suggestions for add-ons (parking, storage, etc.)
Return as JSON: { "recommended_plan": "", "reasoning": "", "estimated_savings": "", "alternatives": [], "add_on_suggestions": [] }`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ user: user.name, recommendations: aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /event-suggestions - Suggest new events based on member interests
router.post('/event-suggestions', auth, async (req, res) => {
  try {
    // Get member interests and skills
    const membersResult = await pool.query(
      `SELECT u.skills, mp.interests FROM users u LEFT JOIN member_profiles mp ON u.id = mp.user_id WHERE u.skills IS NOT NULL OR mp.interests IS NOT NULL`
    );

    // Get past events
    const pastEventsResult = await pool.query(
      `SELECT title, type, attendees_count, capacity, status FROM events ORDER BY event_date DESC LIMIT 20`
    );

    const allSkills = membersResult.rows.flatMap(m => m.skills || []);
    const allInterests = membersResult.rows.flatMap(m => m.interests || []);

    const prompt = `You are a coworking space event planner AI. Suggest new events based on member interests and past event performance.

Member Skills (aggregated): ${[...new Set(allSkills)].join(', ') || 'N/A'}
Member Interests (aggregated): ${[...new Set(allInterests)].join(', ') || 'N/A'}
Total Members with profiles: ${membersResult.rows.length}

Past Events:
${pastEventsResult.rows.map(e => `- ${e.title} (${e.type}): ${e.attendees_count}/${e.capacity} attendees, Status: ${e.status}`).join('\n') || 'No past events'}

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
    res.status(500).json({ error: err.message });
  }
});

// POST /space-utilization - Analyze space utilization and suggest layout changes
router.post('/space-utilization', auth, async (req, res) => {
  try {
    // Get analytics data
    const analyticsResult = await pool.query(
      `SELECT area, AVG(occupancy_count) AS avg_occupancy, MAX(occupancy_count) AS peak_occupancy, COUNT(*) AS data_points
       FROM usage_analytics GROUP BY area ORDER BY avg_occupancy DESC`
    );

    // Get desk utilization
    const desksResult = await pool.query(
      `SELECT type, status, COUNT(*) AS count FROM desks GROUP BY type, status`
    );

    // Get meeting room utilization
    const roomsResult = await pool.query(
      `SELECT r.name, r.capacity, COUNT(b.id) AS total_bookings
       FROM meeting_rooms r LEFT JOIN meeting_room_bookings b ON r.id = b.room_id AND b.status = 'confirmed'
       GROUP BY r.id, r.name, r.capacity`
    );

    // Get phone booth utilization
    const boothsResult = await pool.query(
      `SELECT pb.name, COUNT(b.id) AS total_bookings
       FROM phone_booths pb LEFT JOIN phone_booth_bookings b ON pb.id = b.booth_id AND b.status = 'confirmed'
       GROUP BY pb.id, pb.name`
    );

    const prompt = `You are a coworking space layout optimization AI. Analyze the space utilization data and suggest improvements.

Area Utilization:
${analyticsResult.rows.map(a => `- ${a.area}: Avg occupancy: ${parseFloat(a.avg_occupancy).toFixed(1)}, Peak: ${a.peak_occupancy}, Data points: ${a.data_points}`).join('\n') || 'No analytics data'}

Desk Distribution:
${desksResult.rows.map(d => `- ${d.type} (${d.status}): ${d.count}`).join('\n') || 'No desk data'}

Meeting Room Usage:
${roomsResult.rows.map(r => `- ${r.name} (capacity ${r.capacity}): ${r.total_bookings} bookings`).join('\n') || 'No room data'}

Phone Booth Usage:
${boothsResult.rows.map(b => `- ${b.name}: ${b.total_bookings} bookings`).join('\n') || 'No booth data'}

Provide a comprehensive space utilization analysis:
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
