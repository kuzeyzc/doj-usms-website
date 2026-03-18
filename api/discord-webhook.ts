/**
 * Discord Webhook Proxy - Tarayıcıdan Discord API'ye CORS engeli nedeniyle
 * doğrudan istek atılamaz. Bu API route sunucu tarafından Discord'a iletir.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

const WEBHOOK_DOCUMENTS =
  process.env.DISCORD_WEBHOOK_DOCUMENTS ||
  "https://discord.com/api/webhooks/1482726349167788195/Czrs_6jXZyz8ZxlFyG_Gw59rNEefWIrb3D5zVHdAwzYyq41B3YpTmsfUbru69kdVH9qs";

const WEBHOOK_APPLICATIONS =
  process.env.DISCORD_WEBHOOK_APPLICATIONS ||
  process.env.DISCORD_WEBHOOK_DOCUMENTS ||
  "https://discord.com/api/webhooks/1482457570487832617/i51liDGOHUU_zQsEMPdOUR9Bc5gDNJMzaNN0s-G_sj2GwnZmCyfB7XvnJ0yVcovjThcY";

const WEBHOOK_APPLICATIONS_APPROVED =
  process.env.DISCORD_WEBHOOK_APPLICATIONS_APPROVED ||
  "https://discord.com/api/webhooks/1482746444975837274/R_U6_vfffEXjO7_Z9FJ7-mARcnVw5GxJtgZ9c3_G_FBvBhCFWEXOQrJ-iflPec_H-L1n";

const WEBHOOK_WARRANTS =
  process.env.DISCORD_WEBHOOK_WARRANTS ||
  "https://discord.com/api/webhooks/1483096194648379596/f6hgc9YVEAwxztXxv7JM10b30Eyd_t4Mt5El4tCXnNmOmCuFvbuFjulnG07k0vXOBbB4";

const WEBHOOKS: Record<string, string> = {
  documents: WEBHOOK_DOCUMENTS,
  applications: WEBHOOK_APPLICATIONS,
  "applications-approved": WEBHOOK_APPLICATIONS_APPROVED,
  warrants: WEBHOOK_WARRANTS,
};

export async function POST(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, body } = (await request.json()) as { type?: string; body?: object };
    if (!type || !body) {
      return new Response(
        JSON.stringify({ error: "type ve body zorunludur" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookUrl = WEBHOOKS[type];
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: `Geçersiz webhook tipi: ${type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord webhook error:", discordRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Discord webhook hatası", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("discord-webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Sunucu hatası" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}
