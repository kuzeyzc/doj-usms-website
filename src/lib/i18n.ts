import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tr from "@/locales/tr.json";
import en from "@/locales/en.json";

const STORAGE_KEY = "doj-marshals-lang";

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

const savedLang = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
const initialLang = savedLang === "en" || savedLang === "tr" ? savedLang : "tr";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: "tr",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch (_) {}
});

export default i18n;
