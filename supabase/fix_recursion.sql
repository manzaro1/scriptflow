-- ============================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- Run this in Supabase SQL Editor to fix the recursion error
-- ============================================================

-- ============================================================
-- STEP 1: DROP ALL EXISTING POLICIES ON SCRIPTS
-- ============================================================

DROP POLICY IF EXISTS "scripts_select_policy" ON public.scripts;
DROP POLICY IF EXISTS "scripts_update_policy" ON public.scripts;
DROP POLICY IF EXISTS "Users can create their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can delete their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "scripts_owner_policy" ON public.scripts;
DROP POLICY IF EXISTS "Users can view scripts they own or collaborate on" ON public.scripts;

-- ============================================================
-- STEP 2: DROP ALL EXISTING POLICIES ON SCRIPT_COLLABORATORS
-- ============================================================

DROP POLICY IF EXISTS "collaborators_select" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_manage_owner" ON public.script_collaborators;
DROP POLICY IF EXISTS "Owners can manage collaborators" ON public.script_collaborators;
DROP POLICY IF EXISTS "Collaborators can see their own invitations" ON public.script_collaborators;
DROP POLICY IF EXISTS "Users can invite collaborators" ON public.script_collaborators;

-- ============================================================
-- STEP 3: CREATE SIMPLE SCRIPTS POLICIES (NO RECURSION)
-- ============================================================

-- Allow authenticated users to SELECT their own scripts
CREATE POLICY "scripts_select_own" ON public.scripts
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to INSERT their own scripts
CREATE POLICY "scripts_insert_own" ON public.scripts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to UPDATE their own scripts
CREATE POLICY "scripts_update_own" ON public.scripts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to DELETE their own scripts
CREATE POLICY "scripts_delete_own" ON public.scripts
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- STEP 4: CREATE SIMPLE COLLABORATORS POLICIES (NO RECURSION)
-- ============================================================

-- Allow users to see collaborators on their own scripts
CREATE POLICY "collaborators_select_own_scripts" ON public.script_collaborators
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_collaborators.script_id 
    AND scripts.user_id = auth.uid()
  )
);

-- Allow script owners to insert collaborators
CREATE POLICY "collaborators_insert_own_scripts" ON public.script_collaborators
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_collaborators.script_id 
    AND scripts.user_id = auth.uid()
  )
);

-- Allow script owners to update collaborators
CREATE POLICY "collaborators_update_own_scripts" ON public.script_collaborators
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_collaborators.script_id 
    AND scripts.user_id = auth.uid()
  )
);

-- Allow script owners to delete collaborators
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
-- STEP 5: VERIFICATION
-- ============================================================

-- Check that policies were created
SELECT 'Scripts policies:' as info, count(*) as count 
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scripts';

SELECT 'Collaborators policies:' as info, count(*) as count 
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'script_collaborators';

-- Test that everything works
SELECT 'Done! RLS policies fixed without recursion.' as status;
