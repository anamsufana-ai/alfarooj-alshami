# Al Farooj Al Shami online ordering: owner guide

## What the app does
- **Customers:** choose one of the five branches (Al Rigga, International City, Muweilah, Sahara, Ajman). Each branch
  shows **its own printed menu and prices**. They add dishes, choose delivery or pickup, and pay **cash**, by **card
  machine**, or **online by card (Stripe)**. They get an order page that updates live and a printable VAT invoice.
  With an account they see all their orders at `/account`. Everything works in English and Arabic.
- **Money rules** (`src/pricing.js`): every printed menu says "All prices include 5% VAT". The customer pays exactly
  the printed price; the invoice shows the VAT inside it. Delivery fee per branch is in `src/data.js` (`deliveryFee`,
  now 0 for all branches).
- **Staff / owner:** `/admin`. Live orders board (New → Accepted → Preparing → Ready), all orders with customer
  name, phone, email, address, items and invoice; sales reports per branch (daily, weekly, monthly, yearly) with VAT,
  delivery fees and payment-method split; best sellers; customers list. Every table downloads as Excel (CSV).
- Orders are stored in **Netlify Blobs** (built into the Netlify site, nothing to install).

## Switch it on (Netlify → alfarooj-alshami → Site configuration → Environment variables)
1. `ADMIN_PASSWORD`: the password for `/admin`. Choose a long one. Without it the admin page stays locked.
2. `STRIPE_SECRET_KEY` (optional): turns on "Pay online by card". Without it, cash and card machine still work.
3. `STRIPE_WEBHOOK_SECRET` (optional, recommended with Stripe): webhook `https://<site>/api/stripe/webhook`,
   event `checkout.session.completed`.
4. `SESSION_SECRET` (optional): any long random text.
5. After adding variables: Deploys → Trigger deploy.

## Where the content came from
- Menus: the five menu PDFs from the owner. Rigga was read line by line from the full poster (184 dishes).
  International City, Muweilah, Sahara and Ajman come from the earlier import, spot-checked against the PDFs.
  Dishes printed without a price ("as ordered", whole stuffed lamb, mixed appetizers) are not sold online.
- Logo, food photos and the kufic corner ornament: cut from the restaurant's own printed menus.
- Branch names and phones: printed on the menus and the official branches page.

## Before going live: to confirm
- [to confirm] Delivery fee and delivery area for each branch. Muweilah, Sahara and Ajman menus print "Free delivery";
  Al Rigga and International City print no fee. All are 0 now.
- [to confirm] Opening hours. Only International City prints hours ("orders 8 AM – 3 AM", Feb 2022 menu).
- Addresses and "Directions" map pins: from the official branches page (read 12 Oct 2026). [to confirm] Ajman: the page
  text says "Ajman Towers 1", the map pin says "Tower 5"; the site shows "Ajman Towers".
- [to confirm] Menus are from 2021–2022. Send current menus if prices changed.
- [to complete] Each branch's TRN (VAT number) in `src/data.js` → `trn: ""`. It then prints on every invoice.
- [to complete] WhatsApp numbers per branch (`whatsapp: ""`), if the branches use WhatsApp.
- Arabic texts: check with a native speaker. Terms and privacy: check with a lawyer. VAT on delivery: ask the accountant.

## Local test
`npm install` then `ADMIN_PASSWORD=test npm run dev`. The `/api` runs inside Vite and keeps data in
`.netlify/local-store`.
