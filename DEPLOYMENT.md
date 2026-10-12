# GitHub and Netlify

This repository is prepared for Cursor, then GitHub, then Netlify. Nothing here has been deployed.

## GitHub

1. Create a repository. Do not force-push and do not change branch protection from this project.
2. Use a feature branch and a pull request before merging to the production branch.
3. Keep secrets out of Git. `.env`, `.env.local`, and `.data/` are ignored.

Suggested production branch: `main`. Preview deployments can track other branches.

## Netlify

The current Netlify Next.js path is the automatic OpenNext adapter. This project does not pin `@netlify/plugin-nextjs`.

`netlify.toml` sets:

- Build command: `npm run build`
- Node: 22

Do not set a publish directory. The adapter chooses the Next.js output. Server routes, server actions, and the Stripe webhook run as Netlify functions. There is no long-lived websocket. Order status refreshes every 15 seconds.

Set environment variables in the Netlify UI, with separate values for production and deploy previews. Use Stripe test keys on previews. Do not put secrets in `netlify.toml`.

Required before a hosted site can take orders:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` or `NETLIFY_DB_URL` | Postgres connection. On Netlify, installing `@netlify/database` provisions a database and sets `NETLIFY_DB_URL`. The app also accepts `DATABASE_URL`. Connections use `prepare: false`. |
| `APP_BASE_URL` | Public origin, no trailing slash. |
| `ALLOWED_ORIGINS` | Same origin, or a comma-separated list if you add a separate client. |
| `AUTH_SECRET` | Long random string for any shared environment. Sessions are random tokens stored as SHA-256 hashes. |
| `STRIPE_SECRET_KEY` | `sk_test_...` until the owner turns on live payments. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `https://YOUR_DOMAIN/api/webhooks/stripe`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional. Checkout uses a Stripe-hosted page, so the browser does not need the publishable key. |

Run migrations against the hosted database before the first request:

```bash
DATABASE_URL="..." npm run db:migrate
```

The app also migrates on startup. A first boot loads the branch and menu import if the emirate table is empty. It does not create a user. Open `/en/setup` once.

Stripe webhook URL: `https://YOUR_DOMAIN/api/webhooks/stripe`

Subscribe to `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, and `charge.refunded`. The handler rejects missing or invalid signatures and stores the provider event id so retries do not create a second invoice.

## Not configured

These stay inactive until credentials exist and a person verifies them:

- Google Maps. Without a browser key, tracking shows status and last update time only.
- Email and SMS. Credentials are recognized and still not used to send.
- Object storage.
- Live Stripe charges.
- DNS and a custom domain.

`GET /api/health` reports the state without secret values. `production_configured` is used for Stripe only when the secret key starts with `sk_live_`. A key being present is not evidence that webhooks, maps restrictions, or sender domains were verified.

## Database care

Take backups in the database provider. The migration is `0001_init` and is recorded in `schema_migrations`. Rolling back means restoring a backup. Do not reset the order or invoice counters; the admin screens do not offer a reset.

Driver locations are rounded to about 11 meters and deleted after `LOCATION_RETENTION_DAYS` (default 7, maximum 30) when a new point is saved. A lawyer should review retention before production use.

## Threat assumptions

Server actions check the signed-in user and branch assignment on every change. Prices are recalculated from the database. Guest order links use an unguessable token stored only as a hash. Login and checkout are rate-limited in process memory, which does not cover every serverless instance. Webhook signatures are required. Card numbers are never stored or logged.
