import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[hello] Request received");
    
    // Manual authentication handling (since verify_jwt is false)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.warn("[hello] Unauthorized request - no auth header");
      return new Response('Unauthorized', {
        status: 401,
        headers: corsHeaders
      })
    }

    return new Response(
      JSON.stringify({ message: "Hello from Supabase Edge Functions!" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("[hello] Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
})
