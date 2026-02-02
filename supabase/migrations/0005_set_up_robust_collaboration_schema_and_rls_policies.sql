-- Ensure collaborators table exists with correct structure
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

-- Enable RLS on collaborators
ALTER TABLE public.script_collaborators ENABLE ROW LEVEL SECURITY;

-- Collaborators table policies
CREATE POLICY "collaborators_select" ON public.script_collaborators
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.scripts WHERE id = script_id AND user_id = auth.uid()) OR
  user_id = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "collaborators_manage_owner" ON public.script_collaborators
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.scripts WHERE id = script_id AND user_id = auth.uid())
);

-- Harden Scripts RLS to allow collaboration
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