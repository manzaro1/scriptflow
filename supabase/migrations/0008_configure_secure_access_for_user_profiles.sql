-- Ensure RLS is active on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove existing broad policies
DROP POLICY IF EXISTS "profiles_owner_policy" ON public.profiles;

-- Allow users to manage their own profile details
CREATE POLICY "profiles_manage_own" ON public.profiles 
FOR ALL TO authenticated USING (auth.uid() = id);

-- Allow logged-in users to view other profiles (essential for collaboration)
CREATE POLICY "profiles_view_all" ON public.profiles 
FOR SELECT TO authenticated USING (true);