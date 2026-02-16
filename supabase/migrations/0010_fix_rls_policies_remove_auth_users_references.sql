-- ============================================================
-- Migration 0010: Fix all RLS policies
-- Removes all references to auth.users table which causes
-- "permission denied for table users" errors.
-- All policies now use only auth.uid() for authorization.
-- ============================================================

-- ============================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================================

-- Scripts policies (from various migrations)
DROP POLICY IF EXISTS "scripts_select_policy" ON public.scripts;
DROP POLICY IF EXISTS "scripts_update_policy" ON public.scripts;
DROP POLICY IF EXISTS "scripts_select_own" ON public.scripts;
DROP POLICY IF EXISTS "scripts_insert_own" ON public.scripts;
DROP POLICY IF EXISTS "scripts_update_own" ON public.scripts;
DROP POLICY IF EXISTS "scripts_delete_own" ON public.scripts;
DROP POLICY IF EXISTS "scripts_owner_policy" ON public.scripts;
DROP POLICY IF EXISTS "scripts_select" ON public.scripts;
DROP POLICY IF EXISTS "scripts_insert" ON public.scripts;
DROP POLICY IF EXISTS "scripts_update" ON public.scripts;
DROP POLICY IF EXISTS "scripts_delete" ON public.scripts;
DROP POLICY IF EXISTS "Users can create their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can delete their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can view scripts they own or collaborate on" ON public.scripts;

-- Script_collaborators policies
DROP POLICY IF EXISTS "collaborators_select" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_insert" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_update" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_delete" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_manage_owner" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_select_own_scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_insert_own_scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_update_own_scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "collaborators_delete_own_scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "Owners can manage collaborators" ON public.script_collaborators;
DROP POLICY IF EXISTS "Collaborators can see their own invitations" ON public.script_collaborators;
DROP POLICY IF EXISTS "Users can invite collaborators" ON public.script_collaborators;

-- Storyboards policies
DROP POLICY IF EXISTS "storyboards_owner_policy" ON public.storyboards;
DROP POLICY IF EXISTS "storyboards_select" ON public.storyboards;
DROP POLICY IF EXISTS "storyboards_insert" ON public.storyboards;
DROP POLICY IF EXISTS "storyboards_update" ON public.storyboards;
DROP POLICY IF EXISTS "storyboards_delete" ON public.storyboards;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_owner_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

-- ============================================================
-- STEP 2: CREATE CLEAN POLICIES (auth.uid() only, no auth.users)
-- ============================================================

-- SCRIPTS: Users can only access their own scripts
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

-- STORYBOARDS: Users can only access their own storyboards
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

-- PROFILES: Users can only access their own profile
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
