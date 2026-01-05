---
name: test-e2e
description: Test an implementation by running the local dev environment and performing E2E testing through the browser. Use when the user asks to test a feature, debug an issue, or verify a fix works correctly. (project)
allowed-tools: Bash, Read, Glob, Grep, mcp__chrome-devtools__*, mcp__supabase_local__*, TodoWrite, WebFetch
---

# Test E2E Skill

This skill guides testing of implementations in the Golden project by running the **LOCAL** dev environment and performing browser-based E2E testing.

## CRITICAL: Local Testing Only

**This skill is for LOCAL testing only. NEVER test against production.**

- Use `mcp__supabase_local__*` tools - NOT `mcp__supabase_production__*`
- Test at `http://localhost:5173` - NOT the production URL
- Mutations to the database are safe because it's local
- If you need to check production state, use `mcp__supabase_production__execute_sql` with SELECT queries only

## Prerequisites

Before testing, ensure you have:
1. The dev environment running (`make dev` or run frontend/backend separately)
2. Chrome browser open with DevTools MCP connected
3. Test fixtures configured in `.test-fixtures/` (credentials, test URLs, etc.)

## Test Fixtures

Test data should be stored in `.test-fixtures/` (gitignored). Load fixtures before testing:

```
.test-fixtures/
├── credentials.json    # Test user credentials
├── test-urls.json      # URLs to test against
└── test-data.json      # Other test data (expected values, etc.)
```

Example `credentials.json`:
```json
{
  "admin": {
    "email": "test-admin@example.com",
    "password": "test-password"
  }
}
```

## Testing Workflow

### 1. Start Development Environment

```bash
make dev
```

This starts:
- Frontend: http://localhost:5173
- Backend (Supabase): http://127.0.0.1:54321

### 2. Load Test Fixtures

Read test data from `.test-fixtures/`:
- `Read .test-fixtures/credentials.json` for login credentials
- `Read .test-fixtures/test-urls.json` for URLs to test

### 3. Browser Testing with Chrome DevTools MCP

Use Chrome DevTools MCP to interact with the application:

1. **Navigate to the app**: `mcp__chrome-devtools__navigate_page` to frontend URL
2. **Take snapshots**: `mcp__chrome-devtools__take_snapshot` to see page state
3. **Fill forms**: `mcp__chrome-devtools__fill` or `mcp__chrome-devtools__fill_form`
4. **Click elements**: `mcp__chrome-devtools__click` with element uid from snapshot
5. **Check console**: `mcp__chrome-devtools__list_console_messages` for errors
6. **Check network**: `mcp__chrome-devtools__list_network_requests` for API calls

### 4. Debug Issues

When encountering errors:

1. **Check browser console** for JavaScript errors
2. **Check network requests** for failed API calls
3. **Check backend logs** with `docker logs` or Supabase dashboard
4. **Use `mcp__supabase_local__execute_sql`** to query local database state directly

**Database debugging examples:**
```sql
-- Check local table contents
SELECT * FROM events LIMIT 5;

-- Verify schema
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events';

-- Check for RLS issues
SELECT * FROM crawl_sources WHERE created_by = auth.uid();
```

### 5. Common Test Scenarios

#### Login Flow
1. Navigate to login page
2. Fill email and password from fixtures
3. Click login button
4. Verify redirect to dashboard

#### Admin Crawl Job
1. Login as admin user
2. Navigate to admin interface
3. Enter URL to crawl
4. Submit and verify job creation
5. Check network requests for API response
6. Verify job appears in job list

## Debugging Checklist

- [ ] Dev environment running? (`make dev`)
- [ ] Browser connected to Chrome DevTools MCP?
- [ ] Test fixtures exist in `.test-fixtures/`?
- [ ] Correct credentials being used?
- [ ] Network requests succeeding? (check status codes)
- [ ] Console errors present?
- [ ] Backend logs showing errors?

## Reporting Results

After testing, report:
1. **Pass/Fail** status for each test scenario
2. **Errors encountered** with stack traces
3. **Network request details** for failed API calls
4. **Screenshots** if visual issues found
5. **Suggested fixes** based on debugging
