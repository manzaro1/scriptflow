-- Ensure RLS is active
ALTER TABLE public.script_collaborators ENABLE ROW LEVEL SECURITY;

-- Clean up existing sharing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can invite collaborators" ON public.script_collaborators;
DROP POLICY IF EXISTS "Collaborators can see their own invitations" ON public.script_collaborators;
DROP POLICY IF EXISTS "Owners can manage collaborators" ON public.script_collaborators;

-- 1. Permission to INVITE: Script owners can add anyone to their script
CREATE POLICY "sharing_insert_owner" ON public.script_collaborators 
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE id = script_id AND user_id = auth.uid()
  )
);

-- 2. Permission to VIEW: Script owners see everyone, and invitees see their own invites
CREATE POLICY "sharing_select_all_relevant" ON public.script_collaborators 
FOR SELECT TO authenticated 
USING (
  -- I am the owner of the script
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE id = script_id AND user_id = auth.uid()
  )
  OR 
  -- OR I am the person being invited (by ID or Email)
  auth.uid() = user_id 
  OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 3. Permission to MANAGE: Script owners can change roles or remove collaborators
CREATE POLICY "sharing_manage_owner" ON public.script_collaborators 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE id = script_id AND user_id = auth.uid()
  )
);