/**
 * GET /api/export/occupancy-report
 * CSV export with monthly occupancy statistics.
 *
 * Query params:
 *   months (default 12) — number of past months to include
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

function toCSV(rows, columns) {
  const header = columns.join(',');
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col] !== null && row[col] !== undefined ? String(row[col]) : '';
        // Escape double quotes, wrap in quotes if needed
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      })
      .join(',')
  );
  return [header, ...lines].join('\r\n');
}

// GET /api/export/occupancy-report
router.get('/occupancy-report', auth, async (req, res) => {
  try {
    const months = Math.min(36, Math.max(1, parseInt(req.query.months || 12)));

    // Monthly check-in stats
    const checkinsResult = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', check_in_time), 'YYYY-MM') AS month,
        COUNT(*)                                                  AS total_checkins,
        COUNT(DISTINCT user_id)                                   AS unique_members,
        ROUND(AVG(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600)::numeric, 2) AS avg_hours_per_visit
      FROM checkins
      WHERE check_in_time >= NOW() - INTERVAL '${months} months'
        AND check_out_time IS NOT NULL
      GROUP BY DATE_TRUNC('month', check_in_time)
      ORDER BY 1
    `);

    // Monthly meeting-room booking stats
    const bookingsResult = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', start_time), 'YYYY-MM') AS month,
        COUNT(*)                                              AS total_room_bookings,
        COUNT(DISTINCT user_id)                              AS unique_room_bookers,
        ROUND(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600)::numeric, 2) AS total_room_hours
      FROM meeting_room_bookings
      WHERE start_time >= NOW() - INTERVAL '${months} months'
        AND status = 'confirmed'
      GROUP BY DATE_TRUNC('month', start_time)
      ORDER BY 1
    `);

    // Monthly new-member signups
    const newMembersResult = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COUNT(*) AS new_members
      FROM users
      WHERE created_at >= NOW() - INTERVAL '${months} months'
        AND role = 'member'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY 1
    `);

    // Monthly revenue from invoices
    const revenueResult = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', due_date), 'YYYY-MM') AS month,
        ROUND(SUM(amount)::numeric, 2) AS total_invoiced,
        ROUND(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)::numeric, 2) AS total_collected
      FROM invoices
      WHERE due_date >= NOW() - INTERVAL '${months} months'
      GROUP BY DATE_TRUNC('month', due_date)
      ORDER BY 1
    `);

    // Merge all data by month
    const monthMap = {};

    const ensureMonth = (m) => {
      if (!monthMap[m]) {
        monthMap[m] = {
          month: m,
          total_checkins: 0,
          unique_members: 0,
          avg_hours_per_visit: 0,
          total_room_bookings: 0,
          unique_room_bookers: 0,
          total_room_hours: 0,
          new_members: 0,
          total_invoiced: 0,
          total_collected: 0,
        };
      }
    };

    checkinsResult.rows.forEach((r) => {
      ensureMonth(r.month);
      Object.assign(monthMap[r.month], {
        total_checkins: parseInt(r.total_checkins),
        unique_members: parseInt(r.unique_members),
        avg_hours_per_visit: parseFloat(r.avg_hours_per_visit || 0),
      });
    });

    bookingsResult.rows.forEach((r) => {
      ensureMonth(r.month);
      Object.assign(monthMap[r.month], {
        total_room_bookings: parseInt(r.total_room_bookings),
        unique_room_bookers: parseInt(r.unique_room_bookers),
        total_room_hours: parseFloat(r.total_room_hours || 0),
      });
    });

    newMembersResult.rows.forEach((r) => {
      ensureMonth(r.month);
      monthMap[r.month].new_members = parseInt(r.new_members);
    });

    revenueResult.rows.forEach((r) => {
      ensureMonth(r.month);
      Object.assign(monthMap[r.month], {
        total_invoiced: parseFloat(r.total_invoiced || 0),
        total_collected: parseFloat(r.total_collected || 0),
      });
    });

    const rows = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    const columns = [
      'month',
      'total_checkins',
      'unique_members',
      'avg_hours_per_visit',
      'total_room_bookings',
      'unique_room_bookers',
      'total_room_hours',
      'new_members',
      'total_invoiced',
      'total_collected',
    ];

    const csv = toCSV(rows, columns);
    const filename = `occupancy-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
