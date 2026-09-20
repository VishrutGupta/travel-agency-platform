-- ====================================================================
-- MIGRATION 006: Fix RLS recursive self-referencing patterns
--
-- ROOT CAUSE: RLS policies on public.profiles queried public.profiles
-- from within the same table's policies. While PostgreSQL handles this
-- by excluding the current policy from inner subqueries, the Supabase
-- PostgREST layer can produce empty result sets when the session is
-- established via signInWithPassword in the same request.
--
-- FIX: Create SECURITY DEFINER helper functions that bypass RLS, and
-- replace all self-referencing subqueries with calls to these functions.
-- ====================================================================

-- 1. CREATE is_current_user_owner() FUNCTION
CREATE OR REPLACE FUNCTION public.is_current_user_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 2. CREATE current_user_agency_id() FUNCTION
CREATE OR REPLACE FUNCTION public.current_user_agency_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT agency_id FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 3. DROP old recursive profiles policies
DROP POLICY IF EXISTS "Only one owner profile allowed" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;

-- 4. RECREATE profiles policies using SECURITY DEFINER functions
CREATE POLICY "Only one owner profile allowed"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    NOT public.is_current_user_owner()
    OR id = auth.uid()
  );

CREATE POLICY "Owners can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_current_user_owner());

-- 5. DROP and recreate agencies policy using current_user_agency_id()
DROP POLICY IF EXISTS "Owners can update their own agency" ON public.agencies;

CREATE POLICY "Owners can update their own agency"
  ON public.agencies FOR UPDATE TO authenticated
  USING (id = public.current_user_agency_id())
  WITH CHECK (id = public.current_user_agency_id());

-- 6. DROP and recreate trips policies using current_user_agency_id()
DROP POLICY IF EXISTS "Owners can view all trips of their agency" ON public.trips;
DROP POLICY IF EXISTS "Owners can insert trips for their agency" ON public.trips;
DROP POLICY IF EXISTS "Owners can update trips of their agency" ON public.trips;
DROP POLICY IF EXISTS "Owners can delete trips of their agency" ON public.trips;

CREATE POLICY "Owners can view all trips of their agency"
  ON public.trips FOR SELECT TO authenticated
  USING (agency_id = public.current_user_agency_id());

CREATE POLICY "Owners can insert trips for their agency"
  ON public.trips FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.current_user_agency_id());

CREATE POLICY "Owners can update trips of their agency"
  ON public.trips FOR UPDATE TO authenticated
  USING (agency_id = public.current_user_agency_id())
  WITH CHECK (agency_id = public.current_user_agency_id());

CREATE POLICY "Owners can delete trips of their agency"
  ON public.trips FOR DELETE TO authenticated
  USING (agency_id = public.current_user_agency_id());

-- 7. DROP and recreate user_permissions owner policy using is_current_user_owner()
DROP POLICY IF EXISTS "Owner full access on user_permissions" ON public.user_permissions;

CREATE POLICY "Owner full access on user_permissions"
  ON public.user_permissions FOR ALL TO authenticated
  USING (public.is_current_user_owner())
  WITH CHECK (public.is_current_user_owner());

-- 8. DROP and recreate audit_logs owner policy using is_current_user_owner()
DROP POLICY IF EXISTS "Owner full access on audit_logs" ON public.audit_logs;

CREATE POLICY "Owner full access on audit_logs"
  ON public.audit_logs FOR ALL TO authenticated
  USING (public.is_current_user_owner())
  WITH CHECK (public.is_current_user_owner());
