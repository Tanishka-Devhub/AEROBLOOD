# AERO-BLOOD — Clinical Emergency Network (Frontend)

Run this project locally in VS Code with Node.js and npm.

## Prerequisites

- **Node.js 20+** — install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) or from https://nodejs.org
- **VS Code** (optional but recommended) with these extensions:
  - ESLint (`dbaeumer.vscode-eslint`)
  - Prettier (`esbenp.prettier-vscode`)
  - Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)

## Run it

```sh
# 1. Extract this ZIP, open the folder in VS Code, then in the terminal:
npm install

# 2. Start the dev server
npm run dev
```

Open http://localhost:8080 in your browser.

## Environment

The app talks to the original FastAPI backend. Point it at your API with a `.env.local` file in the project root:

```sh
VITE_API_BASE_URL=http://localhost:8000
```

If unset, it defaults to `/api`. Without the backend running, pages render but live clinical data will show error/empty states.

## What's inside

- **TanStack Start** (React 19, Vite, file-based routing) — routes in `src/routes/`
- **AEROBLOOD portal screens** — hospital, blood bank, and admin portals in `src/features/aeroblood/`
- **Design system** — blood-red / blush clinical theme, tokens and typography in `src/styles.css`
- **Tests** — `npm test` (routing smoke test)

## Portal URLs

| Portal | URL |
| --- | --- |
| Hospital (Request & Receive) | `/hospital` |
| Blood Bank (Command Center) | `/bloodbank` |
| Network Admin | `/admin` |

## Build for production

```sh
npm run build
```
