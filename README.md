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

## Creating methods

When creating a method with ipc there are a few steps:
    step 1: create the method in the database folder
    step 2: add the method to the ipcHandler in main
    step 3: add the method to electron types file
