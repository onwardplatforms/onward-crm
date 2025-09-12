.PHONY: help install dev build start db-start db-stop db-create db-migrate db-studio db-reset setup clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make setup       - Complete initial setup (install deps, setup DB, run migrations)"
	@echo "  make dev         - Start development server"
	@echo "  make build       - Build for production"
	@echo "  make start       - Start production server"
	@echo ""
	@echo "Database commands:"
	@echo "  make db-start    - Start PostgreSQL service"
	@echo "  make db-stop     - Stop PostgreSQL service"
	@echo "  make db-create   - Create database"
	@echo "  make db-migrate  - Run database migrations"
	@echo "  make db-studio   - Open Prisma Studio"
	@echo "  make db-reset    - Reset database (drop, create, migrate)"
	@echo ""
	@echo "  make clean       - Clean dependencies and build files"

# Install dependencies
install:
	npm install

# Development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Start production server
start:
	npm run start

# Database: Start PostgreSQL
db-start:
	@echo "Starting PostgreSQL..."
	brew services start postgresql@14

# Database: Stop PostgreSQL
db-stop:
	@echo "Stopping PostgreSQL..."
	brew services stop postgresql@14

# Database: Create database
db-create:
	@echo "Creating database onward_crm..."
	createdb onward_crm || echo "Database may already exist"

# Database: Run migrations
db-migrate:
	@echo "Running migrations..."
	npx prisma migrate dev

# Database: Open Prisma Studio
db-studio:
	npx prisma studio

# Database: Reset (drop, create, migrate)
db-reset:
	@echo "Resetting database..."
	dropdb onward_crm --if-exists
	createdb onward_crm
	npx prisma migrate dev

# Complete setup from scratch
setup: install db-start db-create db-migrate
	@echo "✅ Setup complete! Run 'make dev' to start the development server."

# Clean everything
clean:
	rm -rf node_modules
	rm -rf .next
	rm -rf lib/generated