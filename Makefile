.PHONY: help install dev build start db-start db-stop db-create db-migrate db-studio db-reset setup clean lint typecheck check check-errors fix

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
	@echo "Code quality:"
	@echo "  make lint        - Run ESLint (shows all issues)"
	@echo "  make typecheck   - Run TypeScript type checking"
	@echo "  make check       - Run both lint and typecheck"
	@echo "  make check-errors - Check for errors only (what Vercel checks)"
	@echo "  make fix         - Auto-fix ESLint issues"
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

# Lint code
lint:
	@echo "Running ESLint..."
	@npx eslint . --ext .ts,.tsx,.js,.jsx 2>&1 | grep -E "^[0-9]+:[0-9]+|error|warning" | wc -l | xargs -I {} echo "Total lint issues: {}"
	@npx eslint . --ext .ts,.tsx,.js,.jsx

# Type check
typecheck:
	@echo "Running TypeScript type checking..."
	@npx tsc --noEmit

# Run both lint and typecheck
check: lint typecheck

# Check for errors only (what would fail in Vercel)
check-errors:
	@echo "Checking for ESLint errors (no warnings)..."
	@npx eslint . --ext .ts,.tsx,.js,.jsx --quiet || (echo "❌ ESLint errors found" && exit 1)
	@echo "✅ No ESLint errors found"
	@echo "Running TypeScript check..."
	@npx tsc --noEmit || (echo "❌ TypeScript errors found" && exit 1)
	@echo "✅ No TypeScript errors found"

# Vercel-like build (clean build from scratch)
vercel-test:
	@echo "Simulating Vercel build environment..."
	@echo "Cleaning build artifacts..."
	@rm -rf .next
	@echo "Installing dependencies from lock file..."
	@npm ci --silent
	@echo "Running production build with Turbopack..."
	@npm run build || (echo "❌ Build failed" && exit 1)
	@echo "✅ Build succeeded!"

# Fix all auto-fixable issues
fix:
	@echo "Auto-fixing ESLint issues..."
	@npx eslint . --ext .ts,.tsx,.js,.jsx --fix
	@echo "Done! Run 'make check-errors' to see remaining issues"

# Clean everything
clean:
	rm -rf node_modules
	rm -rf .next
	rm -rf lib/generated