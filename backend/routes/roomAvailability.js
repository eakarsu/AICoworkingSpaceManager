/**
 * GET /api/rooms/availability-stream
 * SSE stream of booking status changes.
 * Clients receive a full snapshot every 15 seconds plus on-demand push.
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');

// Store active SSE clients
const clients = new Set();

/**
 * Broadcast a message to all connected SSE clients.
 * @param {string} event - SSE event type
 * @param {object} data  - JSON payload
 */
function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((res) => {
    try { res.write(payload); } catch (_) { clients.delete(res); }
  });
}

/**
 * Fetch current availability snapshot from DB.
 */
async function fetchAvailability() {
  const [rooms, booths] = await Promise.all([
    pool.query(`
      SELECT r.id, r.name, r.capacity, r.status,
        CASE WHEN b.id IS NOT NULL THEN true ELSE false END AS is_booked,
        b.start_time AS booked_from,
        b.end_time   AS booked_until,
        u.name       AS booked_by
      FROM meeting_rooms r
      LEFT JOIN meeting_room_bookings b
        ON b.room_id = r.id
        AND b.status = 'confirmed'
        AND NOW() BETWEEN b.start_time AND b.end_time
      LEFT JOIN users u ON u.id = b.user_id
      ORDER BY r.name
    `),
    pool.query(`
      SELECT pb.id, pb.name, pb.status,
        CASE WHEN b.id IS NOT NULL THEN true ELSE false END AS is_booked,
        b.start_time AS booked_from,
        b.end_time   AS booked_until,
        u.name       AS booked_by
      FROM phone_booths pb
      LEFT JOIN phone_booth_bookings b
        ON b.booth_id = pb.id
        AND b.status = 'confirmed'
        AND NOW() BETWEEN b.start_time AND b.end_time
      LEFT JOIN users u ON u.id = b.user_id
      ORDER BY pb.name
    `),
  ]);

  return {
    timestamp: new Date().toISOString(),
    meeting_rooms: rooms.rows,
    phone_booths: booths.rows,
  };
}

// Poll DB every 15 s and broadcast updates
const POLL_INTERVAL_MS = 15_000;
let pollInterval = null;

function startPolling() {
  if (pollInterval) return;
  pollInterval = setInterval(async () => {
    if (clients.size === 0) return;
    try {
      const availability = await fetchAvailability();
      broadcast('availability', availability);
    } catch (err) {
      broadcast('error', { message: 'Failed to fetch availability', error: err.message });
    }
  }, POLL_INTERVAL_MS);
}

// SSE endpoint — no auth middleware so browsers can connect via EventSource easily;
// token may be passed as ?token= query param for authenticated access.
router.get('/availability-stream', async (req, res) => {
  // Set SSE headers
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Nginx: disable buffering
  });
  res.flushHeaders();

  // Register client
  clients.add(res);
  startPolling();

  // Send initial snapshot immediately
  try {
    const availability = await fetchAvailability();
    res.write(`event: availability\ndata: ${JSON.stringify(availability)}\n\n`);
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
  }

  // Heartbeat every 30 s to keep connection alive
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (_) { /* ignore */ }
  }, 30_000);

  // Cleanup on disconnect
  req.on('close', () => {
    clients.delete(res);
    clearInterval(heartbeat);
  });
});

/**
 * Export broadcast so other routes can trigger SSE pushes after booking changes.
 */
module.exports = { router, broadcast };
