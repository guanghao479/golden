# Golden

Family-friendly events and activity places aggregation platform.

## Stack
- **Frontend:** React + TypeScript + Tailwind + shadcn/ui
- **Backend:** Go HTTP API
- **Data:** Supabase (Postgres + REST)
- **Crawling:** Firecrawl structured extraction

## Project Structure
```
backend/   Go API service
frontend/  React web app
```

## Backend
1. Copy `.env.example` to `backend/.env` and populate credentials.
2. Run:
   ```bash
   make backend
   ```

### API Endpoints
- `POST /api/crawl` `{ "url": "https://...", "type": "events" | "places" }`
- `GET /api/events`
- `GET /api/places`
- `GET /api/admin/events`
- `GET /api/admin/places`
- `PATCH /api/events` `{ "id": "...", "title": "...", "start_time": "...", "tags": ["..."] }`
- `PATCH /api/places` `{ "id": "...", "name": "...", "family_friendly": true }`
- `PATCH /api/events/approve` `{ "id": "..." }`
- `PATCH /api/places/approve` `{ "id": "..." }`

## Frontend
```bash
make setup
make frontend
```

Set `VITE_API_BASE` if the API runs on a different host/port than `http://localhost:8080`.

## Local Dev Convenience
Run both services together:
```bash
make dev
```
Output is prefixed with `[backend]` and `[frontend]` to make both processes easy to follow.

## Environment Variables
See `.env.example` for expected values.
