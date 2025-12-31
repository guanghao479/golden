# Golden

Family-friendly events and activity places aggregation platform.

## Stack
- **Frontend:** React + TypeScript + Tailwind + shadcn/ui
- **API:** Supabase Edge Function (`supabase/functions/api/index.ts`)
- **Data:** Supabase (Postgres + REST)
- **Crawling:** Firecrawl structured extraction

## Project Structure
```
frontend/  React web app
supabase/  Supabase migrations + Edge Functions
```

## API (Supabase Edge Function)
The only API runtime lives in `supabase/functions/api/index.ts`. Use the Supabase
CLI to run the Edge Function locally and deploy it. The frontend calls Supabase
directly for CRUD and uses the Edge Function for crawling.

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

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your Supabase project
values. The admin route requires a Supabase Auth user.

## Supabase Setup (Local)
1. Install the Supabase CLI.
2. Start Supabase locally:
   ```bash
   supabase start
   ```
3. Apply migrations:
   ```bash
   supabase db reset
   ```
4. Run the Edge Function (with required env values):
   ```bash
   supabase functions serve api --env-file ./supabase/.env.local
   ```

Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `FIRECRAWL_API_KEY` to the
Supabase Functions environment (or `supabase/.env.local` for local usage).
Use `supabase/.env.local.example` as a template.
5. Create an admin user in Supabase Auth (email/password) for `/admin` access.

## Local Dev Convenience
Run the frontend with prefixed logs:
```bash
make dev
```
Output is prefixed with `[frontend]` to make the process easy to follow.

## Testing
Run the frontend and Supabase function tests locally:
```bash
make test
```

Run them individually:
```bash
make test-frontend
make test-backend
```

## Environment Variables
See `.env.example` for expected values.
