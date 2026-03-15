import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  fetchSiteSettings,
  fetchChainOfCommand,
  fetchRules,
  fetchFaq,
  fetchGallery,
  fetchServerStats,
} from "@/lib/supabase-cms";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { ChainOfCommandItem, RuleCategory, FaqItem, GalleryItem } from "@/lib/supabase-cms";

/** Site ayarları - DB varsa oradan, yoksa i18n fallback */
export function useSiteSettings() {
  const { t } = useTranslation();
  const { data: db, isLoading: settingsLoading } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: fetchSiteSettings,
    enabled: isSupabaseEnabled,
  });

  const general = (db?.general ?? {
    siteName: t("nav.brand"),
    slogan: `${t("hero.title1")} ${t("hero.title2")} ${t("hero.title3")}`,
    heroBadge: t("hero.badge"),
    heroSubtitle: t("hero.subtitle"),
    aboutTitle: t("about.title"),
    aboutP1: t("about.p1"),
    aboutP2: t("about.p2"),
    aboutP3: t("about.p3"),
    footerDesc: t("footer.desc"),
    footerCopyright: t("footer.copyright"),
  }) as Record<string, string>;

  const values = (db?.values ?? {
    justice: { title: t("about.justice.title"), text: t("about.justice.text") },
    integrity: { title: t("about.integrity.title"), text: t("about.integrity.text") },
    service: { title: t("about.service.title"), text: t("about.service.text") },
  }) as Record<string, { title: string; text: string }>;

  const mission = (db?.mission ?? {
    label: t("mission.label"),
    title: t("mission.title"),
    p1: t("mission.p1"),
    p2: t("mission.p2"),
    p3: t("mission.p3"),
  }) as Record<string, string>;

  const quickLinks = (db?.quickLinks ?? {
    title: t("quickLinks.title"),
    subtitle: t("quickLinks.subtitle"),
  }) as { title: string; subtitle: string };

  const footer = (db?.footer ?? {
    contactTitle: t("footer.contact"),
    discordLabel: t("footer.discord"),
    discordText: "discord.gg/usmarshals",
    discordUrl: "https://discord.gg/usmarshals",
  }) as { contactTitle: string; discordLabel: string; discordText: string; discordUrl: string };

  const heroStats = (db?.heroStats ?? {
    agents_count: 42,
    operations_count: 1847,
    founded_year: 1789,
  }) as { agents_count: number; operations_count: number; founded_year: number };

  return { general, values, mission, quickLinks, footer, heroStats, settingsLoading };
}

export function useChainOfCommandData() {
  const { t } = useTranslation();
  const { data: db = [] } = useQuery({
    queryKey: ["chainOfCommand"],
    queryFn: fetchChainOfCommand,
    enabled: isSupabaseEnabled,
  });

  if (db.length > 0) return db;

  const keys = ["chiefMarshal", "supervisoryDeputy", "seniorDeputy", "deputyMarshal"] as const;
  return keys.map((k, i) => ({
    id: `static-${k}`,
    rank: t(`chainOfCommand.${k}.rank`),
    name: "—",
    description: t(`chainOfCommand.${k}.desc`),
    sort_order: i,
  })) as ChainOfCommandItem[];
}

export function useRulesData() {
  const { t } = useTranslation();
  const { data: db = [] } = useQuery({
    queryKey: ["rules"],
    queryFn: fetchRules,
    enabled: isSupabaseEnabled,
  });

  if (db.length > 0) return db;

  const sections = [
    { categoryKey: "discipline", items: ["1.1"] },
    { categoryKey: "uniform", items: ["2.1"] },
    { categoryKey: "weapons", items: ["3.1"] },
  ];
  return sections.map((s, si) => ({
    id: `static-${s.categoryKey}`,
    category: t(`rules.${s.categoryKey}`),
    sort_order: si,
    items: s.items.map((id) => ({
      id: `${id}`,
      item_id: id,
      content: t(`rules.items.${id}`),
    })),
  })) as RuleCategory[];
}

export function useFaqData() {
  const { t } = useTranslation();
  const { data: db = [] } = useQuery({
    queryKey: ["faq"],
    queryFn: fetchFaq,
    enabled: isSupabaseEnabled,
  });

  if (db.length > 0) return db;

  const keys = ["process", "exp", "training", "activity", "transfer", "promotion"] as const;
  return keys.map((k, i) => ({
    id: `static-${k}`,
    question: t(`faq.items.${k}.q`),
    answer: t(`faq.items.${k}.a`),
    sort_order: i,
  })) as FaqItem[];
}

export function useGalleryData() {
  const { data: db = [] } = useQuery({
    queryKey: ["gallery"],
    queryFn: fetchGallery,
    enabled: isSupabaseEnabled,
  });
  return db;
}

/** server_stats: savci_count, usms_count (Başsavcı/USMS aktiflik sayaçları) */
export function useServerStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["serverStats"],
    queryFn: fetchServerStats,
    enabled: isSupabaseEnabled,
  });
  return {
    savci_count: data?.savci_count ?? 0,
    usms_count: data?.usms_count ?? 0,
    isLoading,
  };
}
