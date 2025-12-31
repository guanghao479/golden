.PHONY: help setup frontend dev lint

help:
	@echo "Targets:"
	@echo "  setup    Install frontend dependencies"
	@echo "  frontend Run Vite dev server"
	@echo "  dev      Run frontend with prefixed logs"
	@echo "  lint     Run frontend lint"

setup:
	cd frontend && npm install

frontend:
	cd frontend && npm run dev

dev: setup
	./scripts/dev.sh

lint:
	cd frontend && npm run lint
