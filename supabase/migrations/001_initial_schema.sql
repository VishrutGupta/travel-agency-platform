-- ====================================================================
-- 001_initial_schema.sql
-- Travel Agency Platform: Multi-Agency PostgreSQL Schema with RLS
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for agency lookup by slug
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON public.agencies(slug);

-- 3. USER PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE RESTRICT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for profile agency lookup
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON public.profiles(agency_id);

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

-- 5. DATABASE INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
CREATE INDEX IF NOT EXISTS idx_trips_agency_active ON public.trips(agency_id, is_active);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON public.trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_price ON public.trips(price);
CREATE INDEX IF NOT EXISTS idx_trips_featured ON public.trips(featured, is_active);
CREATE INDEX IF NOT EXISTS idx_trips_type_exp ON public.trips(trip_type, experience);

-- 6. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
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

-- 7. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- AGENCIES POLICIES:
-- 1. Public can view active agencies
CREATE POLICY "Public agencies are viewable by everyone"
  ON public.agencies FOR SELECT
  USING (true);

-- 2. Authenticated owners can update their own agency
CREATE POLICY "Owners can update their own agency"
  ON public.agencies FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

-- PROFILES POLICIES:
-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 2. Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- TRIPS POLICIES:
-- 1. Public can view active trips
CREATE POLICY "Active trips are viewable by everyone"
  ON public.trips FOR SELECT
  USING (is_active = true);

-- 2. Authenticated owners can view all trips (active & draft) of their agency
CREATE POLICY "Owners can view all trips of their agency"
  ON public.trips FOR SELECT
  TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

-- 3. Authenticated owners can insert trips for their agency
CREATE POLICY "Owners can insert trips for their agency"
  ON public.trips FOR INSERT
  TO authenticated
  WITH CHECK (
    agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

-- 4. Authenticated owners can update trips of their agency
CREATE POLICY "Owners can update trips of their agency"
  ON public.trips FOR UPDATE
  TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

-- 5. Authenticated owners can delete trips of their agency
CREATE POLICY "Owners can delete trips of their agency"
  ON public.trips FOR DELETE
  TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

-- 8. STORAGE BUCKETS CONFIGURATION
-- Insert public storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('trip-images', 'trip-images', true),
  ('trip-brochures', 'trip-brochures', true),
  ('agency-assets', 'agency-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: Public read access
CREATE POLICY "Public read for trip images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-images');

CREATE POLICY "Public read for trip brochures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-brochures');

CREATE POLICY "Public read for agency assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agency-assets');

-- Storage RLS: Authenticated upload & delete access
CREATE POLICY "Authenticated users can upload trip images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'trip-images');

CREATE POLICY "Authenticated users can update/delete trip images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'trip-images');

CREATE POLICY "Authenticated users can upload trip brochures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'trip-brochures');

CREATE POLICY "Authenticated users can update/delete trip brochures"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'trip-brochures');

-- 9. HELPER FUNCTION TO SETUP INITIAL OWNER PROFILE
CREATE OR REPLACE FUNCTION public.create_owner_profile(
  user_email TEXT,
  target_agency_slug TEXT DEFAULT 'alpine-expeditions',
  owner_name TEXT DEFAULT 'Agency Owner'
)
RETURNS UUID AS $$
DECLARE
  target_user_id UUID;
  target_agency_id UUID;
BEGIN
  -- Find the user in auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in auth.users. Please sign up or create the user first.', user_email;
  END IF;

  -- Find the agency
  SELECT id INTO target_agency_id FROM public.agencies WHERE slug = target_agency_slug;
  IF target_agency_id IS NULL THEN
    RAISE EXCEPTION 'Agency with slug % not found.', target_agency_slug;
  END IF;

  -- Upsert profile
  INSERT INTO public.profiles (id, agency_id, full_name, role)
  VALUES (target_user_id, target_agency_id, owner_name, 'owner')
  ON CONFLICT (id) DO UPDATE
  SET agency_id = target_agency_id, full_name = owner_name, role = 'owner';

  RETURN target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. SEED DEFAULT AGENCY
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

-- 11. RLS INSERT POLICY FOR PROFILES
-- Allows authenticated users to insert their own profile (for signup)
CREATE POLICY "Authenticated users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
