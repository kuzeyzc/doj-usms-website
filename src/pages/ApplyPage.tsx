import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionDivider from "@/components/SectionDivider";
import { toast } from "sonner";
import { fetchFormConfig, fetchFormScenarioQuestions, insertApplication } from "@/lib/supabase-cms";
import { sendApplicationToDiscord } from "@/lib/discord-webhook";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { FormPersonalField, FormScenarioQuestion } from "@/lib/supabase-cms";

const inputGlowClass =
  "w-full bg-surface-elevated border border-primary/20 text-foreground font-body text-sm rounded-sm px-4 py-3 outline-none transition-all duration-300 placeholder:text-muted-foreground/50 input-glow focus:border-primary";
const labelClass =
  "block font-heading text-xs uppercase tracking-section text-muted-foreground font-semibold mb-2";

const DEFAULT_PERSONAL: Record<string, FormPersonalField> = {
  name: { enabled: true, label: "İsim", placeholder: "Oyun içi isminiz" },
  age: { enabled: true, label: "Yaş", placeholder: "18+" },
  discord: { enabled: true, label: "Discord Adı", placeholder: "kullanıcı#0000" },
  hexId: { enabled: true, label: "Hex ID", placeholder: "Steam/FiveM ID" },
};

const DEFAULT_EXPERIENCE = {
  title: "Deneyim & Motivasyon",
  reasonLabel: "Neden US Marshal Olmak İstiyorsunuz?",
  reasonPlaceholder: "Motivasyonunuzu açıklayın...",
  experienceLabel: "RP Deneyimi",
  experienceOptions: ["Başlangıç (0-6 ay)", "Orta (6-12 ay)", "Deneyimli (1-2 yıl)", "Uzman (2+ yıl)"],
};

