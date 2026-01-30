-- Ensure Row Level Security is active
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- Remove any conflicting older policies
DROP POLICY IF EXISTS "Users can view scripts they own or collaborate on" ON public.scripts;
DROP POLICY IF EXISTS "Users can create their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can update scripts they own or have editor/admin role" ON public.scripts;
DROP POLICY IF EXISTS "Users can delete their own scripts" ON public.scripts;

-- Establish new ownership rules
CREATE POLICY "scripts_select_policy" ON public.scripts 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "scripts_insert_policy" ON public.scripts 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scripts_update_policy" ON public.scripts 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "scripts_delete_policy" ON public.scripts 
FOR DELETE TO authenticated USING (auth.uid() = user_id);