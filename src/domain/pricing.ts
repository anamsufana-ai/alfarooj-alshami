export type PricedChoice = {
  id: string;
  nameEn: string;
  nameAr: string;
  priceDeltaMinor: number;
  absolutePriceMinor: number | null;
};

export type PricedGroup = {
  id: string;
  nameEn: string;
  nameAr: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  choices: PricedChoice[];
};

export type PricedItem = {
  id: string;
  branchId: string;
  nameEn: string;
  nameAr: string;
  priceMinor: number | null;
  isAvailable: boolean;
  reviewStatus: string;
  groups: PricedGroup[];
};

export type CartLineInput = {
  itemId: string;
  quantity: number;
  choiceIds: string[];
};

export type PricedLine = {
  itemId: string;
  nameEn: string;
  nameAr: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  modifiers: { nameEn: string; nameAr: string; priceDeltaMinor: number }[];
};

export type Quote = {
  lines: PricedLine[];
  subtotalMinor: number;
  errors: string[];
};

export function quoteLines(items: PricedItem[], lines: CartLineInput[]): Quote {
  const errors: string[] = [];
  const priced: PricedLine[] = [];
  if (lines.length === 0) {
    errors.push("cart_empty");
  }
  if (lines.length > 40) {
    errors.push("cart_too_large");
  }
  for (const line of lines) {
    const item = items.find((candidate) => candidate.id === line.itemId);
    if (!item) {
      errors.push(`missing_item:${line.itemId}`);
      continue;
    }
    if (!item.isAvailable || item.reviewStatus === "needs_clarification") {
      errors.push(`unavailable:${item.id}`);
      continue;
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) {
      errors.push(`quantity:${item.id}`);
      continue;
    }
    const selected = new Set(line.choiceIds);
    const knownChoiceIds = new Set(item.groups.flatMap((group) => group.choices.map((choice) => choice.id)));
    if (line.choiceIds.some((id) => !knownChoiceIds.has(id))) {
      errors.push(`unknown_choice:${item.id}`);
      continue;
    }
    let unit = item.priceMinor;
    let absoluteCount = 0;
    const modifiers: PricedLine["modifiers"] = [];
    let groupError = false;
    for (const group of item.groups) {
      const choices = group.choices.filter((choice) => selected.has(choice.id));
      if (choices.length < group.minSelect || choices.length > group.maxSelect) {
        errors.push(`choices:${item.id}`);
        groupError = true;
        break;
      }
      if (group.required && choices.length === 0) {
        errors.push(`required_choice:${item.id}`);
        groupError = true;
        break;
      }
      for (const choice of choices) {
        if (choice.absolutePriceMinor != null) {
          absoluteCount += 1;
          unit = choice.absolutePriceMinor;
        }
        modifiers.push({
          nameEn: choice.nameEn,
          nameAr: choice.nameAr,
          priceDeltaMinor: choice.absolutePriceMinor == null ? choice.priceDeltaMinor : 0,
        });
      }
    }
    if (groupError) continue;
    if (absoluteCount > 1) {
      errors.push(`absolute_choice:${item.id}`);
      continue;
    }
    const delta = modifiers.reduce((sum, modifier) => sum + modifier.priceDeltaMinor, 0);
    if (unit == null) {
      errors.push(`unpriced:${item.id}`);
      continue;
    }
    const unitPriceMinor = unit + delta;
    if (unitPriceMinor < 0) {
      errors.push(`negative:${item.id}`);
      continue;
    }
    priced.push({
      itemId: item.id,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      quantity: line.quantity,
      unitPriceMinor,
      lineTotalMinor: unitPriceMinor * line.quantity,
      modifiers,
    });
  }
  const subtotalMinor = priced.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  return { lines: priced, subtotalMinor, errors };
}

export function orderTotal(input: {
  subtotalMinor: number;
  discountMinor: number;
  deliveryFeeMinor: number;
}): number {
  return input.subtotalMinor - input.discountMinor + input.deliveryFeeMinor;
}
