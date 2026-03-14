/** Discord Webhook'a embed mesajı gönder */
export async function sendApplicationToDiscord(
  payload: {
    name: string;
    discord: string;
    fivem_id: string;
    age: string;
    experience?: string;
    reason: string;
    scenario_answers?: Record<string, string>;
    scenario?: string;
  },
  questionLabels?: Record<string, string>
): Promise<boolean> {
  const url = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  if (!url || typeof url !== "string" || !url.startsWith("https://discord.com/api/webhooks/")) {
    return false;
  }

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "İsim", value: payload.name, inline: true },
    { name: "Discord", value: payload.discord, inline: true },
    { name: "FiveM / Hex ID", value: payload.fivem_id, inline: true },
    { name: "Yaş", value: payload.age, inline: true },
    { name: "Deneyim", value: payload.experience || "—", inline: true },
    { name: "Motivasyon", value: payload.reason.length > 1024 ? payload.reason.slice(0, 1021) + "..." : payload.reason, inline: false },
  ];

  if (payload.scenario_answers && Object.keys(payload.scenario_answers).length > 0) {
    for (const [qId, ans] of Object.entries(payload.scenario_answers)) {
      const val = ans.length > 1024 ? ans.slice(0, 1021) + "..." : ans;
      const label = questionLabels?.[qId] || `Senaryo`;
      fields.push({ name: label, value: val, inline: false });
    }
  } else if (payload.scenario) {
    const val = payload.scenario.length > 1024 ? payload.scenario.slice(0, 1021) + "..." : payload.scenario;
    fields.push({ name: "Senaryo Cevabı", value: val, inline: false });
  }

  const body = {
    embeds: [
      {
        title: "Yeni Başvuru",
        description: `${payload.name} — US Marshal başvurusu`,
        color: 0xc5a059,
        fields,
        footer: { text: "DOJ Marshals" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}
