-- Drop old restrictive policies
DROP POLICY IF EXISTS "scripts_select_policy" ON public.scripts;
DROP POLICY IF EXISTS "scripts_update_policy" ON public.scripts;

-- New SELECT policy: Allow access if you are the owner OR a collaborator (by ID or Email)
CREATE POLICY "scripts_select_policy" ON public.scripts 
FOR SELECT TO authenticated 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.script_collaborators 
    WHERE script_id = public.scripts.id 
    AND (
      user_id = auth.uid() 
      OR 
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- New UPDATE policy: Allow editing if you are the owner OR a collaborator with 'editor'/'admin' role
CREATE POLICY "scripts_update_policy" ON public.scripts 
FOR UPDATE TO authenticated 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.script_collaborators 
    WHERE script_id = public.scripts.id 
    AND (
      user_id = auth.uid() 
      OR 
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    AND role IN ('editor', 'admin')
  )
);