.PHONY: help setup frontend dev lint test test-frontend test-backend

help:
	@echo "Targets:"
	@echo "  setup    Install frontend dependencies"
	@echo "  frontend Run Vite dev server"
	@echo "  dev      Run frontend with prefixed logs"
	@echo "  lint     Run frontend lint"
	@echo "  test     Run frontend + backend tests"
	@echo "  test-frontend Run frontend tests"
	@echo "  test-backend  Run Supabase function tests"

setup:
	cd frontend && npm install

frontend:
	cd frontend && npm run dev

dev: setup
	./scripts/dev.sh

lint:
	cd frontend && npm run lint

test: test-frontend test-backend

test-frontend: setup
	cd frontend && npm run test

test-backend:
	deno test --unsafely-ignore-certificate-errors=deno.land supabase/functions/api/handler.test.ts
