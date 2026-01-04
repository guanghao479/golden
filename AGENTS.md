# Engineering Principles

## 1. Simplicity First

* **KISS**: Write the simplest code that works. Avoid cleverness.
* **YAGNI**: Don't build it until it's needed. No speculative features.
* **Minimal dependencies**: Fewer libraries = fewer problems. Justify every addition.
* **Explicit over magic**: Code should be understandable by reading it, not by knowing hidden conventions.

## 2. Single Responsibility

* One file/module/component = one purpose. If hard to name, split it.
* Split when: file exceeds ~200 lines, multiple unrelated functions, or frequent merge conflicts.
* Split by: feature, layer, or responsibility — not arbitrary size.
* React: extract logic to hooks, break large components into focused pieces.

## 3. Boundaries & Contracts

* **Validate at edges**: Sanitize user input and external API responses. Trust internal code.
* **Depend on abstractions**: Use interfaces/types, not concrete implementations.
* **Small interfaces**: Components should only depend on what they actually use.
* **Composition over inheritance**: Build from small, composable pieces.

## 4. Code Quality

* **Immutability by default**: Don't mutate; return new values.
* **Fail fast**: Surface errors immediately. No silent failures.
* **No secrets in code**: Use environment variables. Never commit credentials.
* **Self-documenting**: Good names > comments. If you need many comments, refactor.

## 5. Testing

### Principles
* **Test at boundaries**: Focus on inputs/outputs, not implementation details.
* **Test pyramid**: Many unit tests, fewer integration tests, minimal E2E.
* **Test behavior, not code**: Tests should survive refactoring.
* **No flaky tests**: Delete or fix them immediately.

### Frameworks
* **Frontend**: Vitest - run with `npm test` from `frontend/`
* **Backend Edge Functions**: Deno test - run with `deno test` from `supabase/functions/`

### Conventions
* Frontend tests: `src/**/*.test.ts` (colocated with source)
* Backend tests: `supabase/functions/<function-name>/*.test.ts`

### Running Tests
* Before committing: `cd frontend && npm test`
* Backend: `cd supabase/functions/api && deno test --allow-env handler.test.ts`

### E2E Testing with `/test-implementation`
Use the `test-implementation` skill for browser-based E2E testing:
1. Store test credentials and URLs in `.test-fixtures/` (gitignored)
2. Copy from `.test-fixtures.example/` and fill in your values
3. Run `make dev` to start local environment
4. Use Chrome DevTools MCP to interact with the app

## 6. Version Control & Review

* **Small PRs**: Easier to review, faster to merge, fewer bugs. One concern per PR.
* **Conventional commits**: Use prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
* **All code reviewed**: No direct pushes to main.
* **Trunk-based**: Short-lived branches, merge frequently.

## 7. Automation & DevOps

* **CI/CD required**: All tests run on every PR. Automate deployments.
* **Infrastructure as code**: Reproducible environments, version controlled.
* **Automate repetition**: If you do it twice, script it.
* **Observability**: Logging, metrics, and error tracking from day one.

## 8. Security

* **Least privilege**: Minimal permissions for everything.
* **Never trust input**: Validate, sanitize, escape at system boundaries.
* **Secrets in environment**: Never in code, config files, or logs.
* **Shift left**: Security checks in CI, not just before deploy.

# Technical stack choices

## Operation

### Code hosting

* Github

### CI/CD

* Github Actions

#### Frontend Deployment (GitHub Pages)
Triggered on push to `main` when files in `frontend/` change.

**Required GitHub Variables (Settings > Secrets and variables > Actions > Variables):**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Setup:**
1. Go to repository Settings > Pages
2. Set Source to "GitHub Actions"

#### Supabase Backend Deployment
Triggered on push to `main` when files in `supabase/functions/` or `supabase/migrations/` change.

**Required GitHub Secrets (Settings > Secrets and variables > Actions > Secrets):**
- `SUPABASE_ACCESS_TOKEN` - Personal access token from https://supabase.com/dashboard/account/tokens
- `SUPABASE_PROJECT_REF` - Project reference ID (found in project settings URL)

