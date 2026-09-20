-- ============================================================================
-- ONE-TIME BACKFILL: trip.create audit log entries for pre-existing trips
-- ============================================================================
-- This migration is idempotent: safe to run multiple times without creating
-- duplicates. It only inserts trip.create audit records for trips that do
-- NOT already have one.
--
-- HOW TO RUN:
--   1. Execute the PREVIEW SELECT first to see which trips will be backfilled.
--   2. Execute the INSERT to perform the backfill.
--   3. Execute the VERIFICATION SELECT to confirm results.
-- ============================================================================

-- ============================================================================
-- STEP 1: PREVIEW — Which trips will be backfilled?
-- ============================================================================
-- Run this first. It shows every trip and whether a trip.create audit record
-- already exists. Only rows with has_audit = false will be backfilled.

SELECT
  t.id AS trip_id,
  t.title,
  t.created_at,
  t.agency_id,
  EXISTS (
    SELECT 1 FROM public.audit_logs al
    WHERE al.resource_type = 'trip'
      AND al.action = 'trip.create'
      AND al.resource_id = t.id::text
  ) AS has_audit
FROM public.trips t
ORDER BY t.created_at ASC;

-- ============================================================================
-- STEP 2: BACKFILL INSERT (idempotent)
-- ============================================================================
-- Inserts a trip.create audit record only for trips that do NOT already
-- have one. Uses NOT EXISTS to guarantee no duplicates even if run again.

INSERT INTO public.audit_logs (
  agency_id,
  actor_user_id,
  actor_username,
  action,
  resource_type,
  resource_id,
  description,
  before_data,
  after_data,
  metadata,
  created_at
)
SELECT
  t.agency_id,
  (
    SELECT p.id FROM public.profiles p
    WHERE p.username = 'administrator'
      AND p.agency_id = t.agency_id
    LIMIT 1
  ) AS actor_user_id,
  'administrator' AS actor_username,
  'trip.create' AS action,
  'trip' AS resource_type,
  t.id::text AS resource_id,
  'Trip creation event backfilled because the trip was created before trip audit logging was enabled' AS description,
  NULL::jsonb AS before_data,
  to_jsonb(t.*) AS after_data,
  jsonb_build_object(
    'backfilled', true,
    'reason', 'Trip existed before trip audit logging was enabled'
  ) AS metadata,
  now() AS created_at
FROM public.trips t
WHERE NOT EXISTS (
  SELECT 1 FROM public.audit_logs al
  WHERE al.resource_type = 'trip'
    AND al.action = 'trip.create'
    AND al.resource_id = t.id::text
);

-- ============================================================================
-- STEP 3: VERIFICATION — Confirm results
-- ============================================================================
-- Run this after the backfill. You should see:
--   - trip.create entries for every existing trip (backfilled or original)
--   - metadata containing "backfilled": true for the backfilled ones
--   - No duplicate entries

SELECT
  al.action,
  al.resource_type,
  al.resource_id,
  al.description,
  al.actor_username,
  al.metadata,
  al.created_at
FROM public.audit_logs al
WHERE al.resource_type = 'trip'
ORDER BY al.created_at DESC;
