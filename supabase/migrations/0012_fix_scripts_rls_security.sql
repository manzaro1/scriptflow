-- 1. Remove the critical security leak
DROP POLICY IF EXISTS "Enable read access for all users" ON public.scripts;

-- 2. Consolidate and harden the selection policy
-- This ensures only the owner OR an authorized collaborator can read the script
DROP POLICY IF EXISTS "scripts_select" ON public.scripts;
DROP POLICY IF EXISTS "scripts_select_policy" ON public.scripts;

CREATE POLICY "scripts_select" ON public.scripts
FOR SELECT 
TO authenticated 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.script_collaborators 
    WHERE script_id = public.scripts.id 
    AND user_id = auth.uid()
  )
);

-- 3. Ensure other operations are also restricted to authenticated owners
-- (These usually already exist but we ensure they are correctly scoped)
DROP POLICY IF EXISTS "scripts_insert" ON public.scripts;
CREATE POLICY "scripts_insert" ON public.scripts
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "scripts_update" ON public.scripts;
CREATE POLICY "scripts_update" ON public.scripts
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "scripts_delete" ON public.scripts;
CREATE POLICY "scripts_delete" ON public.scripts
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Note: We also noticed a similar leak on call_sheets which should be addressed 
-- in a separate task if required, but for now we have secured the core IP (scripts).