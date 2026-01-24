-- Create enum for collaborator roles
DO $$ BEGIN
    CREATE TYPE collaborator_role AS ENUM ('viewer', 'editor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create script_collaborators table
CREATE TABLE IF NOT EXISTS public.script_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role collaborator_role DEFAULT 'viewer',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(script_id, email)
);

-- Enable RLS
ALTER TABLE public.script_collaborators ENABLE ROW LEVEL SECURITY;

-- Collaborators table policies
CREATE POLICY "Owners can manage collaborators" ON public.script_collaborators
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE id = script_collaborators.script_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Collaborators can see their own invitations" ON public.script_collaborators
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Update scripts table policies to allow collaborator access
DROP POLICY IF EXISTS scripts_owner_policy ON public.scripts;

CREATE POLICY "Users can view scripts they own or collaborate on" ON public.scripts
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.script_collaborators 
    WHERE script_id = scripts.id 
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

CREATE POLICY "Users can update scripts they own or have editor/admin role" ON public.scripts
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.script_collaborators 
    WHERE script_id = scripts.id 
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND role IN ('editor', 'admin')
  )
)
WITH CHECK (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.script_collaborators 
    WHERE script_id = scripts.id 
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND role IN ('editor', 'admin')
  )
);