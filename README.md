# NamViet ERP — Frontend (React + Vite)

Deploy production: **[docs/DEPLOY.md](docs/DEPLOY.md)**  
Build: `npm run build:prod` (requires `VITE_API_BASE_URL` in `.env.production` — see `.env.production.example`).

## Dev

```bash
cp .env.example .env
npm install
npm run dev
```

Mock mode (local only): set `VITE_USE_MOCK=true` in `.env` — **never** on production.
