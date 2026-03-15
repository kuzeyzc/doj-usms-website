/**
 * Discord Webhook - Belge & Başvuru bildirimleri
 * DOJ Gold rengi: #D4AF37 = 13938587 (decimal)
 */
const DISCORD_WEBHOOK_DOCUMENTS =
  import.meta.env.VITE_DISCORD_WEBHOOK_DOCUMENTS ||
  "https://discord.com/api/webhooks/1482726349167788195/Czrs_6jXZyz8ZxlFyG_Gw59rNEefWIrb3D5zVHdAwzYyq41B3YpTmsfUbru69kdVH9qs";

/** #site-başvuru kanalı - Yeni başvuru formu gönderildiğinde */
const DISCORD_WEBHOOK_APPLICATIONS =
  import.meta.env.VITE_DISCORD_WEBHOOK_APPLICATIONS ||
  "https://discord.com/api/webhooks/1482457570487832617/i51liDGOHUU_zQsEMPdOUR9Bc5gDNJMzaNN0s-G_sj2GwnZmCyfB7XvnJ0yVcovjThcY";

/** #başvuru-onay kanalı - Başvuru onaylandığında bildirim */
const DISCORD_WEBHOOK_APPLICATIONS_APPROVED =
  import.meta.env.VITE_DISCORD_WEBHOOK_APPLICATIONS_APPROVED ||
  "https://discord.com/api/webhooks/1482746444975837274/R_U6_vfffEXjO7_Z9FJ7-mARcnVw5GxJtgZ9c3_G_FBvBhCFWEXOQrJ-iflPec_H-L1n";

const DOJ_GOLD = 0xd4af37; // #D4AF37
const GREEN = 0x00ff00; // #00FF00 - Onay rengi

export interface DocumentWebhookPayload {
  title: string;
  category: string;
  date: string;
  description?: string;
  file_url?: string;
  file_urls?: string[];
  file_type?: string;
}

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

function resolveFileUrl(url: string, baseOrigin: string): string {
  if (url.startsWith("http") || url.startsWith("https")) return url;
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
  return `${baseOrigin}${base}${url.startsWith("/") ? url : "/" + url}`;
}

function isImageUrl(url: string, fileType?: string): boolean {
  const path = url.split("?")[0].toLowerCase();
  const hasImageExt = IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext));
  return hasImageExt || fileType === "png";
}

