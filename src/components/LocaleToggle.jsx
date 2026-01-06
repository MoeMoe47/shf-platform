import React from "react";
import { useLocale } from "@/context/LocaleProvider.jsx";

export default function LocaleToggle(){
  const { lang, setLang } = useLocale?.() || { lang: "en", setLang: () => {} };
  return (
    <div className="sh-row" role="group" aria-label="Language">
      <button className="sh-btn sh-btn--tiny"
        aria-pressed={lang==="en"} onClick={() => setLang("en")}>EN</button>
      <button className="sh-btn sh-btn--tiny"
        aria-pressed={lang==="es"} onClick={() => setLang("es")}>ES</button>
    </div>
  );
}
