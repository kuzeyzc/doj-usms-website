/**
 * Discord Webhook - Belge & Başvuru bildirimleri
 * DOJ Gold rengi: #D4AF37 = 13938587 (decimal)
 *
 * NOT: Discord API tarayıcıdan doğrudan çağrılamaz (CORS). Vercel API route
 * veya Supabase Edge Function proxy üzerinden iletilir.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

/** Vercel API route (aynı domain - deploy olduğunda çalışır) */
const API_PROXY_URL = "/api/discord-webhook";
/** Supabase Edge Function (alternatif) */
const SUPABASE_PROXY_URL = supabaseUrl && supabaseAnonKey
  ? `${supabaseUrl}/functions/v1/discord-webhook-proxy`
  : null;

const DOJ_GOLD = 0xd4af37; // #D4AF37
const GREEN = 0x00ff00; // #00FF00 - Onay rengi

/** Proxy üzerinden Discord'a gönder (CORS bypass) */
async function sendToDiscordViaProxy(
  type: "documents" | "applications" | "applications-approved" | "warrants",
  body: object
): Promise<boolean> {
  const payload = { type, body };

  // 1) Önce Vercel API route dene (aynı origin)
  try {
    const res = await fetch(API_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return true;
  } catch {
    /* devam et */
  }

  // 2) Supabase Edge Function (alternatif)
  if (SUPABASE_PROXY_URL) {
    try {
      const res = await fetch(SUPABASE_PROXY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  return false;
}

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
  return sendToDiscordViaProxy("documents", body);
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
  return sendToDiscordViaProxy("applications", body);
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
  return sendToDiscordViaProxy("applications-approved", body);
}

/** Adli Talep - her talep gönderildiğinde Discord'a embed olarak iletilir */
export interface WarrantWebhookPayload {
  caseId: string;
  applicantName: string;
  department: string;
  rank: string;
  target: string;
  requestType: string;
  reason: string;
  evidenceUrls: string[];
  createdAt: string;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  Raid: "Baskın",
  Search: "Arama",
  Surveillance: "Gözetleme",
  Other: "Diğer",
};

function formatWarrantRequestType(requestType: string, requestTypeOther?: string): string {
  if (requestType === "Other" && requestTypeOther?.trim()) {
    return `Diğer: ${requestTypeOther.trim()}`;
  }
  return REQUEST_TYPE_LABELS[requestType] ?? requestType;
}

export async function sendWarrantToDiscord(
  payload: WarrantWebhookPayload & { requestTypeOther?: string }
): Promise<boolean> {
  const requestTypeLabel = formatWarrantRequestType(
    payload.requestType,
    payload.requestTypeOther
  );
  const imageUrls = (payload.evidenceUrls ?? [])
    .filter((u) => /\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(u.split("?")[0]))
    .slice(0, 10);
  const sharedUrl = imageUrls[0] ?? (typeof window !== "undefined" ? `${window.location.origin}/warrant` : "https://doj-marshals.example/");

  const mainFields: { name: string; value: string; inline?: boolean }[] = [
    { name: "Dosya No", value: payload.caseId, inline: true },
    { name: "Talep Türü", value: requestTypeLabel, inline: true },
    { name: "Tarih", value: new Date(payload.createdAt).toLocaleString("tr-TR"), inline: true },
    { name: "Başvuran", value: `${payload.applicantName} (${payload.rank})`, inline: true },
    { name: "Birim", value: payload.department, inline: true },
    { name: "Hedef", value: payload.target, inline: true },
    { name: "Gerekçe", value: payload.reason.slice(0, 1024), inline: false },
  ];

  const embeds: {
    title?: string;
    color: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    timestamp: string;
    image?: { url: string };
    footer?: { text: string };
  }[] = [];

  if (imageUrls.length === 0) {
    embeds.push({
      title: "📋 Yeni Adli Talep",
      url: sharedUrl,
      color: DOJ_GOLD,
      fields: mainFields,
      timestamp: new Date().toISOString(),
      footer: { text: "USMS Başyargıçlığı — Adli Talep Sistemi" },
    });
  } else {
    imageUrls.forEach((imgUrl, i) => {
      if (i === 0) {
        embeds.push({
          title: "📋 Yeni Adli Talep",
          url: sharedUrl,
          color: DOJ_GOLD,
          fields: mainFields,
          timestamp: new Date().toISOString(),
          image: { url: imgUrl },
          footer: { text: "USMS Başyargıçlığı — Adli Talep Sistemi" },
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

  return sendToDiscordViaProxy("warrants", { embeds });
}
