import { supabase } from "@/integrations/supabase/client";

/** 
 * Saves the Gemini API key to the user's profile in Supabase.
 * This is more secure than localStorage as it's tied to the user's session.
 */
export const saveGeminiKey = async (key: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ gemini_api_key: key })
    .eq('id', user.id);

  return !error;
};

/** Removes the Gemini API key from the user's profile */
export const removeGeminiKey = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ gemini_api_key: null })
    .eq('id', user.id);

  return !error;
};

/** Checks if the user has an API key configured in their profile */
export const hasGeminiKey = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('gemini_api_key')
    .eq('id', user.id)
    .single();

  return !!data?.gemini_api_key && !error;
};

/** Test the Gemini key by making a lightweight API call */
export const testGeminiKey = async (key: string): Promise<boolean> => {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Reply with just the word OK." }] }],
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
};

/** Invoke a Supabase edge function. The function now fetches the key server-side. */
export const callAIFunction = async <T = any>(
  functionName: string,
  body: Record<string, any>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });

    if (error) {
      return { data: null, error: error.message || "Edge function error" };
    }

    // Handle the specific "NO_API_KEY" error returned by the function
    if (data?.error === "NO_API_KEY") {
      return { data: null, error: "NO_API_KEY" };
    }

    return { data: data as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error" };
  }
};