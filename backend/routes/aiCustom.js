/**
 * AI Custom non-CRUD features for AICoworkingSpaceManager (per audit):
 *  1. POST /smart-desk-matching         AI recommends desks based on work style
 *  2. POST /reputation-score             Compute member reputation + badges
 *  3. POST /conflict-resolution-scheduler Suggest mediation rooms/slots
 *  4. POST /revenue-forecasting          Predict revenue, churn, demand
 *  5. POST /facility-health-dashboard    AI insights on facility KPIs
 *  6. POST /mentorship-matching          Pair experienced with newer members
 *  7. POST /resource-sharing-marketplace AI matches supply/demand
 *  8. POST /event-recommendations        Tailored event recs (extended)
 *  GET  /results                         Browse persisted ai_results
 */

const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../middleware/aiHelper');

const router = express.Router();

const SYSTEM = 'You are an expert coworking space operations and community manager. Always respond with valid JSON when requested.';

function uid(req) { return req.user?.id || req.user?.userId; }

// 1) Smart desk matching
router.post('/smart-desk-matching', auth, aiRateLimiter, async (req, res) => {
  try {
    const { user_id, work_style, preferred_zone, date } = req.body;
    const targetId = user_id || uid(req);

    const [userRes, desksRes, recentBookingsRes] = await Promise.all([
      pool.query('SELECT id, name, skills, bio, company FROM users WHERE id=$1', [targetId]),
      pool.query("SELECT * FROM desks WHERE status = 'available' ORDER BY floor, zone"),
      pool.query(`SELECT desk_id, COUNT(*) AS visits FROM checkins WHERE user_id=$1 AND desk_id IS NOT NULL GROUP BY desk_id ORDER BY visits DESC LIMIT 10`, [targetId])
    ]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userRes.rows[0];

    const prompt = `Recommend the best desk for this member.

Member: ${JSON.stringify(user)}
Work Style: ${work_style || 'unspecified'}
Preferred Zone: ${preferred_zone || 'any'}
Booking Date: ${date || 'today'}

Available desks: ${JSON.stringify(desksRes.rows).slice(0, 4000)}
Member's past favorites (desk_id, visit count): ${JSON.stringify(recentBookingsRes.rows)}

Return JSON:
{
  "recommendations": [
    { "desk_id": 0, "desk_name": "string", "score": 0.95, "reason": "why this desk fits", "tradeoffs": "string" }
  ],
  "top_pick": { "desk_id": 0, "desk_name": "string", "rationale": "string" },
  "suggested_amenities": ["string"],
  "noise_profile_match": "quiet|moderate|collaborative",
  "alternative_options": [{ "desk_id": 0, "if_top_unavailable": "string" }]
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.4, maxTokens: 2500 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    await saveAIResult(pool, { feature: 'smart-desk-matching', user_id: targetId, input: { work_style, preferred_zone }, output: parsed, model: r.model, usage: r.usage });
    res.json({ ...parsed, model: r.model, usage: r.usage });
  } catch (err) { res.status(500).json({ error: err.response?.data?.error?.message || err.message }); }
});

// 2) Community reputation score
router.post('/reputation-score', auth, aiRateLimiter, async (req, res) => {
  try {
    const { user_id } = req.body;
    const targetId = user_id || uid(req);

    const [userRes, checkinsRes, eventsRes, postsRes, referralsRes] = await Promise.all([
      pool.query('SELECT id, name, company, created_at FROM users WHERE id=$1', [targetId]),
      pool.query('SELECT COUNT(*) AS total, MAX(check_in_time) AS last FROM checkins WHERE user_id=$1', [targetId]),
      pool.query('SELECT COUNT(*) AS organized FROM events WHERE organizer_id=$1', [targetId]),
      pool.query('SELECT COUNT(*) AS posts, COALESCE(SUM(likes),0) AS likes FROM community_posts WHERE user_id=$1', [targetId]),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='converted') AS converted FROM referrals WHERE referrer_id=$1", [targetId])
    ]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userRes.rows[0];
    const stats = {
      checkins: parseInt(checkinsRes.rows[0].total),
      events_organized: parseInt(eventsRes.rows[0].organized),
      posts: parseInt(postsRes.rows[0].posts),
      post_likes: parseInt(postsRes.rows[0].likes),
      referrals_total: parseInt(referralsRes.rows[0].total),
      referrals_converted: parseInt(referralsRes.rows[0].converted)
    };

    const prompt = `Compute a community reputation profile for this coworking space member.

Member: ${JSON.stringify(user)}
Engagement: ${JSON.stringify(stats)}

Return JSON:
{
  "user_id": ${targetId},
  "reputation_score": 0,
  "tier": "Newcomer|Regular|Connector|Champion|Legend",
  "badges": [
    { "id": "string", "name": "string", "description": "string", "icon": "string" }
  ],
  "rank_estimate": "top X% of members",
  "strengths": ["string"],
  "growth_opportunities": ["string"],
  "next_badge": { "name": "string", "requirements": "string" },
  "summary": "string"
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.4, maxTokens: 2000 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    const output = { ...parsed, computed_stats: stats };
    await saveAIResult(pool, { feature: 'reputation-score', user_id: targetId, input: { user_id: targetId }, output, model: r.model, usage: r.usage });
    res.json({ ...output, model: r.model, usage: r.usage });
  } catch (err) { res.status(500).json({ error: err.response?.data?.error?.message || err.message }); }
});

// 3) Conflict resolution scheduler
router.post('/conflict-resolution-scheduler', auth, aiRateLimiter, async (req, res) => {
  try {
    const { participants, conflict_summary, urgency } = req.body;
    if (!conflict_summary) return res.status(400).json({ error: 'conflict_summary is required' });

    const roomsRes = await pool.query('SELECT * FROM meeting_rooms WHERE status=$1 ORDER BY capacity DESC LIMIT 10', ['available']);

    const prompt = `Schedule a conflict resolution session for these participants.

Participants: ${JSON.stringify(participants || [])}
Conflict Summary: ${conflict_summary}
Urgency: ${urgency || 'medium'}
Available rooms: ${JSON.stringify(roomsRes.rows)}

Return JSON:
{
  "recommended_room": { "room_id": 0, "name": "string", "rationale": "why this room is appropriate" },
  "suggested_time_window": "ISO timestamp range",
  "duration_minutes": 60,
  "session_type": "private_mediation|facilitated_discussion|peer_moderation",
  "agenda": ["string"],
  "ground_rules": ["string"],
  "mediator_recommendation": { "needed": true, "profile": "string" },
  "preparation_steps": ["string"],
  "follow_up_plan": "string"
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.4, maxTokens: 2000 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    await saveAIResult(pool, { feature: 'conflict-resolution-scheduler', user_id: uid(req), input: { participants, urgency }, output: parsed, model: r.model, usage: r.usage });
    res.json({ ...parsed, model: r.model, usage: r.usage });
  } catch (err) { res.status(500).json({ error: err.response?.data?.error?.message || err.message }); }
});

// 4) Revenue forecasting
router.post('/revenue-forecasting', auth, aiRateLimiter, async (req, res) => {
  try {
    const { horizon_months = 6 } = req.body;

    const [members, plans, invoices, churn] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role='member'"),
      pool.query('SELECT name, type, price_monthly FROM membership_plans'),
      pool.query("SELECT status, COUNT(*) AS count, SUM(amount) AS total FROM invoices WHERE created_at >= NOW() - INTERVAL '6 months' GROUP BY status"),
      pool.query(`SELECT COUNT(*) AS active FROM users u WHERE EXISTS (SELECT 1 FROM checkins c WHERE c.user_id=u.id AND c.check_in_time >= NOW() - INTERVAL '30 days')`)
    ]);

    const stats = {
      total_members: parseInt(members.rows[0].count),
      plans: plans.rows,
      invoice_breakdown: invoices.rows,
      active_members_30d: parseInt(churn.rows[0].active)
    };

    const prompt = `Forecast revenue for the next ${horizon_months} months for this coworking space.

Current state: ${JSON.stringify(stats)}

Return JSON:
{
  "horizon_months": ${horizon_months},
  "monthly_forecast": [
    { "month": "YYYY-MM", "predicted_revenue": 0, "confidence": "low|medium|high", "drivers": ["string"] }
  ],
  "annualized_revenue_estimate": 0,
  "churn_risk_estimate_pct": 0,
  "predicted_new_members": 0,
  "demand_seasonality": [{ "period": "string", "expected_change_pct": 0 }],
  "pricing_optimization": [{ "plan": "string", "suggested_change": "string", "expected_impact": "string" }],
  "growth_levers": ["string"],
  "executive_summary": "string"
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.3, maxTokens: 3000 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    const output = { ...parsed, computed_stats: stats };
    await saveAIResult(pool, { feature: 'revenue-forecasting', user_id: uid(req), input: { horizon_months }, output, model: r.model, usage: r.usage });
    res.json({ ...output, model: r.model, usage: r.usage });
  } catch (err) { res.status(500).json({ error: err.response?.data?.error?.message || err.message }); }
});

// 5) Facility health dashboard
router.post('/facility-health-dashboard', auth, aiRateLimiter, async (req, res) => {
  try {
    const [maintenance, cleaning, amenities, deskUtil] = await Promise.all([
      pool.query("SELECT status, priority, COUNT(*) AS count FROM maintenance_requests WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY status, priority"),
      pool.query("SELECT status, COUNT(*) AS count FROM cleaning_schedules GROUP BY status"),
      pool.query('SELECT status, COUNT(*) AS count FROM amenities GROUP BY status'),
      pool.query('SELECT status, COUNT(*) AS count FROM desks GROUP BY status')
    ]);

    const stats = {
      maintenance_30d: maintenance.rows,
      cleaning_status: cleaning.rows,
      amenity_status: amenities.rows,
      desk_status: deskUtil.rows
    };

    const prompt = `Generate a facility health dashboard summary based on these operational metrics.

Operational Stats: ${JSON.stringify(stats)}

Return JSON:
{
  "overall_health_score": 0,
  "status": "excellent|good|fair|poor|critical",
  "kpis": [
    { "name": "string", "value": "string", "trend": "up|down|stable", "target_met": true, "comment": "string" }
  ],
  "alerts": [
    { "severity": "info|warning|critical", "title": "string", "description": "string", "recommended_action": "string" }
  ],
  "maintenance_priority_queue": [{ "rank": 1, "issue": "string", "action": "string" }],
  "predicted_failures": [{ "asset": "string", "estimated_days": 0, "probability": 0.0 }],
  "improvement_recommendations": ["string"],
  "executive_summary": "string"
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.4, maxTokens: 2500 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    const output = { ...parsed, raw_stats: stats };
    await saveAIResult(pool, { feature: 'facility-health-dashboard', user_id: uid(req), input: {}, output, model: r.model, usage: r.usage });
    res.json({ ...output, model: r.model, usage: r.usage });
  } catch (err) { res.status(500).json({ error: err.response?.data?.error?.message || err.message }); }
});

// 6) Mentorship matching
router.post('/mentorship-matching', auth, aiRateLimiter, async (req, res) => {
  try {
    const { mentee_id, focus_area } = req.body;
    if (!mentee_id) return res.status(400).json({ error: 'mentee_id is required' });

    const [menteeRes, candidateRes] = await Promise.all([
      pool.query('SELECT id, name, skills, company, bio FROM users WHERE id=$1', [mentee_id]),
      pool.query("SELECT id, name, skills, company, bio, created_at FROM users WHERE id <> $1 AND skills IS NOT NULL ORDER BY created_at ASC LIMIT 30", [mentee_id])
    ]);
    if (menteeRes.rows.length === 0) return res.status(404).json({ error: 'Mentee not found' });
    const mentee = menteeRes.rows[0];

    const prompt = `Match this mentee with the most suitable mentor candidates from the coworking space.

Mentee: ${JSON.stringify(mentee)}
Focus area: ${focus_area || 'general professional growth'}
Candidate mentors: ${JSON.stringify(candidateRes.rows).slice(0, 4000)}

Return JSON:
{
  "mentee_id": ${mentee_id},
  "matches": [
    {
      "mentor_id": 0,
      "mentor_name": "string",
      "compatibility_score": 0.95,
      "why_good_match": "string",
      "suggested_session_format": "1:1|group|workshop|shadowing",
      "first_topic": "string"
    }
  ],
  "top_match_id": 0,
  "alternative_resources": ["string"],
  "introduction_message_template": "Suggested opening message"
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.4, maxTokens: 2500 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    await saveAIResult(pool, { feature: 'mentorship-matching', user_id: uid(req), input: { mentee_id, focus_area }, output: parsed, model: r.model, usage: r.usage });
    res.json({ ...parsed, model: r.model, usage: r.usage });
  } catch (err) { res.status(500).json({ error: err.response?.data?.error?.message || err.message }); }
});

// 7) Resource sharing marketplace
router.post('/resource-sharing-marketplace', auth, aiRateLimiter, async (req, res) => {
  try {
    const { offer, request, category } = req.body;
    if (!offer && !request) return res.status(400).json({ error: 'offer or request is required' });

    const postsRes = await pool.query(
      "SELECT cp.title, cp.content, cp.category, cp.created_at, u.name AS author_name FROM community_posts cp JOIN users u ON cp.user_id = u.id WHERE cp.category IN ('marketplace','offer','request','share') OR cp.category = $1 ORDER BY cp.created_at DESC LIMIT 50",
      [category || 'marketplace']
    );

    const prompt = `Match supply and demand in the coworking space resource-sharing marketplace.

User Offer: ${offer || 'none'}
User Request: ${request || 'none'}
Category: ${category || 'general'}
Existing posts to match against: ${JSON.stringify(postsRes.rows).slice(0, 4000)}

Return JSON:
{
  "match_type": "offer_match|request_match|both|none",
  "matches": [
    { "post_title": "string", "author": "string", "fit_score": 0.0, "match_reason": "string", "next_step": "string" }
  ],
  "draft_post": { "title": "string", "content": "string", "category": "string" },
  "pricing_suggestions": [{ "type": "string", "suggested_value": "string" }],
  "trust_tips": ["string"],
  "summary": "string"
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.5, maxTokens: 2500 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    await saveAIResult(pool, { feature: 'resource-sharing-marketplace', user_id: uid(req), input: { offer, request, category }, output: parsed, model: r.model, usage: r.usage });
    res.json({ ...parsed, model: r.model, usage: r.usage });
  } catch (err) { res.status(500).json({ error: err.response?.data?.error?.message || err.message }); }
});

// 8) Browse persisted ai_results (paginated)
router.get('/results', auth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const { feature, user_id } = req.query;

    await pool.query(`CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY, feature VARCHAR(100) NOT NULL, user_id INTEGER,
      input JSONB, output JSONB, model VARCHAR(255), usage JSONB, created_at TIMESTAMP DEFAULT NOW()
    )`);

    const params = []; const conds = [];
    if (feature) { params.push(feature); conds.push(`feature = $${params.length}`); }
    if (user_id) { params.push(parseInt(user_id)); conds.push(`user_id = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const countR = await pool.query(`SELECT COUNT(*) FROM ai_results ${where}`, params);
    const total = parseInt(countR.rows[0].count);
    params.push(limit, offset);
    const dataR = await pool.query(`SELECT * FROM ai_results ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    res.json({ data: dataR.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/results/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM ai_results WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
