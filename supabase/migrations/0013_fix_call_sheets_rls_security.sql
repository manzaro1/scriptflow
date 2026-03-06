-- 1. Remove the dangerous public read policy
DROP POLICY IF EXISTS "Enable read access for all users" ON public.call_sheets;

-- 2. Remove redundant or overly permissive delete policies if they exist
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.call_sheets;

-- 3. Ensure the secure selection policy is active (covers owner and collaborators)
-- Note: The policy "Users can view call sheets for their scripts" already exists in the schema
-- and correctly restricts access to (user_id = auth.uid()) OR (collaborator check).
-- We will recreate it here to ensure it is properly scoped to 'authenticated' users.

DROP POLICY IF EXISTS "Users can view call sheets for their scripts" ON public.call_sheets;

CREATE POLICY "call_sheets_secure_select" ON public.call_sheets
FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.script_collaborators 
    WHERE script_id = call_sheets.script_id 
    AND user_id = auth.uid()
  )
);

-- 4. Ensure other operations are also restricted to authenticated owners
DROP POLICY IF EXISTS "Users can insert call sheets for their scripts" ON public.call_sheets;
CREATE POLICY "call_sheets_secure_insert" ON public.call_sheets
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update call sheets they own" ON public.call_sheets;
CREATE POLICY "call_sheets_secure_update" ON public.call_sheets
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete call sheets they own" ON public.call_sheets;
CREATE POLICY "call_sheets_secure_delete" ON public.call_sheets
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());