-- Allow users to create their own scripts
CREATE POLICY "Users can create their own scripts" ON public.scripts 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own scripts
CREATE POLICY "Users can delete their own scripts" ON public.scripts 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Ensure script collaborators can be added (needed for sharing)
CREATE POLICY "Users can invite collaborators" ON public.script_collaborators
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scripts
    WHERE scripts.id = script_id AND scripts.user_id = auth.uid()
  )
);