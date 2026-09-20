-- ====================================================================
-- 004_add_username_to_profiles.sql
-- Add username column to profiles for username-based login
-- ====================================================================

-- 1. Add username column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Create index for username lookups (used by login)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 3. Add RLS policy: allow anonymous (unauthenticated) SELECT on profiles
-- for username lookup during login. This only exposes the username column
-- and the linked auth user id - not emails or other sensitive data.
-- We use a SECURITY DEFINER function instead for maximum safety.
CREATE OR REPLACE FUNCTION public.lookup_auth_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_auth_email TEXT;
BEGIN
  SELECT au.email INTO v_auth_email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.username = p_username
    AND p.role = 'owner'
  LIMIT 1;

  RETURN v_auth_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
