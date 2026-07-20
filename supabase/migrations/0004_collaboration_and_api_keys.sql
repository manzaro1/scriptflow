-- Migration 0004: Collaboration RLS + API Keys
-- Update scripts RLS to allow collaborators + add gemini_api_key to profiles

-- 1. Update scripts SELECT policy to include collaborators
DROP POLICY IF EXISTS scripts_select_policy ON public.scripts;
CREATE POLICY "scripts_select_policy" ON public.scripts FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.script_collaborators
    WHERE script_id = scripts.id AND (
      user_id = auth.uid() OR
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- 2. Update scripts UPDATE policy for editors/admins
DROP POLICY IF EXISTS scripts_update_policy ON public.scripts;
CREATE POLICY "scripts_update_policy" ON public.scripts FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.script_collaborators
    WHERE script_id = scripts.id AND (
      user_id = auth.uid() OR
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ) AND role IN ('editor', 'admin')
  )
);

-- 3. Add gemini_api_key to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
CREATE POLICY "profiles_update_key_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);