import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import About from "./pages/About";
import Account from "./pages/Account";
import { EnglishOnly } from "./i18n";
import Admin from "./pages/Admin";
import Book from "./pages/Book";
import Checkout from "./pages/Checkout";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Invoice from "./pages/Invoice";
import Legal from "./pages/Legal";
import Menu from "./pages/Menu";
import OrderStatus from "./pages/OrderStatus";

export default function App() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:ref" element={<OrderStatus />} />
        <Route path="invoice/:ref" element={<Invoice />} />
        <Route path="account" element={<Account />} />
        <Route
          path="admin"
          element={
            <EnglishOnly>
              <Admin />
            </EnglishOnly>
          }
        />
        <Route path="book" element={<Book />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="terms" element={<Legal kind="terms" />} />
        <Route path="privacy" element={<Legal kind="privacy" />} />
        <Route path="*" element={<Legal kind="missing" />} />
      </Route>
    </Routes>
  );
}
