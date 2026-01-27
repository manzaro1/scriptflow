CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_script_id UUID;
  default_content JSONB;
BEGIN
  -- Define a more impressive sample script
  default_content := '[
    {"id":"1","type":"slugline","content":"EXT. RAIN-SLICKED ALLEY - NIGHT"},
    {"id":"2","type":"action","content":"A flickering neon sign for ''NEURAL NET'' buzzes overhead. JAX (30s, weary) stands under a dripping awning, clutching a glowing data core. He looks over his shoulder."},
    {"id":"3","type":"character","content":"JAX"},
    {"id":"4","type":"parenthetical","content":"whispering"},
    {"id":"5","type":"dialogue","content":"Just a few more minutes. That was the deal."},
    {"id":"6","type":"slugline","content":"INT. UNDERGROUND HUB - CONTINUOUS"},
    {"id":"7","type":"action","content":"The heavy steel doors hiss open. VERA (40s, sharp) waits in the shadows. Her cybernetic eye pulses with a cold, electric red light."},
    {"id":"8","type":"character","content":"VERA"},
    {"id":"9","type":"dialogue","content":"You''re late, Jax. I don''t like being kept in the dark. Literally or figuratively."},
    {"id":"10","type":"character","content":"JAX"},
    {"id":"11","type":"parenthetical","content":"breathless"},
    {"id":"12","type":"dialogue","content":"The Enforcers... they were waiting at the perimeter. They knew I was coming."},
    {"id":"13","type":"character","content":"VERA"},
    {"id":"14","type":"dialogue","content":"Then the price just went up. Give me the Echo Core."},
    {"id":"15","type":"action","content":"Jax holds up the pulsing device. The room illuminates in a rhythmic blue light, reflecting off Vera''s metallic features."}
  ]'::jsonb;

  -- Create User Profile
  INSERT INTO public.profiles (id, first_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1))
  );

  -- Create the Sample Script
  INSERT INTO public.scripts (user_id, title, author, genre, content, status)
  VALUES (
    new.id, 
    'The Last Echo', 
    COALESCE(new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1)), 
    'Sci-Fi',
    default_content,
    'In Progress'
  ) RETURNING id INTO new_script_id;

  -- Create Initial Storyboard
  INSERT INTO public.storyboards (script_id, user_id, data, aspect_ratio)
  VALUES (
    new_script_id,
    new.id,
    '[{"id":"1","sceneTitle":"EXT. RAIN-SLICKED ALLEY - NIGHT","shotNumber":"01","shotType":"W.S","cameraAngle":"Low Angle","movement":"Slow Dolly In","lens":"24mm Wide","emotion":"Tense","lighting":"Neon Low Light","colorGrade":"Teal & Orange","visualPrompt":"Cinematic rainy alleyway, neon signs flickering.","audioTag":"[Rain Patter]","sfx":"Rain","transition":"FADE IN"}]'::jsonb,
    '2.39:1'
  );

  RETURN new;
END;
$$;