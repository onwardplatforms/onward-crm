# Onward CRM

A modern, lightweight CRM built with Next.js, PostgreSQL, and Prisma.

## Features

- 🏢 **Company Management** - Track companies and their details
- 👥 **Contact Management** - Manage contacts with company associations
- 💼 **Deal Pipeline** - Visual pipeline for tracking deals through stages
- 📊 **Activity Tracking** - Log calls, meetings, emails, and notes
- 👥 **Multi-workspace Support** - Separate workspaces for different teams
- 🔐 **Authentication** - Secure authentication with Better Auth
- 🎨 **Modern UI** - Clean, responsive interface with dark mode support

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (local) / Vercel Postgres (production)
- **Authentication**: Better Auth
- **UI Components**: shadcn/ui

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Quick Start

### Using Make (Recommended)

```bash
# Clone the repository
git clone https://github.com/onwardplatforms/onward-crm.git
cd onward-crm

# Run complete setup (install deps, create DB, run migrations)
make setup

# Start development server
make dev
```

### Manual Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL
brew services start postgresql@14

# Create database
createdb onward_crm

# Copy environment variables
cp .env.example .env

# Update DATABASE_URL in .env with your PostgreSQL connection string
# Default: postgresql://[username]@localhost:5432/onward_crm?schema=public

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit http://localhost:3333 to see the app.

## Available Commands

### Development
- `make dev` - Start development server
- `make build` - Build for production
- `make start` - Start production server

### Database
- `make db-start` - Start PostgreSQL service
- `make db-stop` - Stop PostgreSQL service
- `make db-create` - Create database
- `make db-migrate` - Run migrations
- `make db-studio` - Open Prisma Studio
- `make db-reset` - Reset database (drop, create, migrate)

### NPM Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database URL (PostgreSQL)
DATABASE_URL="postgresql://username@localhost:5432/onward_crm?schema=public"

# JWT Secret for authentication
JWT_SECRET="your-secret-key-change-in-production"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3333"
```

## Deployment

### Vercel + Vercel Postgres (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add Vercel Postgres storage
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js and PostgreSQL:
- Railway
- Fly.io
- Render
- DigitalOcean App Platform

## Contributing

Pull requests are welcome! Please feel free to submit a Pull Request.

## License

MIT