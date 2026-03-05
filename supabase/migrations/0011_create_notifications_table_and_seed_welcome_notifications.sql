-- 1. Create Notifications Table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('welcome', 'collaboration', 'script_activity', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Index for efficient queries
CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);

-- 5. Update handle_new_user() to also seed welcome notifications
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_script_id UUID;
BEGIN
  -- Create Profile
  INSERT INTO public.profiles (id, first_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'first_name');

  -- Create Sample Script
  INSERT INTO public.scripts (user_id, title, author, genre, content)
  VALUES (
    new.id,
    'The Neon Horizon',
    COALESCE(new.raw_user_meta_data ->> 'first_name', 'Alex Rivers'),
    'Sci-Fi',
    '[{"id":"1","type":"slugline","content":"EXT. SKYLINE - NIGHT"},{"id":"2","type":"action","content":"Rain hammers against the metallic skin of the city. Neon signs flicker in shades of bruised purple and electric cyan."},{"id":"3","type":"character","content":"KAI"},{"id":"4","type":"parenthetical","content":"to himself"},{"id":"5","type":"dialogue","content":"This was not part of the deal."}]'::jsonb
  ) RETURNING id INTO new_script_id;

  -- Create Sample Storyboard
  INSERT INTO public.storyboards (script_id, user_id, data, aspect_ratio)
  VALUES (
    new_script_id,
    new.id,
    '[{"id":"1","sceneTitle":"EXT. SKYLINE - NIGHT","shotNumber":"01","shotType":"W.S","cameraAngle":"Normal Angle","movement":"Static","lens":"14mm Ultra-Wide","emotion":"Suspenseful","lighting":"Neon Low Light","colorGrade":"Teal & Orange","visualPrompt":"Cinematic rain, neon city.","audioTag":"[Ambient Action]","sfx":"Rain Patter","transition":"FADE IN"}]'::jsonb,
    '2.39:1'
  );

  -- Seed Welcome Notifications
  INSERT INTO public.notifications (user_id, title, message, type, link) VALUES
    (new.id, 'Welcome to ScriptFlow!', 'Your creative journey starts here. Explore your dashboard to get started.', 'welcome', '/dashboard'),
    (new.id, 'Tip: Use Tab to cycle block types', 'While editing a script, press Tab to quickly switch between sluglines, action, character, dialogue, and more.', 'welcome', NULL),
    (new.id, 'Tip: Press Ctrl+J for AI autocomplete', 'Let AI help you write faster. Press Ctrl+J in the editor to get intelligent suggestions.', 'welcome', NULL),
    (new.id, 'Invite collaborators to your scripts', 'Share your scripts with your team. Click the share button on any script to invite collaborators.', 'welcome', NULL);

  RETURN new;
END;
$$;

-- 6. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
