# NamViet ERP — Frontend (React + Vite)

Deploy production: **[docs/DEPLOY.md](docs/DEPLOY.md)**  
Build: `npm run build:prod` (requires `VITE_API_BASE_URL` in `.env.production` — see `.env.production.example`).

## Dev

```bash
cp .env.example .env
# Set VITE_API_BASE_URL to your local API (see WareHouse_Management_BE)
npm install
npm run dev
```

Requires a running backend API at `VITE_API_BASE_URL`.
