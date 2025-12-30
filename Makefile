.PHONY: help setup backend frontend dev lint

help:
	@echo "Targets:"
	@echo "  setup    Install frontend dependencies"
	@echo "  backend  Run Go API server (uses backend/.env if present)"
	@echo "  frontend Run Vite dev server"
	@echo "  dev      Run backend and frontend concurrently"
	@echo "  lint     Run Go fmt and frontend lint"

setup:
	cd frontend && npm install

backend:
	cd backend && go run ./cmd/server

frontend:
	cd frontend && npm run dev

dev:
	@$(MAKE) -j2 backend frontend

lint:
	gofmt -w backend/cmd/server/main.go backend/internal/api/*.go backend/internal/config/*.go backend/internal/crawler/*.go backend/internal/models/*.go backend/internal/store/*.go
	cd frontend && npm run lint
