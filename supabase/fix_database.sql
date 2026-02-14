-- ============================================================
-- FIX SCRIPT FOR FILMSCRIPT-PRO DATABASE
-- Run this in Supabase SQL Editor to fix database issues
-- ============================================================

-- 1. Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile policy
DROP POLICY IF EXISTS "profiles_owner_policy" ON public.profiles;
CREATE POLICY "profiles_owner_policy" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);

-- 2. Create scripts table if not exists
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT DEFAULT 'Anonymous',
  status TEXT DEFAULT 'In Progress',
  genre TEXT DEFAULT 'Sci-Fi',
  content JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- 3. Create storyboards table if not exists
CREATE TABLE IF NOT EXISTS public.storyboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '[]'::jsonb,
  aspect_ratio TEXT DEFAULT '2.39:1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.storyboards ENABLE ROW LEVEL SECURITY;

-- Storyboard policy
DROP POLICY IF EXISTS "storyboards_owner_policy" ON public.storyboards;
CREATE POLICY "storyboards_owner_policy" ON public.storyboards FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 4. Create script_collaborators table if not exists
CREATE TABLE IF NOT EXISTS public.script_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(script_id, email)
);

ALTER TABLE public.script_collaborators ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES FOR SCRIPTS TABLE
-- ============================================================

-- SELECT policy (read scripts you own or collaborate on)
DROP POLICY IF EXISTS "scripts_select_policy" ON public.scripts;
CREATE POLICY "scripts_select_policy" ON public.scripts
FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.script_collaborators 
    WHERE script_id = scripts.id AND (
      user_id = auth.uid() OR 
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- INSERT policy (create your own scripts)
DROP POLICY IF EXISTS "Users can create their own scripts" ON public.scripts;
CREATE POLICY "Users can create their own scripts" ON public.scripts 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE policy (update scripts you own or have editor/admin role)
DROP POLICY IF EXISTS "scripts_update_policy" ON public.scripts;
CREATE POLICY "scripts_update_policy" ON public.scripts
FOR UPDATE TO authenticated USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.script_collaborators 
    WHERE script_id = scripts.id AND (
      user_id = auth.uid() OR 
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ) AND role IN ('editor', 'admin')
  )
);

-- DELETE policy (delete your own scripts)
DROP POLICY IF EXISTS "Users can delete their own scripts" ON public.scripts;
CREATE POLICY "Users can delete their own scripts" ON public.scripts 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES FOR COLLABORATORS TABLE
-- ============================================================

DROP POLICY IF EXISTS "collaborators_select" ON public.script_collaborators;
CREATE POLICY "collaborators_select" ON public.script_collaborators
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.scripts WHERE id = script_id AND user_id = auth.uid()) OR
  user_id = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "collaborators_manage_owner" ON public.script_collaborators;
CREATE POLICY "collaborators_manage_owner" ON public.script_collaborators
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.scripts WHERE id = script_id AND user_id = auth.uid())
);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check tables exist
SELECT 'Tables created:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS is enabled
SELECT 'RLS Status:' as status;
SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('profiles', 'scripts', 'storyboards', 'script_collaborators');

-- Check policies exist
SELECT 'Policies count:' as status, count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scripts';

-- Test insert (as service_role or from authenticated user)
-- This should succeed if RLS is properly configured
