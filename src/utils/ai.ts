import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "gemini_api_key";

export const getGeminiKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

export const setGeminiKey = (key: string) => {
  localStorage.setItem(STORAGE_KEY, key);
};

export const removeGeminiKey = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const hasGeminiKey = (): boolean => {
  const key = getGeminiKey();
  return !!key && key.trim().length > 0;
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

/** Invoke a Supabase edge function with the Gemini key auto-injected */
export const callAIFunction = async <T = any>(
  functionName: string,
  body: Record<string, any>
): Promise<{ data: T | null; error: string | null }> => {
  const geminiApiKey = getGeminiKey();
  if (!geminiApiKey) {
    return { data: null, error: "NO_API_KEY" };
  }

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { ...body, geminiApiKey },
    });

    if (error) {
      return { data: null, error: error.message || "Edge function error" };
    }

    return { data: data as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error" };
  }
};
