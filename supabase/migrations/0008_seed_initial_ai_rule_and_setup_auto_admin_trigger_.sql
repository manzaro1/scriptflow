
-- Insert a sample rule
INSERT INTO public.ai_rules (name, description, content, schema_validation)
VALUES (
  'Dialogue Tone Analyzer', 
  'Analyzes script dialogue for consistent character voice.', 
  'function analyze(dialogue) { return dialogue.length > 0 ? "Analyzed" : "Empty"; }',
  '{"type": "object", "properties": {"dialogue": {"type": "string"}}, "required": ["dialogue"]}'
) ON CONFLICT DO NOTHING;

-- Trigger to make the first user an admin
CREATE OR REPLACE FUNCTION public.handle_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ai_rule_permissions WHERE role = 'admin') THEN
    INSERT INTO public.ai_rule_permissions (user_id, role)
    VALUES (new.id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to profiles or auth.users? profiles is easier to hook into here.
DROP TRIGGER IF EXISTS on_profile_created_admin ON public.profiles;
CREATE TRIGGER on_profile_created_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_first_user_admin();

-- Also insert for existing profiles if any
INSERT INTO public.ai_rule_permissions (user_id, role)
SELECT id, 'admin' FROM public.profiles
WHERE NOT EXISTS (SELECT 1 FROM public.ai_rule_permissions WHERE role = 'admin')
LIMIT 1
ON CONFLICT DO NOTHING;
