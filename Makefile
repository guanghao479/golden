.PHONY: help setup dev dev-frontend dev-backend lint test test-frontend test-backend

help:
	@echo "Targets:"
	@echo "  setup    Install frontend dependencies"
	@echo "  dev      Run frontend + backend together with prefixed logs"
	@echo "  dev-frontend Run frontend with prefixed logs"
	@echo "  dev-backend Run backend with prefixed logs"
	@echo "  lint     Run frontend lint"
	@echo "  test     Run frontend + backend tests"
	@echo "  test-frontend Run frontend tests"
	@echo "  test-backend  Run Supabase function tests"

setup:
	cd frontend && npm install

dev: setup # Frontend + backend with prefixed logs
	./scripts/dev.sh

dev-frontend: setup # Frontend-only with prefixed logs
	./scripts/dev-frontend.sh

dev-backend: # Backend-only with prefixed logs
	./scripts/dev-backend.sh

lint:
	cd frontend && npm run lint

test: test-frontend test-backend

test-frontend: setup
	cd frontend && npm run test

test-backend:
	deno test --unsafely-ignore-certificate-errors=deno.land supabase/functions/api/handler.test.ts
