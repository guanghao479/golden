---
name: require-workflow-steps
enabled: true
event: stop
pattern: .*
action: warn
---

## Development Workflow Checklist

Before completing this task, verify you followed the workflow from AGENTS.md:

- [ ] **1. PLAN**: Did you present a detailed implementation plan and get user approval BEFORE coding?
- [ ] **2. IMPLEMENT**: Did you run tests after making changes? (`npm test` / `deno test`)
- [ ] **3. TEST E2E LOCALLY**: Did you use `/test-e2e` with `make dev` to verify changes work in the browser at localhost?
- [ ] **4. COMMIT**: Did you ask for explicit user confirmation before committing?
- [ ] **5. CI/CD**: Did you check GitHub Actions and wait for workflows to complete?

**If any step was skipped**, acknowledge it to the user and offer to complete it now.

**If all steps were completed**, you may proceed.
