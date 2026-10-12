"use client";

import { useState } from "react";
import { readCart, writeCart } from "@/lib/cart";
import { copy, type Locale } from "@/i18n/copy";

export type MenuChoice = { id: string; nameEn: string; nameAr: string; absolutePriceMinor: number | null };
export type MenuCard = {
  id: string;
  categoryEn: string;
  categoryAr: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  priceLabel: string | null;
  available: boolean;
  note: string | null;
  choices: MenuChoice[];
};

export function MenuBoard({ locale, branchId, items }: { locale: Locale; branchId: string; items: MenuCard[] }) {
  const text = copy(locale);
  const [message, setMessage] = useState("");
  const [pendingReplace, setPendingReplace] = useState<MenuCard | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");
  const groups = new Map<string, MenuCard[]>();
  for (const item of items) {
    const key = `${item.categoryEn}\n${item.categoryAr}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  function add(item: MenuCard, replace = false) {
    const choiceId = selected[item.id];
    if (item.choices.length > 0 && !choiceId) {
      setMessage(text.choice);
      return;
    }
    const current = readCart();
    if (current && current.branchId !== branchId && !replace) {
      setPendingReplace(item);
      setMessage(text.otherBranch);
      return;
    }
    const line = { itemId: item.id, quantity: 1, choiceIds: choiceId ? [choiceId] : [] };
    const base = !current || current.branchId !== branchId || replace ? { branchId, lines: [] } : current;
    const existing = base.lines.find((candidate) => candidate.itemId === line.itemId && candidate.choiceIds.join() === line.choiceIds.join());
    const lines = existing
      ? base.lines.map((candidate) => candidate === existing ? { ...candidate, quantity: Math.min(20, candidate.quantity + 1) } : candidate)
      : [...base.lines, line];
    writeCart({ branchId, lines });
    setPendingReplace(null);
    setMessage(text.add);
  }

  const entries = [...groups.entries()].filter(([category]) => filter === "all" || category === filter);
  return (
    <div className="stack">
      <div className="chips" role="tablist">
        <button type="button" className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{text.allCategories}</button>
        {[...groups.keys()].map((category) => (
          <button key={category} type="button" className="chip" aria-pressed={filter === category} onClick={() => setFilter(category)}>
            {locale === "ar" ? category.split("\n")[1] : category.split("\n")[0]}
          </button>
        ))}
      </div>
      <p aria-live="polite">{message}</p>
      {pendingReplace ? <button type="button" className="btn" onClick={() => add(pendingReplace, true)}>{text.replace}</button> : null}
      {entries.map(([category, group]) => (
        <section key={category}>
          <h2>{locale === "ar" ? category.split("\n")[1] : category.split("\n")[0]}</h2>
          <div className="menu-grid">
            {group.map((item) => (
              <article key={item.id} className="item">
                <h3>{locale === "ar" ? item.nameAr : item.nameEn}</h3>
                <p className="muted">{locale === "ar" ? item.nameEn : item.nameAr}</p>
                {item.descriptionEn ? <p>{locale === "ar" ? item.descriptionAr : item.descriptionEn}</p> : null}
                {item.choices.length > 0 ? (
                  <label>
                    {text.choice}
                    <select value={selected[item.id] ?? ""} onChange={(event) => setSelected({ ...selected, [item.id]: event.target.value })}>
                      <option value="">{text.choice}</option>
                      {item.choices.map((choice) => (
                        <option key={choice.id} value={choice.id}>{locale === "ar" ? choice.nameAr : choice.nameEn}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <div className="item-foot">
                  {item.priceLabel ? <p className="price">{item.priceLabel}</p> : <span />}
                  {item.available ? <button type="button" className="btn" onClick={() => add(item)}>{text.add}</button> : <p className="muted">{text.unavailable}</p>}
                </div>
                {!item.available && item.note ? <p className="muted">{item.note}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
