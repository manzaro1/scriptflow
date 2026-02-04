
-- Policies for ai_rules
CREATE POLICY "Allow authorized users to insert rules" ON public.ai_rules
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_rule_permissions 
    WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Allow authorized users to update rules" ON public.ai_rules
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.ai_rule_permissions 
    WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- Policy for ai_rule_permissions
CREATE POLICY "Allow admins to manage permissions" ON public.ai_rule_permissions
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.ai_rule_permissions 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
