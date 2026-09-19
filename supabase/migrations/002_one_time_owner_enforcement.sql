-- ====================================================================
-- 002_one_time_owner_enforcement.sql
-- Enforce single owner account and add password reset policies
-- ====================================================================

-- 1. Add unique partial index to prevent multiple owner profiles
-- Only one profile can have role = 'owner'
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_owner
ON public.profiles((true))
WHERE role = 'owner';

-- 2. Add RLS policy to prevent inserting second owner profile
-- This prevents any user from creating a second owner profile
CREATE POLICY "Only one owner profile allowed"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE role = 'owner'
    ) OR id = auth.uid()
  );

-- 3. Update profiles RLS: allow owner to view all profiles (for admin)
CREATE POLICY "Owners can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- 4. Helper function to check if owner exists
CREATE OR REPLACE FUNCTION public.owner_exists()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'owner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add agency slug column to profiles for better lookup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_slug TEXT;

-- 6. Create trigger to auto-set agency_slug on profile insert
CREATE OR REPLACE FUNCTION public.set_profile_agency_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agency_slug IS NULL THEN
    SELECT a.slug INTO NEW.agency_slug
    FROM public.agencies a
    WHERE a.id = NEW.agency_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_set_profile_agency_slug
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profile_agency_slug();
