import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '';

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGIN && origin === ALLOWED_ORIGIN ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

/** Escape HTML special characters to prevent injection */
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/** Validate that a URL is a safe HTTP(S) URL */
const isValidHttpUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { to, inviterName, scriptTitle, role, scriptUrl } = await req.json();

    if (!to || !scriptTitle || !scriptUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, scriptTitle, scriptUrl" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate scriptUrl to prevent open redirect / phishing
    if (!isValidHttpUrl(scriptUrl)) {
      return new Response(
        JSON.stringify({ error: "Invalid script URL" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Escape all user-controlled values before inserting into HTML
    const safeSenderName = escapeHtml(inviterName || 'Someone');
    const safeScriptTitle = escapeHtml(scriptTitle);
    const safeScriptUrl = escapeHtml(scriptUrl);
    const roleName = role === 'editor' ? 'an Editor' : 'a Viewer';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">ScriptFlow</h1>
          <p style="color: #e9d5ff; font-size: 14px; margin: 8px 0 0;">Collaborative Screenwriting</p>
        </div>
        <div style="padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px;">You've been invited to collaborate!</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
            <strong>${safeSenderName}</strong> has invited you as ${roleName} on:
          </p>
          <div style="background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #7c3aed; font-size: 18px; font-weight: 700; margin: 0; font-family: 'Courier Prime', 'Courier New', monospace;">${safeScriptTitle}</p>
          </div>
          <a href="${safeScriptUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0;">
            Open Script
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0; line-height: 1.5;">
            If you don't have a ScriptFlow account yet, you'll be prompted to sign up when you click the link.
          </p>
        </div>
        <p style="color: #d1d5db; font-size: 11px; text-align: center; margin: 16px 0 0;">
          ScriptFlow &mdash; Professional screenwriting, reimagined.
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ScriptFlow <onboarding@resend.dev>',
        to: [to],
        subject: `${safeSenderName} invited you to collaborate on "${safeScriptTitle}"`,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`Resend API error: ${res.status} ${errBody}`);
      throw new Error("Failed to send email");
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[send-invite-email]", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to send invitation email" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
