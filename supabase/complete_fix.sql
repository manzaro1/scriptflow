-- ============================================================
-- COMPLETE FIX: PERMISSION DENIED FOR TABLE USERS
-- Run this in Supabase SQL Editor - COMPLETE REPLACEMENT
-- ============================================================

-- ============================================================
-- STEP 1: DROP ALL EXISTING POLICIES ON ALL TABLES
-- ============================================================

-- Drop scripts policies
DROP POLICY IF EXISTS "scripts_select_policy" ON public.scripts;
DROP POLICY IF EXISTS "scripts_update_policy" ON public.scripts;
DROP POLICY IF EXISTS "scripts_select_own" ON public.scripts;
DROP POLICY IF EXISTS "scripts_insert_own" ON public.scripts;
DROP POLICY IF EXISTS "scripts_update_own" ON public.scripts;
DROP POLICY IF EXISTS "scripts_delete_own" ON public.scripts;
DROP POLICY IF EXISTS "scripts_owner_policy" ON public.scripts;
DROP POLICY IF EXISTS "Users can create their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can delete their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can view scripts they own or collaborate on" ON public.scripts;

-- Drop script_collaborators policies
DROP POLICY IF EXISTS "collaborators_select" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_manage_owner" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_select_own_scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_insert_own_scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_update_own_scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_delete_own_scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "Owners can manage collaborators" ON public.script_collaborators;
DROP POLICY IF EXISTS "Collaborators can see their own invitations" ON public.script_collaborators;
DROP POLICY IF EXISTS "Users can invite collaborators" ON public.script_collaborators;

-- Drop storyboards policies
DROP POLICY IF EXISTS "storyboards_owner_policy" ON public.storyboards;

-- Drop profiles policies
DROP POLICY IF EXISTS "profiles_owner_policy" ON public.profiles;

-- ============================================================
-- STEP 2: CREATE BRAND NEW SIMPLE POLICIES
-- NOTE: NO references to auth.users - ONLY auth.uid()
-- ============================================================

-- SCRIPTS: Simple policies - user can only access their own scripts
CREATE POLICY "scripts_select" ON public.scripts
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "scripts_insert" ON public.scripts
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "scripts_update" ON public.scripts
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "scripts_delete" ON public.scripts
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- STORYBOARDS: Simple policies - user can only access their own storyboards
CREATE POLICY "storyboards_select" ON public.storyboards
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "storyboards_insert" ON public.storyboards
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "storyboards_update" ON public.storyboards
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "storyboards_delete" ON public.storyboards
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- PROFILES: User can only access their own profile
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- SCRIPT_COLLABORATORS: Only script owners can manage collaborators
-- This uses a direct join to scripts table, NOT auth.users
CREATE POLICY "collaborators_select" ON public.script_collaborators
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_collaborators.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "collaborators_insert" ON public.script_collaborators
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_collaborators.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "collaborators_update" ON public.script_collaborators
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_collaborators.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "collaborators_delete" ON public.script_collaborators
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_collaborators.script_id 
    AND scripts.user_id = auth.uid()
  )
);

-- ============================================================
-- STEP 3: VERIFY - Count policies
-- ============================================================

SELECT 'Scripts policies:' as table_name, count(*) as policy_count 
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scripts';

SELECT 'Storyboards policies:' as table_name, count(*) as policy_count 
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'storyboards';

SELECT 'Profiles policies:' as table_name, count(*) as policy_count 
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';

SELECT 'Collaborators policies:' as table_name, count(*) as policy_count 
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'script_collaborators';

SELECT 'DONE! No auth.users references used.' as status;
