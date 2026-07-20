-- Migration 0001: Core Schema
-- Profiles, Scripts, Storyboards, Collaborators + base RLS + auto-seed on signup

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner_policy" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);

-- 2. Scripts
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT DEFAULT 'Anonymous',
  status TEXT DEFAULT 'In Progress',
  genre TEXT DEFAULT 'Sci-Fi',
  content JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scripts_select_policy" ON public.scripts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "scripts_insert_policy" ON public.scripts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scripts_update_policy" ON public.scripts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "scripts_delete_policy" ON public.scripts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Storyboards
CREATE TABLE IF NOT EXISTS public.storyboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '[]'::jsonb,
  aspect_ratio TEXT DEFAULT '2.39:1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.storyboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "storyboards_owner_policy" ON public.storyboards FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 4. Script Collaborators
CREATE TABLE IF NOT EXISTS public.script_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'accepted')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(script_id, email)
);
ALTER TABLE public.script_collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collaborators_select" ON public.script_collaborators FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.scripts WHERE id = script_id AND user_id = auth.uid()));
CREATE POLICY "collaborators_insert" ON public.script_collaborators FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.scripts WHERE id = script_id AND user_id = auth.uid()));
CREATE POLICY "collaborators_update" ON public.script_collaborators FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.scripts WHERE id = script_id AND user_id = auth.uid()));
CREATE POLICY "collaborators_delete" ON public.script_collaborators FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.scripts WHERE id = script_id AND user_id = auth.uid()));

-- 5. Auto-seed on signup
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

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();