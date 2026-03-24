# Driver CRM - Netlify Ready

This project was split from a single-file prototype into a modular React architecture using Vite.

## Stack

- React 18
- Zustand (state management)
- Vite (build/dev server)
- Netlify (deployment)

## Project structure

- src/App.jsx - app shell and view routing
- src/store/useDriversStore.js - Zustand state and actions
- src/constants/data.js - constants and seed data
- src/utils/date.js - date helpers
- src/utils/file.js - file-size formatter
- src/components - reusable UI and workflow components
- src/views - page-level views (Dashboard, Templates)
- src/styles/global.css - global styles
- netlify.toml - Netlify build and SPA redirect config

## Run locally

1. Install Node.js 20+ (includes npm).
2. Install dependencies:
   npm install
3. Start development server:
   npm run dev
4. Build for production:
   npm run build

## Deploy to Netlify

1. Push this folder to GitHub.
2. In Netlify, create new site from Git.
3. Build command: npm run build
4. Publish directory: dist

`netlify.toml` already contains these settings and a redirect rule for SPA routing.
