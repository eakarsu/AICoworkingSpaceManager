BEGIN;
CREATE TABLE IF NOT EXISTS cowork_sites (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_key TEXT NOT NULL,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id,site_key)
);
CREATE TABLE IF NOT EXISTS cowork_memberships (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_id UUID NOT NULL REFERENCES cowork_sites(id),
  member_reference TEXT NOT NULL,
  plan_code TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE,
  state TEXT NOT NULL CHECK (state IN ('pending','active','suspended','cancelled','expired')),
  access_revoked_at TIMESTAMPTZ,
  UNIQUE (tenant_id,site_id,member_reference)
);
CREATE TABLE IF NOT EXISTS cowork_resources (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_id UUID NOT NULL REFERENCES cowork_sites(id),
  resource_key TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('desk','room','phone_booth','parking','storage','amenity')),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (tenant_id,site_id,resource_key)
);
CREATE TABLE IF NOT EXISTS cowork_bookings (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_id UUID NOT NULL REFERENCES cowork_sites(id),
  resource_id UUID NOT NULL REFERENCES cowork_resources(id),
  member_reference TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  attendees INTEGER NOT NULL DEFAULT 1 CHECK (attendees > 0),
  state TEXT NOT NULL DEFAULT 'confirmed' CHECK (state IN ('held','confirmed','checked_in','completed','cancelled','refunded')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  UNIQUE (tenant_id,idempotency_key)
);
CREATE OR REPLACE FUNCTION reject_cowork_booking_overlap() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.resource_id::text));
  IF NEW.state NOT IN ('cancelled','refunded') AND EXISTS (
    SELECT 1 FROM cowork_bookings b WHERE b.resource_id=NEW.resource_id AND b.id<>NEW.id
      AND b.state NOT IN ('cancelled','refunded') AND b.starts_at < NEW.ends_at AND b.ends_at > NEW.starts_at
  ) THEN RAISE EXCEPTION 'resource_booking_conflict' USING ERRCODE='23P01'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS cowork_booking_overlap_guard ON cowork_bookings;
CREATE TRIGGER cowork_booking_overlap_guard BEFORE INSERT OR UPDATE ON cowork_bookings
FOR EACH ROW EXECUTE FUNCTION reject_cowork_booking_overlap();
CREATE TABLE IF NOT EXISTS cowork_access_grants (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_id UUID NOT NULL REFERENCES cowork_sites(id),
  subject_reference TEXT NOT NULL,
  credential_reference TEXT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','active','revoked','expired')),
  revoked_by TEXT,
  revoked_at TIMESTAMPTZ,
  CHECK (valid_until > valid_from)
);
CREATE TABLE IF NOT EXISTS cowork_visitors (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, site_id UUID NOT NULL REFERENCES cowork_sites(id),
  host_reference TEXT NOT NULL, visitor_reference TEXT NOT NULL, consent_reference TEXT NOT NULL,
  expected_at TIMESTAMPTZ NOT NULL, checked_in_at TIMESTAMPTZ, checked_out_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS cowork_incidents (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, site_id UUID NOT NULL REFERENCES cowork_sites(id),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')), category TEXT NOT NULL,
  description TEXT NOT NULL, state TEXT NOT NULL CHECK (state IN ('open','investigating','resolved')), reported_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cowork_invoices (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, membership_id UUID NOT NULL REFERENCES cowork_memberships(id),
  period_start DATE NOT NULL, period_end DATE NOT NULL, subtotal_cents BIGINT NOT NULL, adjustment_cents BIGINT NOT NULL DEFAULT 0,
  tax_cents BIGINT NOT NULL DEFAULT 0, currency CHAR(3) NOT NULL, status TEXT NOT NULL CHECK (status IN ('draft','issued','paid','refunded','void')),
  CHECK (period_end >= period_start)
);
CREATE TABLE IF NOT EXISTS cowork_integration_outbox (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, site_id UUID NOT NULL REFERENCES cowork_sites(id), provider TEXT NOT NULL,
  operation TEXT NOT NULL, idempotency_key TEXT NOT NULL, payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivering','delivered','failed','dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0, last_error_code TEXT, provider_reference TEXT, next_attempt_at TIMESTAMPTZ,
  UNIQUE (tenant_id,provider,idempotency_key)
);
CREATE TABLE IF NOT EXISTS cowork_audit_events (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, site_id UUID NOT NULL REFERENCES cowork_sites(id), actor_id TEXT NOT NULL,
  action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id UUID NOT NULL, evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cowork_booking_availability ON cowork_bookings(resource_id,starts_at,ends_at);
CREATE INDEX IF NOT EXISTS idx_cowork_outbox_retry ON cowork_integration_outbox(status,next_attempt_at);
COMMIT;
