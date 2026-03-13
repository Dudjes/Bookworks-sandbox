# BookWorks app

Professional accounting application for small businesses.

## Structure

```
packages/
├── desktop/        # Electron + React UI
├── server/         # Express backend
└── db/            # Database schemas & migrations
```

## Setup

```bash
npm install
npm run dev
```

## Development

- `npm run dev` - Start all apps in development mode
- `npm run dev:desktop` - Start Vite and Electron together for desktop app development
- `npm run build` - Build all packages

Desktop dev uses `http://localhost:5173` and compiles Electron main/preload into `desktop/dist-electron` automatically.
If startup fails, free port `5173` and rerun `npm run dev:desktop`.

## TODO

- [ ] Database setup (SQLite/PostgreSQL)
- [ ] Migrations
- [ ] API endpoints
- [ ] UI pages
