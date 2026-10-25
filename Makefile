.PHONY: setup db-up db-down db-reset

setup: .env
	pnpm install
	$(MAKE) db-up
	pnpm db:migrate
	pnpm db:seed
	pnpm admin:create-dev

.env:
	cp .env.example .env

db-up:
	docker compose up -d --wait db storage

db-down:
	docker compose down

db-reset:
	docker compose down -v
	$(MAKE) db-up
	pnpm db:migrate
	pnpm db:seed
	pnpm admin:create-dev
