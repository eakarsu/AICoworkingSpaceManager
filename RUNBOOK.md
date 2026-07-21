# Governed coworking operations runbook

Install with `scripts/bootstrap.sh`, configure `.env`, migrate explicitly, then run `start.sh`. Startup does not install, seed, manage PostgreSQL, or kill unrelated port owners. Demo seed requires explicit confirmation and is prohibited in production.

The operations migration adds tenant/site boundaries, memberships and revocation, capacity-constrained resources, transactionally serialized overlap protection, visitor consent, incidents, integer-cent invoice/proration state, device/payment/facility outbox failures, and audit events. Generated `gap_*` endpoints are not mounted and the development JWT fallback was removed.

Before production: contract-test each access controller/calendar/payment/accounting/messaging/facility adapter, authenticate and rotate device credentials, load-test concurrent bookings, reconcile payment/refund ledgers, rehearse immediate access revocation, establish visitor retention policy, and validate site-local timezone rules.
