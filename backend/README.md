# KeepWarm CRM - REST API Backend

A REST API backend for KeepWarm CRM built with TypeScript, Hono, Drizzle ORM, and SQLite.

## Tech Stack

- **TypeScript** - Type safety and better developer experience
- **Hono** - Modern, fast, lightweight web framework
- **Drizzle ORM** - Type-safe SQL builder with SQLite support
- **better-sqlite3** - Synchronous, fast SQLite driver for Node.js
- **Vitest** - Fast testing framework

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Start with seeded database
SEED_DB=true npm run dev
```

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run
```

### Database

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations (CLI; migrations also run automatically on dev start)
npm run db:migrate

# Seed the database manually
npm run db:seed
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login and get session token |
| POST | `/auth/logout` | Logout (invalidate session) |
| GET | `/api/me` | Get current user info |

### Sellers (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sellers` | List all sellers |
| GET | `/api/sellers/:id` | Get seller details |
| POST | `/api/sellers` | Create new seller |
| PUT | `/api/sellers/:id` | Update seller |
| DELETE | `/api/sellers/:id` | Delete seller |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers (sellers see own, admins see all) |
| GET | `/api/customers/:id` | Get customer details |
| POST | `/api/customers` | Create new customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |

### Interactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interactions` | List interactions (optional: `?customerId=X`) |
| GET | `/api/interactions/:id` | Get interaction details |
| POST | `/api/interactions` | Create new interaction |
| PUT | `/api/interactions/:id` | Update interaction |
| DELETE | `/api/interactions/:id` | Delete interaction |

### Development

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dev/reset` | Reset and seed database (admin only, non-production) |
| GET | `/health` | Health check |

## Authentication

The API uses Bearer token authentication. After login, include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Default Users (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@keepwarm.com | admin123 | admin |
| alice@keepwarm.com | seller123 | seller |
| bob@keepwarm.com | seller123 | seller |

## Project Structure

```
src/
├── db/
│   ├── schema.ts    # Drizzle ORM schema definitions
│   ├── index.ts     # Database connection and initialization
│   └── seed.ts      # Database seeding logic
├── middleware/
│   └── auth.ts      # Authentication middleware
├── routes/
│   ├── auth.ts      # Authentication routes
│   ├── sellers.ts   # Seller management routes
│   ├── customers.ts # Customer management routes
│   └── interactions.ts # Interaction management routes
├── app.ts           # Hono app setup
└── index.ts         # Entry point

tests/
├── setup.ts         # Test utilities and helpers
├── auth.test.ts     # Authentication tests
├── sellers.test.ts  # Seller routes tests
├── customers.test.ts # Customer routes tests
└── interactions.test.ts # Interaction routes tests
```

