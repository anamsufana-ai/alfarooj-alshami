# Al Farooj Al Shami: online ordering

Bilingual (English / Arabic) ordering site and admin dashboard for the five Al Farooj Al Shami branches
(Al Rigga and International City in Dubai, Muweilah and Sahara in Sharjah, Ajman).

- Front end: React + Vite (`src/`). Menus, branches and photos: `src/data.js`. Money rules: `src/pricing.js`.
- Back end: one Netlify Function (`netlify/functions/api.mjs`) with Netlify Blobs storage.
- Admin: `/admin` (password in the `ADMIN_PASSWORD` environment variable).

```bash
npm install
ADMIN_PASSWORD=test npm run dev
npm run build
```

Production deploys from `main` on Netlify (site `alfarooj-alshami`). See `OWNER-GUIDE.md`.
