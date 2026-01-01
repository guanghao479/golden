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

* Github actions

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

### Language

* Typescript (locked by Supabase Edge Function)

### Auth

* Supabase Auth

### Server Hosting

* Supabase Edge Function