## Frontend

### Language

* Typescript

### Bundler / UI framework

* Vite + React + TanStack Router

### Styling / UI components

* Tailwind + shadcn/ui
* Always use `npx shadcn@latest add <component>` to add new UI components
* Never manually create UI components that shadcn/ui provides

### State/data fetching & Forms

* Tanstack Query
* Tanstack Form

### Hosting

* Github Pages

## Backend

### Local Development Setup

Before developing the backend locally, install the following CLIs:

#### Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# npm (cross-platform)
npm install -g supabase

# Or use npx (no installation required)
npx supabase --help
```

#### Deno CLI
Required for running and testing Edge Functions locally.
```bash
# macOS
brew install deno

# Using curl (macOS/Linux)
curl -fsSL https://deno.land/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex
```

After installation, verify both are working:
```bash
supabase --version   # or: npx supabase --version
deno --version
```

### Language

* Typescript (locked by Supabase Edge Function)

### Auth

* Supabase Auth

### Server Hosting

* Supabase Edge Function

### Supabase CLI

Use the Supabase CLI to interact with the database and edge functions:

#### Database Operations
```bash
# Execute SQL queries
npx supabase db execute --sql "SELECT * FROM events LIMIT 5"

# List tables
npx supabase db execute --sql "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"

# Run migrations
npx supabase db push

# Generate TypeScript types from schema
npx supabase gen types typescript --local > frontend/src/types/database.ts
```

#### Migrations

**IMPORTANT:** Always create migration files first, then apply them. Never apply SQL directly without a migration file.

**Workflow:**
1. Create a new migration file:
   ```bash
   npx supabase migration new <migration_name>
   ```
   This creates a timestamped file in `supabase/migrations/`

2. Edit the migration file with your SQL changes

3. Apply the migration locally:
   ```bash
   npx supabase db push
   ```

4. For remote deployment, migrations are applied via CI/CD when pushed to main

**Example:**
```bash
# Create migration
npx supabase migration new add_user_preferences

# Edit supabase/migrations/20260103120000_add_user_preferences.sql
# Add your SQL: CREATE TABLE user_preferences (...);

# Apply locally
npx supabase db push
```

**Commands:**
```bash
# List migrations
npx supabase migration list

# Create a new migration
npx supabase migration new <migration_name>

# Apply pending migrations
npx supabase db push

# Reset local database (drops and recreates)
npx supabase db reset
```

**Do NOT:**
- Use `mcp__supabase__apply_migration` without first creating the migration file
- Apply SQL directly to the database without a corresponding migration file
- Skip creating migration files for schema changes

#### Data Model Changes

When updating data models (e.g., adding fields to `events` or `places`), update **all** locations:

1. **Database**: Create a migration to add/modify columns
2. **Frontend types**: Update `frontend/src/types.ts` (e.g., `Event`, `Place`, `EventDraft`, `PlaceDraft`)
3. **Frontend components**: Update forms/views that use these types (e.g., `PlaceDetailView.tsx`)
4. **Frontend data operations**: Update save/update functions in `App.tsx`
5. **Backend API**: Update `supabase/functions/api/handler.ts`:
   - Schema definitions (tells Firecrawl what to extract)
   - Mapper functions (`mapEvents`, `mapPlaces`) that insert into database
6. **ListingCard usage**: If adding `image_url`, update where cards are rendered

#### Edge Functions
```bash
# Serve functions locally
npx supabase functions serve

# Deploy a function
npx supabase functions deploy <function_name>

# View function logs
npx supabase functions logs <function_name>
```

#### Logs & Debugging
```bash
# View database logs
npx supabase db logs

# View auth logs
npx supabase auth logs

# Check project status
npx supabase status
```

#### Configuration
* Local config: `supabase/config.toml`
* Requires `SUPABASE_ACCESS_TOKEN` env var for remote operations
* Use `npx supabase link` to connect to a remote project
