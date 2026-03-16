import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/hooks/useSiteData";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  const { t } = useTranslation();
  const { general, footer } = useSiteSettings();

  const contactTitle = footer.contactTitle || t("footer.contact");
  const discordLabel = footer.discordLabel || t("footer.discord");
  const discordText = footer.discordText || "discord.gg/usmarshals";
  const discordUrl = footer.discordUrl || "https://discord.gg/usmarshals";

  return (
    <footer className="bg-surface border-t border-primary/10 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-heading font-bold text-foreground">{general.siteName ?? t("footer.brand")}</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {general.footerDesc ?? t("footer.desc")}
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-xs uppercase tracking-section text-primary mb-4">
              {t("footer.quickLinks")}
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { label: t("nav.rules"), path: "/rules" },
                { label: t("nav.documents"), path: "/documents" },
                { label: t("nav.apply"), path: "/apply" },
                { label: t("nav.warrant"), path: "/warrant" },
                { label: t("nav.documentGenerator"), path: "/document-generator" },
                { label: t("nav.faq"), path: "/faq" },
              ].map((l) => (
                <Link key={l.path} to={l.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-xs uppercase tracking-section text-primary mb-4">
              {contactTitle}
            </h4>
            <p className="text-sm text-muted-foreground">{discordLabel}</p>
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              {discordText}
            </a>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-primary/10 text-center space-y-2">
          <p className="text-xs text-muted-foreground font-body tabular-nums">
            {general.footerCopyright ?? t("footer.copyright")}
          </p>
          <p className="text-xs text-muted-foreground/80 font-body italic">
            {t("footer.disclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}
