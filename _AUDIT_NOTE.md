# Audit Apply Notes — AICoworkingSpaceManager

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_02.md` (lines 465-514).

## Original audit recommendations

### Existing AI features (10 endpoints)
member-matching, space-optimizer, member-churn, event-recommender,
community-insights, room-optimization, newsletter, pricing-recommendations,
event-suggestions, space-utilization.

### Missing AI counterparts
- `maintenance.js`, `cleaning.js`, `parking.js`, `storage.js`, `phoneBooths.js`
  lack AI endpoints for predictive maintenance, optimal cleaning schedules,
  etc.

### Missing non-AI features
- Guest WiFi / bandwidth management.
- Calendar integration (Google Calendar, Outlook).
- Payment integration (Stripe, Zuora).
- Mobile app for members.

### Custom feature suggestions
- Predictive maintenance & occupancy combining sensors + ML.
- Dynamic pricing & revenue optimization.
- Community growth and viral-loop modeling.
- Amenity utilization prediction.
- Member lifetime value modeling.

## Implemented in this pass (mechanical)

1. `POST /api/ai/predictive-maintenance` — closes the audit gap for
   `maintenance.js`.
2. `POST /api/ai/cleaning-schedule-optimizer` — closes the audit gap for
   `cleaning.js`.

Both added to `backend/routes/ai.js`, follow the existing `callOpenRouter` +
`auth` + `aiRateLimiter` pattern. Stateless (no DB writes), so no schema
changes. Verified with `node --check`.

## Backlog (not implemented this pass)

### Mechanical, low-risk
- `/api/ai/parking-utilization` — parking demand forecast.
- `/api/ai/storage-allocation` — storage assignment optimization.
- `/api/ai/phone-booth-optimization` — booth booking optimization.

### Needs product decision
- Member LTV scoring (decide which signals to use, where to persist).
- Sensor/IoT integration for occupancy data.

### Needs credentials / external SDK
- Google Calendar / Outlook integration.
- Stripe / Zuora billing.
- Guest WiFi RADIUS provisioning.

### Too risky / large refactor
- Mobile app (frontend constraint says no frontend changes).
- Dynamic pricing engine that ties to live billing.

## Apply pass 3 (frontend)

- **Stack:** Vite + React + react-router, JWT Bearer via axios `api` instance (`localStorage.getItem('token')`).
- **Action:** LEFT-AS-IS — pass-2 endpoints already wired.
- **Notes:** `frontend/src/pages/AINewToolsPage.jsx` exposes both pass-2 tools (`predictive-maintenance` and `cleaning-schedule-optimizer`) via tool-id-driven form, calling `api.post('/ai/${tool.id}', payload)`. Route registered at `/ai-new-tools` in `App.jsx`. Existing axios client handles 401 → redirect; backend returns 503 on missing key. Idempotence rule applied.

## Apply pass 4 (mechanical backlog)

- **Action:** LEFT-AS-IS — all three mechanical backlog items were already implemented in a prior pass-4 sweep.
- **Mechanical features verified present (BE + FE):**
  1. `POST /api/ai/parking-utilization` — `backend/routes/ai.js`; surfaced via `frontend/src/pages/AINewToolsPage.jsx` tool card.
  2. `POST /api/ai/storage-allocation` — `backend/routes/ai.js`; FE tool card.
  3. `POST /api/ai/phone-booth-optimization` — `backend/routes/ai.js`; FE tool card.
- **Helper pattern:** `auth` + `aiRateLimiter` + `callOpenRouter` (throws `status=503` when `OPENROUTER_API_KEY` missing). FE uses shared axios `api` (JWT bearer) and surfaces server error via `e.response?.data?.error`. Route `/ai-new-tools` registered in `App.jsx`.
- **Backlog deferred:** Member LTV / IoT occupancy → NEEDS-PRODUCT-DECISION; Calendar / Stripe-Zuora / WiFi RADIUS → NEEDS-CREDS; mobile app + dynamic pricing → TOO-RISKY.
- **Smoke test:** `node --check backend/routes/ai.js` PASS; live HTTP skipped (Postgres not provisioned).
- **Idempotence rule applied** — no duplicate routes, no new deps, no `npm install`.
