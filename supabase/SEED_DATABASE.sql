-- ====================================================================
-- COMPLETE DATABASE SETUP
-- Run this ENTIRE script in Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates all tables, functions, RLS policies, and the default owner.
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. AGENCIES TABLE
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  phone TEXT,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  website_url TEXT,
  tagline TEXT DEFAULT '',
  accent_color TEXT DEFAULT '#4B6B5B',
  logo TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agencies_slug ON public.agencies(slug);

-- 3. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE RESTRICT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'owner',
  username TEXT UNIQUE,
  is_disabled BOOLEAN NOT NULL DEFAULT false,
  agency_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'admin', 'staff'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON public.profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 4. TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  destination TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Himalayas',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration INT NOT NULL CHECK (duration > 0),
  nights INT NOT NULL DEFAULT 0 CHECK (nights >= 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10, 2),
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  brochure_url TEXT,
  trip_type TEXT NOT NULL,
  experience TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  family_friendly BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
  important_info JSONB DEFAULT '[]'::jsonb,
  max_group_size INT DEFAULT 12,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_agency_trip_slug UNIQUE (agency_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_trips_agency_active ON public.trips(agency_id, is_active);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON public.trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_price ON public.trips(price);
CREATE INDEX IF NOT EXISTS idx_trips_featured ON public.trips(featured, is_active);
CREATE INDEX IF NOT EXISTS idx_trips_type_exp ON public.trips(trip_type, experience);

-- 5. USER PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_permission UNIQUE (user_id, permission),
  CONSTRAINT user_permissions_permission_check CHECK (permission ~ '^[a-z]+\.[a-z]+$')
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_agency ON public.user_permissions(agency_id);

-- 6. AUDIT LOGS TABLE
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_action_check CHECK (length(action) > 0 AND length(action) <= 100)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_agency ON public.audit_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 7. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. ENABLE RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 8a. SECURITY DEFINER HELPER FUNCTIONS (must be defined before RLS policies that use them)

-- Checks if the current authenticated user has the 'owner' role.
-- SECURITY DEFINER: runs as the function owner, bypasses RLS on profiles.
-- auth.uid() still returns the JWT sub claim from the authenticated request.
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

-- Returns the agency_id of the authenticated user.
-- SECURITY DEFINER: runs as the function owner, bypasses RLS on profiles.
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

-- 9. AGENCIES RLS POLICIES
CREATE POLICY "Public agencies are viewable by everyone"
  ON public.agencies FOR SELECT USING (true);

CREATE POLICY "Owners can update their own agency"
  ON public.agencies FOR UPDATE TO authenticated
  USING (id = public.current_user_agency_id())
  WITH CHECK (id = public.current_user_agency_id());

-- 10. PROFILES RLS POLICIES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Authenticated users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Only one owner profile allowed"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    NOT public.is_current_user_owner()
    OR id = auth.uid()
  );

CREATE POLICY "Owners can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_current_user_owner());

-- 11. TRIPS RLS POLICIES
CREATE POLICY "Active trips are viewable by everyone"
  ON public.trips FOR SELECT USING (is_active = true);

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

-- 12. USER PERMISSIONS RLS POLICIES
CREATE POLICY "Owner full access on user_permissions"
  ON public.user_permissions FOR ALL TO authenticated
  USING (public.is_current_user_owner())
  WITH CHECK (public.is_current_user_owner());

CREATE POLICY "Users can view own permissions"
  ON public.user_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 13. AUDIT LOGS RLS POLICIES
CREATE POLICY "Owner full access on audit_logs"
  ON public.audit_logs FOR ALL TO authenticated
  USING (public.is_current_user_owner())
  WITH CHECK (public.is_current_user_owner());

CREATE POLICY "Users with logs.view can read audit_logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = auth.uid() AND permission = 'logs.view'));

-- 14. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('trip-images', 'trip-images', true),
  ('trip-brochures', 'trip-brochures', true),
  ('agency-assets', 'agency-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read for trip images"
  ON storage.objects FOR SELECT USING (bucket_id = 'trip-images');
CREATE POLICY "Public read for trip brochures"
  ON storage.objects FOR SELECT USING (bucket_id = 'trip-brochures');
CREATE POLICY "Public read for agency assets"
  ON storage.objects FOR SELECT USING (bucket_id = 'agency-assets');
CREATE POLICY "Authenticated users can upload trip images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trip-images');
CREATE POLICY "Authenticated users can update/delete trip images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'trip-images');
CREATE POLICY "Authenticated users can upload trip brochures"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trip-brochures');
CREATE POLICY "Authenticated users can update/delete trip brochures"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'trip-brochures');

-- 15. LOOKUP FUNCTION: username -> auth email (SECURITY DEFINER)
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

-- 18. PERMISSION CHECK FUNCTION
CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'owner') THEN
    RETURN true;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = p_user_id AND permission = p_permission);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. GET USER PERMISSIONS FUNCTION
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS SETOF TEXT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'owner') THEN
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
  RETURN QUERY SELECT up.permission FROM public.user_permissions up WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. OWNER EXISTS CHECK
CREATE OR REPLACE FUNCTION public.owner_exists()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'owner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21. SEED DEFAULT AGENCY
INSERT INTO public.agencies (id, name, slug, email, whatsapp, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Alpine & Co. Expeditions',
  'alpine-expeditions',
  'hello@alpine-expeditions.com',
  '919820045120',
  '+91 98200 45120'
)
ON CONFLICT (slug) DO NOTHING;

-- ====================================================================
-- OWNER ACCOUNT SETUP
-- ====================================================================
-- IMPORTANT: The password "Admin@123" is set via Supabase Auth, NOT here.
-- This script only creates the profile. You must create the Auth user
-- through the Supabase Dashboard > Authentication > Users > Add User.
--
-- Steps to create the owner:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" > "Create a new user"
-- 3. Email: admin@alpine-expeditions.com (or any email you choose)
-- 4. Password: Admin@123
-- 5. Confirm email: Check this box (or disable email confirmation in Auth settings)
-- 6. After creating the Auth user, note the User UUID
-- 7. Run the INSERT below with the correct User UUID
-- ====================================================================

-- FIRST: Disable email confirmation so login works immediately
-- Go to: Supabase Dashboard > Authentication > Providers > Email
-- UNCHECK "Confirm email" (or set it to allow auto-confirm)
-- This is CRITICAL for login to work.

-- THEN: Create the Auth user via Dashboard > Authentication > Users > Add user
-- Email: admin@alpine-expeditions.com
-- Password: Admin@123

-- FINALLY: Run this INSERT (replace THE_AUTH_USER_ID with the actual UUID from step 6)
-- You can find the UUID in Dashboard > Authentication > Users > click on the user

-- Example (replace THE_AUTH_USER_ID):
-- INSERT INTO public.profiles (id, agency_id, full_name, role, username, is_disabled)
-- VALUES ('THE_AUTH_USER_ID', '00000000-0000-0000-0000-000000000001', 'Agency Owner', 'owner', 'administrator', false)
-- ON CONFLICT (id) DO UPDATE SET role = 'owner', username = 'administrator', is_disabled = false;
