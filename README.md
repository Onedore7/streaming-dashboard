# High-Performance Streaming Dashboard

This is a functional prototype of a SaaS Streaming Dashboard built with a Next.js frontend, Fastify API, TMDB scraping engine, and SQLite database.

## Features
- **Frontend**: Premium UI mimicking Netflix using Next.js and Tailwind CSS (v4.0 capable). Includes horizontal scrolling and glassmorphism.
- **Backend**: High-performance Node.js Fastify API server. Proxies video streams to avoid CORS constraints.
- **Engine**: Scrapes trending movie metadata directly from the TMDB API.
- **Database**: SQLite for lightweight data storage.

## Deployment to Railway.app

1. **Create an account** on [Railway.app](https://railway.app/).
2. **Connect your GitHub repo** containing this project.
3. **Database Setup**: Add a SQLite volume mapping (or provision a Postgres add-on).
4. **Environment Variables**: Add `TMDB_API_KEY` to the project variables.
5. **Backend Deployment**: Ensure your `backend/package.json` has a `"start": "node server.js"` script. Railway automatically detects Node apps.
6. **Frontend Deployment**: Ensure your Next.js project uses `"start": "next start"`. Set the necessary build and start commands in Railway.

## Running Locally
See the individual module folders for scripts.
- Terminal 1: `cd backend && npm install && npm start`
- Terminal 2: `cd scrapers && node tmdb_scraper.js` (to update DB)
- Terminal 3: `cd frontend && npm run dev`
