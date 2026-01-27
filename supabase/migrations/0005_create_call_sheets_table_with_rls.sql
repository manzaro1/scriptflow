-- Create call_sheets table for production management
CREATE TABLE public.call_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  production_day TEXT DEFAULT '1',
  crew_call TEXT DEFAULT '07:00',
  call_date DATE DEFAULT CURRENT_DATE,
  locations JSONB DEFAULT '[]'::jsonb,
  weather JSONB DEFAULT '{"temp": "72°F", "condition": "Sunny"}'::jsonb,
  contacts JSONB DEFAULT '[]'::jsonb,
  schedule JSONB DEFAULT '[]'::jsonb,
  cast_calls JSONB DEFAULT '[]'::jsonb,
  production_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.call_sheets ENABLE ROW LEVEL SECURITY;

-- Create secure policies
CREATE POLICY "Users can view call sheets for their scripts" ON public.call_sheets
FOR SELECT TO authenticated 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.script_collaborators 
    WHERE script_id = call_sheets.script_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert call sheets for their scripts" ON public.call_sheets
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update call sheets they own" ON public.call_sheets
FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete call sheets they own" ON public.call_sheets
FOR DELETE TO authenticated 
USING (user_id = auth.uid());