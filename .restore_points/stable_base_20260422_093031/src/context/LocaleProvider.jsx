import React from "react";

/**
 * Lightweight i18n with inline dictionaries.
 * - t(key, vars) → simple token replacement
 * - setLocale("en" | "es")
 * - add your own keys as you go.
 */
const DICT = {
  en: {
    resume_last: "Resume last lesson",
    see_all: "See all",
    objectives: "Objectives",
    vocabulary: "Vocabulary",
    lesson: "Lesson",
    reflection: "Reflection",
    write_120: "Write at least 120 characters to earn +2 automatically.",
    progress: "Progress",
    mark_complete: "Mark as Complete (+5)",
    completed: "Completed ✓",
    next_lesson: "Next Lesson",
  },
  es: {
    resume_last: "Reanudar la última lección",
    see_all: "Ver todo",
    objectives: "Objetivos",
    vocabulary: "Vocabulario",
    lesson: "Lección",
    reflection: "Reflexión",
    write_120: "Escribe al menos 120 caracteres para ganar +2 automáticamente.",
    progress: "Progreso",
    mark_complete: "Marcar como completado (+5)",
    completed: "Completado ✓",
    next_lesson: "Siguiente lección",
  },
};

const LocaleCtx = React.createContext(null);
export function useLocale() {
  return React.useContext(LocaleCtx) || { locale: "en", setLocale(){}, t:(k)=>k };
}

function interpolate(str, vars) {
  if (!vars) return str;
  return Object.keys(vars).reduce((s, k) => s.replaceAll(`{${k}}`, String(vars[k])), str);
}

export default function LocaleProvider({ children, defaultLocale = "en" }) {
  const [locale, setLocale] = React.useState(() => localStorage.getItem("sh:locale") || defaultLocale);
  React.useEffect(() => { try { localStorage.setItem("sh:locale", locale); } catch {} }, [locale]);

  const t = React.useCallback((key, vars) => {
    const table = DICT[locale] || DICT.en;
    return interpolate(table[key] || DICT.en[key] || key, vars);
  }, [locale]);

  const value = React.useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

/** Small UI toggle you can place anywhere (header/right, etc.) */
export function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="sh-actionsRow" role="group" aria-label="Language">
      <button
        className={`sh-btn sh-btn--secondary ${locale==="en"?"is-active":""}`}
        onClick={() => setLocale("en")}
        aria-pressed={locale==="en"}
        title="English"
      >EN</button>
      <button
        className={`sh-btn sh-btn--secondary ${locale==="es"?"is-active":""}`}
        onClick={() => setLocale("es")}
        aria-pressed={locale==="es"}
        title="Español"
      >ES</button>
    </div>
  );
}
