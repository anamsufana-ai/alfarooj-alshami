import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { entryById } from "./data";
import { ar } from "./i18n-ar";

// English is the main language. Arabic is a full alternative the customer can
// switch to. Strings are looked up by their English text, so anything not yet
// translated simply shows in English.
const KEY = "alfarooj-lang";
const LangContext = createContext(null);

function initialLang() {
  try {
    return localStorage.getItem(KEY) === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* private mode */
    }
  }, [lang]);

  const value = useMemo(() => buildValue(lang, setLang), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// The staff dashboard always stays in English, left to right.
export function EnglishOnly({ children }) {
  const outer = useContext(LangContext);
  const value = useMemo(() => buildValue("en", outer.setLang), [outer.setLang]);
  return (
    <LangContext.Provider value={value}>
      <div dir="ltr" lang="en" className="english-only">
        {children}
      </div>
    </LangContext.Provider>
  );
}

function buildValue(lang, setLang) {
  const isAr = lang === "ar";
  const t = (text, vars) => {
    let out = (isAr && ar[text]) || text;
    if (vars) for (const [name, val] of Object.entries(vars)) out = out.split(`{${name}}`).join(val);
    return out;
  };
  return {
    lang,
    isAr,
    setLang,
    toggle: () => setLang(isAr ? "en" : "ar"),
    t,
    // Menu item name: the Arabic name from the card when there is one.
    itemName: (entry) => (isAr && entry?.ar) || entry?.name || "",
    arrow: isAr ? "←" : "→",
    // Basket and order lines keep the English name; show it in the current language.
    lineName: (line) => {
      const entry = entryById(line.id);
      if (!entry) return (isAr && line.ar) || line.name;
      return entry.kicker ? t(entry.name) : (isAr && entry.ar) || entry.name;
    },
  };
}

export function useLang() {
  const value = useContext(LangContext);
  if (!value) throw new Error("useLang must be used inside LangProvider");
  return value;
}
