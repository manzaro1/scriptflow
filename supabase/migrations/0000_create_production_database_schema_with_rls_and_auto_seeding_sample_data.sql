-- 1. Create Profiles Table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner_policy" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);

-- 2. Create Scripts Table
CREATE TABLE public.scripts (
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
CREATE POLICY "scripts_owner_policy" ON public.scripts FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 3. Create Storyboards Table
CREATE TABLE public.storyboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '[]'::jsonb,
  aspect_ratio TEXT DEFAULT '2.39:1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.storyboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "storyboards_owner_policy" ON public.storyboards FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 4. Function to seed sample data on signup
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

  RETURN new;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();