export default function ApplyPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: config = {}, isLoading: configLoading } = useQuery({
    queryKey: ["formConfig"],
    queryFn: fetchFormConfig,
    enabled: isSupabaseEnabled,
  });

  const { data: scenarioQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["formScenarioQuestions"],
    queryFn: fetchFormScenarioQuestions,
    enabled: isSupabaseEnabled,
  });

  const personal = config.personal ?? DEFAULT_PERSONAL;
  const experience = config.experience ?? DEFAULT_EXPERIENCE;
  const enabledPersonal = Object.entries(personal).filter(([, v]) => v.enabled);
  const totalSteps = 1 + 1 + scenarioQuestions.length;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const canProceed = () => {
    if (step === 1) {
      if (personal.name?.enabled && !form.name?.trim()) return false;
      if (personal.age?.enabled && !form.age?.trim()) return false;
      if (personal.discord?.enabled && !form.discord?.trim()) return false;
      if (personal.hexId?.enabled && !form.hexId?.trim()) return false;
      return true;
    }
    if (step === 2) return !!form.reason?.trim();
    const scenarioIndex = step - 3;
    const q = scenarioQuestions[scenarioIndex];
    if (!q) return true;
    const val = form[`scenario_${q.id}`] ?? "";
    return val.length >= q.min_chars;
  };

  const next = () => {
    if (!canProceed() && step < totalSteps) {
      toast.error(t("apply.validateAll"));
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed()) {
      toast.error(t("apply.validateAll"));
      return;
    }

    const scenarioAnswers: Record<string, string> = {};
    for (const q of scenarioQuestions) {
      const val = form[`scenario_${q.id}`] ?? "";
      if (val) scenarioAnswers[q.id] = val;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name ?? "",
        discord: form.discord ?? "",
        fivem_id: form.hexId ?? form.fivemId ?? "",
        age: form.age ?? "",
        experience: form.experience || undefined,
        reason: form.reason ?? "",
        status: "pending",
      };
      if (Object.keys(scenarioAnswers).length > 0) {
        payload.scenario_answers = scenarioAnswers;
        payload.scenario = null;
      } else {
        payload.scenario = "";
      }

      if (isSupabaseEnabled) {
        const id = await insertApplication(payload);
        if (!id) throw new Error("Insert failed");
        const questionLabels = Object.fromEntries(
          scenarioQuestions.map((q) => [q.id, q.question_text.length > 256 ? q.question_text.slice(0, 253) + "..." : q.question_text])
        );
        await sendApplicationToDiscord(
          {
            name: payload.name as string,
            discord: payload.discord as string,
            fivem_id: payload.fivem_id as string,
            age: payload.age as string,
            experience: payload.experience as string | undefined,
            reason: payload.reason as string,
            scenario_answers: Object.keys(scenarioAnswers).length > 0 ? scenarioAnswers : undefined,
            scenario: Object.keys(scenarioAnswers).length === 0 ? undefined : Object.values(scenarioAnswers).join("\n\n"),
          },
          questionLabels
        );
      } else {
        await new Promise((r) => setTimeout(r, 1500));
      }
      setSubmitted(true);
      toast.success(t("apply.successTitle"));
    } catch {
      toast.error(t("admin.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = isSupabaseEnabled && (configLoading || questionsLoading);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-[640px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: [0.2, 0.8, 0.2, 1] }}
              className="mb-12"
            >
              <h2 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-4">
                {t("apply.label")}
              </h2>
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground tracking-hero text-balance mb-6">
                {t("apply.title")}
              </h1>
              <p className="text-muted-foreground font-body leading-relaxed">
                {t("apply.intro")}
              </p>
            </motion.div>

            <SectionDivider />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10 p-6 bg-surface-elevated rounded-lg"
              style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.1)" }}
            >
              <h3 className="font-heading font-semibold text-primary text-sm mb-3">
                {t("apply.prereq")}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground font-body">
                <li>• {t("apply.prereq1")}</li>
                <li>• {t("apply.prereq2")}</li>
                <li>• {t("apply.prereq3")}</li>
                <li>• {t("apply.prereq4")}</li>
              </ul>
            </motion.div>

            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Form yükleniyor...</div>
            ) : submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-primary text-2xl">✓</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                  {t("apply.successTitle")}
                </h3>
                <p className="text-muted-foreground font-body">{t("apply.successMsg")}</p>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-8">
                  {Array.from({ length: totalSteps }).map((_, s) => (
                    <div key={s} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-heading font-bold transition-colors ${
                          step >= s + 1 ? "bg-primary text-primary-foreground" : "bg-surface-elevated text-muted-foreground"
                        }`}
                      >
                        {s + 1}
                      </div>
                      {s < totalSteps - 1 && <div className="w-8 md:w-12 h-0.5 bg-primary/20 mx-1" />}
                    </div>
                  ))}
                </div>
                <p className="text-xs font-heading uppercase tracking-section text-primary mb-6">
                  {step === 1 && t("apply.steps.personal")}
                  {step === 2 && (experience.title || t("apply.steps.experience"))}
                  {step > 2 && `Senaryo ${step - 2}`}
                </p>

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ ease: [0.2, 0.8, 0.2, 1] }}
                      className="space-y-6"
                    >
                      {personal.name?.enabled && (
                        <div>
                          <label className={labelClass}>{personal.name.label} *</label>
                          <input
                            name="name"
                            value={form.name ?? ""}
                            onChange={handleChange}
                            placeholder={personal.name.placeholder}
                            className={inputGlowClass}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {personal.discord?.enabled && (
                          <div>
                            <label className={labelClass}>{personal.discord.label} *</label>
                            <input
                              name="discord"
                              value={form.discord ?? ""}
                              onChange={handleChange}
                              placeholder={personal.discord.placeholder}
                              className={inputGlowClass}
                            />
                          </div>
                        )}
                        {personal.hexId?.enabled && (
                          <div>
                            <label className={labelClass}>{personal.hexId.label} *</label>
                            <input
                              name="hexId"
                              value={form.hexId ?? ""}
                              onChange={handleChange}
                              placeholder={personal.hexId.placeholder}
                              className={inputGlowClass}
                            />
                          </div>
                        )}
                      </div>
                      {personal.age?.enabled && (
                        <div>
                          <label className={labelClass}>{personal.age.label} *</label>
                          <input
                            name="age"
                            value={form.age ?? ""}
                            onChange={handleChange}
                            placeholder={personal.age.placeholder}
                            className={inputGlowClass}
                            type="number"
                            min={18}
                          />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ ease: [0.2, 0.8, 0.2, 1] }}
                      className="space-y-6"
                    >
                      <div>
                        <label className={labelClass}>{experience.experienceLabel}</label>
                        <select
                          name="experience"
                          value={form.experience ?? ""}
                          onChange={handleChange}
                          className={inputGlowClass}
                        >
                          <option value="">{t("apply.fields.experienceSelect")}</option>
                          {experience.experienceOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>{experience.reasonLabel} *</label>
                        <textarea
                          name="reason"
                          value={form.reason ?? ""}
                          onChange={handleChange}
                          rows={4}
                          placeholder={experience.reasonPlaceholder}
                          className={inputGlowClass}
                        />
                      </div>
                    </motion.div>
                  )}

                  {step > 2 && scenarioQuestions[step - 3] && (
                    <motion.div
                      key={`scenario-${scenarioQuestions[step - 3].id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ ease: [0.2, 0.8, 0.2, 1] }}
                    >
                      <ScenarioStep
                        question={scenarioQuestions[step - 3]}
                        value={form[`scenario_${scenarioQuestions[step - 3].id}`] ?? ""}
                        onChange={handleChange}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4 pt-4">
                  {step > 1 ? (
                    <motion.button
                      type="button"
                      onClick={prev}
                      className="px-6 py-3 border border-primary/30 font-heading font-semibold text-sm rounded-sm transition-all hover:border-primary/60 hover:bg-primary/5 flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ChevronLeft className="w-4 h-4" /> {t("apply.back")}
                    </motion.button>
                  ) : (
                    <span />
                  )}
                  <div className="flex-1" />
                  {step < totalSteps ? (
                    <motion.button
                      type="button"
                      onClick={next}
                      className="px-8 py-3 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-sm transition-all hover:shadow-[var(--gold-glow)] hover:bg-primary-hover flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t("apply.next")} <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={submitting}
                      className="px-8 py-4 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-sm transition-all hover:shadow-[var(--gold-glow)] hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {submitting ? t("apply.submitting") : t("apply.submit")}
                    </motion.button>
                  )}
                </div>
              </motion.form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function ScenarioStep({
  question,
  value,
  onChange,
}: {
  question: FormScenarioQuestion;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{question.question_text} *</label>
      <p className="text-xs text-muted-foreground mb-2">
        Minimum {question.min_chars} karakter
      </p>
      <textarea
        name={`scenario_${question.id}`}
        value={value}
        onChange={onChange}
        rows={4}
        placeholder="Cevabınız..."
        className={inputGlowClass}
        minLength={question.min_chars}
      />
      {value.length > 0 && value.length < question.min_chars && (
        <p className="text-xs text-amber-600 mt-1">
          {question.min_chars - value.length} karakter daha gerekli
        </p>
      )}
    </div>
  );
}
