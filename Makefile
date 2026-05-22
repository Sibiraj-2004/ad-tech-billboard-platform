# ==============================================
# Ad-Tech Platform — Developer Shortcuts
# ==============================================

.PHONY: help up down build logs backend-shell db-shell migrate seed

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Docker ───────────────────────────────────────────────────
up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

build: ## Rebuild all containers
	docker-compose build --no-cache

logs: ## Tail logs from all services
	docker-compose logs -f

logs-backend: ## Tail backend logs
	docker-compose logs -f backend

logs-frontend: ## Tail frontend logs
	docker-compose logs -f frontend

# ── Shell Access ─────────────────────────────────────────────
backend-shell: ## Open shell in backend container
	docker-compose exec backend bash

db-shell: ## Open psql in database container
	docker-compose exec db psql -U adtech_user -d adtech_db

# ── Database ─────────────────────────────────────────────────
migrate: ## Run database migrations
	docker-compose exec backend alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create msg="add xyz")
	docker-compose exec backend alembic revision --autogenerate -m "$(msg)"

seed: ## Seed database with initial data
	docker-compose exec backend python -c "import asyncio; from app.db.session import async_session_factory; from app.db.init_db import init_db; asyncio.run((lambda: init_db(async_session_factory()))())"

# ── Testing ──────────────────────────────────────────────────
test: ## Run backend tests
	docker-compose exec backend pytest -v

lint: ## Run linter on backend
	docker-compose exec backend ruff check app/

# ── Cleanup ──────────────────────────────────────────────────
clean: ## Remove containers, volumes, and images
	docker-compose down -v --rmi local
