-- Drop the existing trigger and function to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Re-create the function with guaranteed JSON structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_script_id UUID;
  default_content JSONB;
BEGIN
  -- Explicitly define the initial narrative blocks
  default_content := '[
    {"id":"1","type":"slugline","content":"EXT. SKYLINE - NIGHT"},
    {"id":"2","type":"action","content":"Rain hammers against the metallic skin of the city. Neon signs flicker in shades of bruised purple and electric cyan."},
    {"id":"3","type":"character","content":"KAI"},
    {"id":"4","type":"parenthetical","content":"to himself"},
    {"id":"5","type":"dialogue","content":"This was not part of the deal."}
  ]'::jsonb;

  -- Create User Profile
  INSERT INTO public.profiles (id, first_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1))
  );

  -- Create "The Neon Horizon" Sample Script
  INSERT INTO public.scripts (user_id, title, author, genre, content, status)
  VALUES (
    new.id, 
    'The Neon Horizon', 
    COALESCE(new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1)), 
    'Sci-Fi',
    default_content,
    'In Progress'
  ) RETURNING id INTO new_script_id;

  -- Create Initial Storyboard for the sample script
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

-- Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();