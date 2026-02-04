-- 1. Ensure AI Rule Permissions RLS is robust
-- Allow admins to manage all permissions
DROP POLICY IF EXISTS "Allow admins to manage permissions" ON public.ai_rule_permissions;
CREATE POLICY "Allow admins to manage permissions" ON public.ai_rule_permissions
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.ai_rule_permissions 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 2. Ensure AI Rules RLS is robust
-- Allow authorized users to insert rules
DROP POLICY IF EXISTS "Allow authorized users to insert rules" ON public.ai_rules;
CREATE POLICY "Allow authorized users to insert rules" ON public.ai_rules
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_rule_permissions 
    WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- Allow authorized users to update rules
DROP POLICY IF EXISTS "Allow authorized users to update rules" ON public.ai_rules;
CREATE POLICY "Allow authorized users to update rules" ON public.ai_rules
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.ai_rule_permissions 
    WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- 3. Ensure Scripts RLS is robust for SELECT (Read) operations
-- This policy allows users to see scripts they own OR scripts they are collaborating on.
DROP POLICY IF EXISTS "scripts_select_policy" ON public.scripts;
CREATE POLICY "scripts_select_policy" ON public.scripts
FOR SELECT TO authenticated USING (
  (user_id = auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.script_collaborators
    WHERE script_collaborators.script_id = scripts.id AND (
      script_collaborators.user_id = auth.uid() OR 
      script_collaborators.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);