export async function sendDocumentToDiscord(
  payload: DocumentWebhookPayload
): Promise<boolean> {
  const baseOrigin = window.location.origin;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "📌 Başlık", value: payload.title, inline: false },
    { name: "📁 Kategori", value: payload.category, inline: true },
    { name: "📅 Tarih", value: payload.date, inline: true },
  ];

  if (payload.description?.trim()) {
    fields.push({
      name: "📝 Notlar",
      value: payload.description.trim(),
      inline: false,
    });
  }

  const urls = payload.file_urls?.length
    ? payload.file_urls
    : payload.file_url
      ? [payload.file_url]
      : [];

  const resolvedUrls = urls
    .filter(Boolean)
    .map((u) => resolveFileUrl(u!, baseOrigin));

  const imageUrls = resolvedUrls.filter((u) =>
    isImageUrl(u, payload.file_type)
  );

  if (resolvedUrls.length > 0) {
    const linkText =
      resolvedUrls.length === 1
        ? `[Belgeyi Görüntüle](${resolvedUrls[0]})`
        : resolvedUrls
            .map((u, i) => `[Sayfa ${i + 1}](${u})`)
            .join(" • ");
    fields.push({
      name: "🔗 Dosya Linki",
      value: linkText,
      inline: false,
    });
  }

  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
  const sharedUrl =
    resolvedUrls[0] ?? `${baseOrigin}${base ? base + "/" : "/"}documents`;

  const embeds: {
    title?: string;
    url?: string;
    color: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    timestamp: string;
    image?: { url: string };
  }[] = [];

  if (imageUrls.length === 0) {
    embeds.push({
      title: "📄 Yeni Belge Kaydı!",
      url: sharedUrl,
      color: DOJ_GOLD,
      fields,
      timestamp: new Date().toISOString(),
    });
  } else {
    imageUrls.forEach((imgUrl, i) => {
      if (i === 0) {
        embeds.push({
          title: "📄 Yeni Belge Kaydı!",
          url: sharedUrl,
          color: DOJ_GOLD,
          fields,
          timestamp: new Date().toISOString(),
          image: { url: imgUrl },
        });
      } else {
        embeds.push({
          url: sharedUrl,
          color: DOJ_GOLD,
          timestamp: new Date().toISOString(),
          image: { url: imgUrl },
        });
      }
    });
  }

  const body = { embeds };

  try {
    const res = await fetch(DISCORD_WEBHOOK_DOCUMENTS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface ApplicationWebhookPayload {
  name: string;
  discord: string;
  fivem_id: string;
  age: string;
  experience?: string;
  reason: string;
  scenario_answers?: Record<string, string>;
  scenario?: string;
}

export async function sendApplicationToDiscord(
  payload: ApplicationWebhookPayload,
  questionLabels?: Record<string, string>
): Promise<boolean> {
  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "👤 İsim", value: payload.name, inline: true },
    { name: "💬 Discord", value: payload.discord, inline: true },
    { name: "🎮 FiveM ID", value: payload.fivem_id, inline: true },
    { name: "📅 Yaş", value: payload.age, inline: true },
    { name: "📝 Motivasyon", value: payload.reason, inline: false },
  ];

  if (payload.experience) {
    fields.push({ name: "📊 Deneyim", value: payload.experience, inline: true });
  }

  if (payload.scenario_answers && Object.keys(payload.scenario_answers).length > 0 && questionLabels) {
    const scenarioText = Object.entries(payload.scenario_answers)
      .map(([id, ans]) => {
        const label = questionLabels[id] ?? id;
        return `**${label}**\n${ans}`;
      })
      .join("\n\n");
    fields.push({ name: "📋 Senaryo Cevapları", value: scenarioText.slice(0, 1024), inline: false });
  } else if (payload.scenario?.trim()) {
    fields.push({ name: "📋 Senaryo", value: payload.scenario.slice(0, 1024), inline: false });
  }

  const body = {
    embeds: [
      {
        title: "📋 Yeni Başvuru!",
        color: DOJ_GOLD,
        fields,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(DISCORD_WEBHOOK_APPLICATIONS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Discord ID sayısal mı? (15-22 haneli) - <@ID> ile etiketleme için */
function isDiscordNumericId(value: string): boolean {
  const trimmed = String(value || "").trim().replace(/\s/g, "");
  return /^\d{15,22}$/.test(trimmed);
}

export interface ApplicationApprovalPayload {
  name: string;
  discord: string;
}

/**
 * Başvuru onaylandığında #başvuru-onay kanalına bildirim gönderir.
 * Discord ID sayısal ise <@ID> ile etiketler.
 */
export async function sendApplicationApprovalToDiscord(
  payload: ApplicationApprovalPayload
): Promise<boolean> {
  const discordId = String(payload.discord || "").trim().replace(/\s/g, "");
  const mention = isDiscordNumericId(discordId) ? `<@${discordId}>` : null;

  const body: { content?: string; embeds: object[] } = {
    embeds: [
      {
        title: "✅ Başvurunuz Onaylandı!",
        description: `Sayın **${payload.name}**, USMS bünyesine yaptığınız başvuru titizlikle incelenmiş ve **ONAYLANMIŞTIR**. Tebrik ederiz!`,
        color: GREEN,
        footer: {
          text: "Mülakat ve eğitim süreci için lütfen beklemede kalın.",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
  if (mention) body.content = mention;

  try {
    const res = await fetch(DISCORD_WEBHOOK_APPLICATIONS_APPROVED, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}
