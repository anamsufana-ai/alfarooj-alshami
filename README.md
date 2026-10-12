# AlFarooj AlShami ordering

Bilingual English and Arabic ordering for the five Farooj Al Shami branches in Dubai, Sharjah, and Ajman. The brand spelling on the official site is AlFarooj AlShami / الفروج الشامي.

## Local development

```bash
npm install
npm run dev
```

With `DATABASE_URL` empty, and when not running on Netlify, the app uses an embedded Postgres database in `.data/`. The first request creates the tables and loads the branch records and menu import.

Open `/en/setup` while no users exist and create the first business admin. That screen closes afterward. Password reset email is not sent.

```bash
npm test
npm run typecheck
npm run build
```

## What is real, and what is not

Branch names and phone numbers come from https://www.alfaroojalshamirestaurant.ae/branches/ as read on 12 Oct 2026. Conflicting English address lines are shown as conflicts. Missing street addresses, coordinates, and opening hours are left empty.

Menu items were read from the supplied picture PDFs and stored as **pending review**. They are not a verified current menu. The Rigga poster only has its juice, drinks, and sweets panel entered; the other panels on that one-page file are not for sale here yet. Ajman, International City, Sahara, and Muweilah menus differ and are stored separately.

Delivery follows the printed menu only where a rule was actually printed:

- Ajman, Muweilah, and Sahara: the menu says delivery is free. Checkout allows delivery with a zero fee and says the area is unconfirmed.
- International City: the menu says home delivery and does not print a fee, so delivery checkout stays closed.
- Pickup is closed for every branch until an admin enables it.
- Rigga delivery is not configured.

Card payment stays unpaid unless Stripe test or live keys are set and a verified webhook, or a server-side Stripe session lookup, confirms payment. There is no button that pretends a payment succeeded.

## Order and invoice numbers

One business-wide counter assigns the order number when the order row is created, including orders that stay unpaid or are cancelled. A second counter assigns the invoice number only when payment is confirmed, once per order. Numbers are unique and increasing. They are not promised to be gapless. Cancelled and unpaid orders keep their order numbers. Internal ids are separate.

Included VAT is calculated only when the PDF says prices include 5% VAT. It is not added on top of the total, and it is not a tax invoice. No tax registration number is stored.

## Reports

Gross sales are the totals of paid orders. Refunded orders are subtracted once. Unpaid, pending, and failed orders are counted as placed and are not sales. Periods use Asia/Dubai, which is UTC+4 all year. Weeks start on Monday.

## Deployment

See `DEPLOYMENT.md`. Do not commit `.env` or `.env.local`.
