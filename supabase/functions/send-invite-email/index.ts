import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, inviterName, scriptTitle, role, scriptUrl } = await req.json();

    if (!to || !scriptTitle || !scriptUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, scriptTitle, scriptUrl" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const senderName = inviterName || 'Someone';
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
            <strong>${senderName}</strong> has invited you as ${roleName} on:
          </p>
          <div style="background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #7c3aed; font-size: 18px; font-weight: 700; margin: 0; font-family: 'Courier Prime', 'Courier New', monospace;">${scriptTitle}</p>
          </div>
          <a href="${scriptUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0;">
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
        subject: `${senderName} invited you to collaborate on "${scriptTitle}"`,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend API error: ${res.status} ${errBody}`);
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
