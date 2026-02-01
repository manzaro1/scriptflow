-- Ensure the function is robust and uses the correct search path for security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_script_id UUID;
  default_content JSONB;
BEGIN
  -- Define the sample script content
  default_content := '[
    {"id":"1","type":"slugline","content":"EXT. RAIN-SLICKED ALLEY - NIGHT"},
    {"id":"2","type":"action","content":"A flickering neon sign for ''NEURAL NET'' buzzes overhead. JAX (30s, weary) stands under a dripping awning, clutching a glowing data core. He looks over his shoulder."},
    {"id":"3","type":"character","content":"JAX"},
    {"id":"4","type":"parenthetical","content":"whispering"},
    {"id":"5","type":"dialogue","content":"Just a few more minutes. That was the deal."},
    {"id":"6","type":"slugline","content":"INT. UNDERGROUND HUB - CONTINUOUS"},
    {"id":"7","type":"action","content":"The heavy steel doors hiss open. VERA (40s, sharp) waits in the shadows. Her cybernetic eye pulses with a cold, electric red light."},
    {"id":"8","type":"character","content":"VERA"},
    {"id":"9","type":"dialogue","content":"You''re late, Jax. I don''t like being kept in the dark. Literally or figuratively."}
  ]'::jsonb;

  -- 1. Create User Profile
  INSERT INTO public.profiles (id, first_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create the Sample Script
  INSERT INTO public.scripts (user_id, title, author, genre, content, status)
  VALUES (
    new.id, 
    'The Last Echo', 
    COALESCE(new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1)), 
    'Sci-Fi',
    default_content,
    'In Progress'
  ) RETURNING id INTO new_script_id;

  -- 3. Create Initial Storyboard for the sample
  INSERT INTO public.storyboards (script_id, user_id, data, aspect_ratio)
  VALUES (
    new_script_id,
    new.id,
    '[]'::jsonb,
    '2.39:1'
  );

  RETURN new;
END;
$$;

-- Re-establish the trigger on the auth schema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATCH-UP: Manually run for users who signed up before the trigger was ready
-- This will insert the sample script for any user who doesn't have one yet
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
        IF NOT EXISTS (SELECT 1 FROM public.scripts WHERE user_id = user_record.id) THEN
            -- We simulate the trigger logic here for the specific user
            INSERT INTO public.profiles (id, first_name)
            VALUES (user_record.id, COALESCE(user_record.raw_user_meta_data ->> 'first_name', split_part(user_record.email, '@', 1)))
            ON CONFLICT (id) DO NOTHING;

            INSERT INTO public.scripts (user_id, title, author, genre, content, status)
            VALUES (user_record.id, 'The Last Echo', COALESCE(user_record.raw_user_meta_data ->> 'first_name', split_part(user_record.email, '@', 1)), 'Sci-Fi', '[]'::jsonb, 'In Progress');
        END IF;
    END LOOP;
END $$;