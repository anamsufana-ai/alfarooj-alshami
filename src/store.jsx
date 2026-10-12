import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { locationById } from "./data";
import { useLang } from "./i18n";
import { totals } from "./pricing";

const KEY = "alfarooj-v1";
const CafeContext = createContext(null);

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function CafeProvider({ children }) {
  const saved = load();
  const [locationId, setLocationId] = useState(saved?.locationId || "rigga");
  const [carts, setCarts] = useState(saved?.carts || {});
  const [auth, setAuth] = useState(saved?.auth || null); // { token, user }
  const [adminToken, setAdminToken] = useState(saved?.adminToken || "");
  const [recent, setRecent] = useState(saved?.recent || []); // [{ ref, k, branchId, createdAt }]
  const [toast, setToast] = useState("");
  const { t, itemName } = useLang();

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ locationId, carts, auth, adminToken, recent }));
    } catch {
      /* private mode: keep working without saving */
    }
  }, [locationId, carts, auth, adminToken, recent]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => {
    const cart = carts[locationId] || [];
    const writeCart = (next) => setCarts((current) => ({ ...current, [locationId]: next }));
    return {
      locationId,
      location: locationById(locationId),
      setLocationId,
      cart,
      count: cart.reduce((sum, line) => sum + line.qty, 0),
      sums: (orderType) => totals(cart, orderType, locationById(locationId).deliveryFee),
      lineQty: (id) => cart.find((line) => line.id === id)?.qty || 0,
      addItem(entry, qty = 1) {
        const existing = cart.find((line) => line.id === entry.id);
        writeCart(
          existing
            ? cart.map((line) => (line.id === entry.id ? { ...line, qty: Math.min(50, line.qty + qty) } : line))
            : [...cart, { id: entry.id, name: entry.name, price: entry.price, qty }],
        );
        setToast(t("Added {name}", { name: entry.kicker ? t(entry.name) : itemName(entry) }));
      },
      setQty(id, qty) {
        writeCart(qty <= 0 ? cart.filter((line) => line.id !== id) : cart.map((line) => (line.id === id ? { ...line, qty } : line)));
      },
      clearCart: () => writeCart([]),
      auth,
      user: auth?.user || null,
      token: auth?.token || "",
      signIn: (next) => setAuth(next),
      setUser: (user) => setAuth((current) => (current ? { ...current, user } : current)),
      signOut: () => setAuth(null),
      adminToken,
      setAdminToken,
      recent,
      remember: (entry) => setRecent((current) => [entry, ...current.filter((item) => item.ref !== entry.ref)].slice(0, 20)),
      toast,
      notify: setToast,
    };
  }, [locationId, carts, auth, adminToken, recent, toast, t, itemName]);

  return <CafeContext.Provider value={value}>{children}</CafeContext.Provider>;
}

export function useCafe() {
  const value = useContext(CafeContext);
  if (!value) throw new Error("useCafe must be used inside CafeProvider");
  return value;
}
