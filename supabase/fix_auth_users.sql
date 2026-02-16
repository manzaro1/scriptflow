-- ============================================================
-- FIX PERMISSION DENIED FOR AUTH.USERS
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: CREATE HELPER FUNCTION TO GET USER EMAIL
-- This runs with SECURITY DEFINER to bypass RLS on auth.users
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  RETURN user_email;
END;
$$;

-- ============================================================
-- STEP 2: GRANT PERMISSION TO USE THE FUNCTION
-- ============================================================

GRANT EXECUTE ON FUNCTION public.get_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email() TO anon;

-- ============================================================
-- STEP 3: DROP OLD POLICIES AND CREATE NEW ONES
-- ============================================================

-- SCRIPTS TABLE
DROP POLICY IF EXISTS "scripts_select_own" ON public.scripts;
DROP POLICY IF EXISTS "scripts_insert_own" ON public.scripts;
DROP POLICY IF EXISTS "scripts_update_own" ON public.scripts;
DROP POLICY IF EXISTS "scripts_delete_own" ON public.scripts;

-- SIMPLE POLICIES: Users can only see/edit their own scripts
CREATE POLICY "scripts_select_own" ON public.scripts
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "scripts_insert_own" ON public.scripts
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "scripts_update_own" ON public.scripts
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "scripts_delete_own" ON public.scripts
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- SCRIPT_COLLABORATORS TABLE  
DROP POLICY IF EXISTS "collaborators_select_own_scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_insert_own_scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_update_own_scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_delete_own_scripts" ON public.script_collaborators;

-- SIMPLE POLICIES: Only script owners can manage collaborators
CREATE POLICY "collaborators_select_own_scripts" ON public.script_collaborators
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_collaborators.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "collaborators_insert_own_scripts" ON public.script_collaborators
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_collaborators.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "collaborators_update_own_scripts" ON public.script_collaborators
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_collaborators.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "collaborators_delete_own_scripts" ON public.script_collaborators
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_collaborators.script_id 
    AND scripts.user_id = auth.uid()
  )
);

-- ============================================================
-- STEP 4: VERIFY
-- ============================================================

SELECT 'Success! Policies fixed. User email helper created.' as status;

-- Test the helper function (should return null if not logged in)
SELECT public.get_user_email() as user_email;
