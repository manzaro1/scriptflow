-- Migration 0003: Notifications + updated signup trigger with welcome notifications

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('welcome', 'collaboration', 'script_activity', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);

-- Update handle_new_user to seed welcome notifications
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_script_id UUID;
BEGIN
  INSERT INTO public.profiles (id, first_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'first_name');

  INSERT INTO public.scripts (user_id, title, author, genre, content)
  VALUES (
    new.id,
    'The Neon Horizon',
    COALESCE(new.raw_user_meta_data ->> 'first_name', 'Anonymous'),
    'Sci-Fi',
    '[{"id":"1","type":"slugline","content":"EXT. CITY SKYLINE - NIGHT"},{"id":"2","type":"action","content":"Rain hammers the neon-lit streets. A lone figure stands at the edge of the rooftop."},{"id":"3","type":"character","content":"KAI"},{"id":"4","type":"parenthetical","content":"breathing heavily"},{"id":"5","type":"dialogue","content":"This wasn\'t the plan."}]'::jsonb
  ) RETURNING id INTO new_script_id;

  INSERT INTO public.storyboards (script_id, user_id, data, aspect_ratio)
  VALUES (
    new_script_id,
    new.id,
    '[{"id":"1","sceneTitle":"EXT. CITY SKYLINE - NIGHT","shotNumber":"01","shotType":"W.S","cameraAngle":"High Angle","movement":"Static","lens":"24mm","emotion":"Tense","lighting":"Neon","colorGrade":"Teal & Orange","visualPrompt":"Cinematic rain, neon city, lone figure.","audioTag":"[Ambient]","sfx":"Rain","transition":"FADE IN"}]'::jsonb,
    '2.39:1'
  );

  INSERT INTO public.notifications (user_id, title, message, type, link) VALUES
    (new.id, 'Welcome to ScriptFlow!', 'Your creative journey starts here. Start by exploring your sample screenplay.', 'welcome', '/dashboard'),
    (new.id, 'Tip: Tab cycles block types', 'Press Tab while editing to quickly switch between sluglines, action, character, and dialogue.', 'welcome', NULL),
    (new.id, 'Tip: Ctrl+J for AI autocomplete', 'Let AI help you write faster. Press Ctrl+J in the editor for intelligent suggestions.', 'welcome', NULL),
    (new.id, 'Invite your team', 'Click the Share button on any script to invite collaborators as viewers, editors, or admins.', 'welcome', NULL);

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;