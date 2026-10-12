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

  return (
    <div className="stack">
      <p aria-live="polite">{message}</p>
      {pendingReplace ? <button type="button" onClick={() => add(pendingReplace, true)}>{text.replace}</button> : null}
      {[...groups.entries()].map(([category, group]) => (
        <section key={category}>
          <h2>{locale === "ar" ? category.split("\n")[1] : category.split("\n")[0]}</h2>
          <div className="menu-grid">
            {group.map((item) => (
              <article key={item.id} className="item">
                <h3>{locale === "ar" ? item.nameAr : item.nameEn}</h3>
                <p>{locale === "ar" ? item.nameEn : item.nameAr}</p>
                {item.descriptionEn ? <p>{locale === "ar" ? item.descriptionAr : item.descriptionEn}</p> : null}
                {item.priceLabel ? <p className="status">{item.priceLabel}</p> : null}
                {item.note ? <p>{item.note}</p> : null}
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
                {item.available ? <button type="button" onClick={() => add(item)}>{text.add}</button> : <p>{text.unavailable}</p>}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
