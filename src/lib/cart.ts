export type StoredLine = { itemId: string; quantity: number; choiceIds: string[] };
export type StoredCart = { branchId: string; lines: StoredLine[] };

const KEY = "fas-cart";

export function readCart(): StoredCart | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredCart;
    if (!parsed?.branchId || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCart(cart: StoredCart | null) {
  if (cart && cart.lines.length > 0) window.localStorage.setItem(KEY, JSON.stringify(cart));
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("fas-cart"));
}
