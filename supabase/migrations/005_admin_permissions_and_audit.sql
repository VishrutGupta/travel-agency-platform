-- ====================================================================
-- 005_admin_permissions_and_audit.sql
-- Admin user management, granular permissions, and audit logging
-- ====================================================================

-- 1. ADD IS_DISABLED COLUMN TO PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN NOT NULL DEFAULT false;

-- 2. USER PERMISSIONS TABLE
-- Stores individual permissions per user. Owner bypasses all checks.
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_permission UNIQUE (user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_agency ON public.user_permissions(agency_id);

-- 3. AUDIT LOGS TABLE
-- Append-only audit trail for all administrative actions.
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_username TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  description TEXT NOT NULL DEFAULT '',
  before_data JSONB,
  after_data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_agency ON public.audit_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 4. ENABLE RLS ON NEW TABLES
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. USER_PERMISSIONS RLS POLICIES
-- Owner can do everything
CREATE POLICY "Owner full access on user_permissions"
  ON public.user_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 6. AUDIT_LOGS RLS POLICIES
-- Owner full access
CREATE POLICY "Owner full access on audit_logs"
  ON public.audit_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Users with logs.view can read audit logs
CREATE POLICY "Users with logs.view can read audit_logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_id = auth.uid() AND permission = 'logs.view'
    )
  );

-- 7. UPDATE lookup_auth_email_by_username TO CHECK is_disabled
CREATE OR REPLACE FUNCTION public.lookup_auth_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_auth_email TEXT;
  v_is_disabled BOOLEAN;
BEGIN
  SELECT au.email, p.is_disabled INTO v_auth_email, v_is_disabled
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.username = p_username
    AND p.role IN ('owner', 'admin', 'staff')
  LIMIT 1;

  IF v_auth_email IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_is_disabled THEN
    RETURN NULL;
  END IF;

  RETURN v_auth_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNCTION TO CHECK IF USER HAS PERMISSION
CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Owner bypasses all permission checks
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'owner'
  ) THEN
    RETURN true;
  END IF;

  -- Check specific permission
  RETURN EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = p_user_id AND permission = p_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FUNCTION TO GET USER PERMISSIONS
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS SETOF TEXT AS $$
BEGIN
  -- Owner has all permissions
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'owner'
  ) THEN
    RETURN QUERY SELECT unnest(ARRAY[
      'dashboard.view',
      'trips.view', 'trips.create', 'trips.edit', 'trips.delete',
      'settings.view', 'settings.edit',
      'users.view', 'users.create', 'users.edit', 'users.disable', 'users.delete', 'users.permissions',
      'logs.view',
      'storage.upload', 'storage.delete'
    ]::TEXT[]);
    RETURN;
  END IF;

  -- Return assigned permissions
  RETURN QUERY SELECT up.permission FROM public.user_permissions up WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CONSTRAINTS
-- Validate role values
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'staff'));

-- Validate permission format (basic check)
ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_permission_check
  CHECK (permission ~ '^[a-z]+\.[a-z]+$');

-- Validate action format
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_action_check
  CHECK (length(action) > 0 AND length(action) <= 100);
