-- Add gemini_api_key column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- Ensure RLS allows users to manage their own key
-- (The existing profiles_manage_own policy should cover this, but we'll be explicit)
CREATE POLICY "profiles_update_key_policy" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Note: We keep the key in the profiles table so the Edge Functions can 
-- easily retrieve it using the user's ID from the auth token.