# Backend Folder Structure

This document outlines the organized folder structure for the Restaurant Order and Inventory Management System backend.

## Architecture Pattern

The backend follows a **Layered Architecture** with **Feature-Based Organization**:

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Repositories**: Handle database operations
- **Routes**: Define API endpoints
- **Validators**: Validate input data

## Folder Structure

```
src/
├── api/                          # API Layer
│   ├── controllers/              # API controllers (if different from module controllers)
│   ├── middleware/               # API-specific middleware
│   ├── routes/                   # API route definitions
│   │   └── index.ts              # Main router combining all routes
│   └── validators/               # API-level validators
│
├── modules/                      # Feature Modules (by domain)
│   ├── auth/                     # Authentication & Authorization
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── validators/
│   │   └── index.ts              # Module exports
│   │
│   ├── restaurant/               # Restaurant Management
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── validators/
│   │
│   ├── staff/                    # Staff Management
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── validators/
│   │
│   ├── menu/                     # Menu Management
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── validators/
│   │
│   ├── inventory/                # Inventory Management
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── validators/
│   │
│   ├── table/                    # Table Management
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── validators/
│   │
│   ├── order/                    # Order Management
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── validators/
│   │
│   ├── kitchen/                  # Kitchen Workflow
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── validators/
│   │
│   ├── bill/                     # Billing & Payments
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── validators/
│   │
│   └── notification/             # Notifications
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── routes/
│       └── validators/
│
├── shared/                       # Shared Resources
│   ├── config/                   # Configuration
│   │   ├── env.ts                # Environment variables
│   │   ├── database.ts           # Prisma client
│   │   └── supabase.ts           # Supabase clients
│   │
│   ├── constants/                # Application Constants
│   │   ├── roles.ts              # User roles & permissions
│   │   ├── order-status.ts       # Order status enum & flow
│   │   ├── table-status.ts       # Table status enum
│   │   └── bill-status.ts        # Bill status enum
│   │
│   ├── errors/                   # Custom Error Classes
│   │   └── index.ts
│   │
│   ├── middleware/               # Shared Middleware
│   │   ├── auth.ts               # Authentication & RBAC
│   │   ├── error-handler.ts      # Global error handling
│   │   └── validate-request.ts   # Request validation
│   │
│   ├── types/                    # Shared Types
│   │   ├── api-response.ts       # API response types
│   │   ├── repository.ts         # Repository interfaces
│   │   └── index.ts
│   │
│   └── utils/                    # Utility Functions
│       ├── logger.ts             # Logging utility
│       ├── password.ts           # Password hashing
│       └── jwt.ts                # JWT token handling
│
├── app.ts                        # Express app setup
└── server.ts                     # Server entry point

prisma/
├── schema.prisma                 # Database schema
└── migrations/                   # Database migrations
```

## Module Structure

Each module follows a consistent pattern:

```
module-name/
├── controllers/     # Handle HTTP requests
├── services/        # Business logic
├── repositories/    # Database operations
├── routes/          # Route definitions
├── validators/      # Input validation
└── index.ts         # Module exports
```

## Shared Resources

### Config (`shared/config/`)
- **env.ts**: Environment configuration and validation
- **database.ts**: Prisma client singleton
- **supabase.ts**: Supabase client instances

### Constants (`shared/constants/`)
- **roles.ts**: UserRole enum, RolePermissions mapping
- **order-status.ts**: OrderStatus enum, OrderStatusFlow, transition validation
- **table-status.ts**: TableStatus enum
- **bill-status.ts**: BillStatus enum

### Middleware (`shared/middleware/`)
- **auth.ts**: Authentication, authorization, restaurant access control
- **error-handler.ts**: Global error handling, AppError class
- **validate-request.ts**: Zod schema validation

### Types (`shared/types/`)
- **api-response.ts**: Response type definitions
- **repository.ts**: Repository interface definitions

### Utils (`shared/utils/`)
- **logger.ts**: Application logging
- **password.ts**: Bcrypt password hashing
- **jwt.ts**: JWT token generation and verification

## Design Principles

1. **Single Responsibility**: Each module handles one domain
2. **Dependency Injection**: Services receive repositories via constructor
3. **Layered Architecture**: Controllers → Services → Repositories
4. **DRY Principle**: Shared resources in `shared/` folder
5. **Type Safety**: Full TypeScript coverage
6. **Error Handling**: Centralized error handling middleware
7. **Authentication**: JWT-based auth with RBAC

## Adding a New Module

1. Create folder: `src/modules/module-name/`
2. Create subfolders: `controllers/`, `services/`, `repositories/`, `routes/`, `validators/`
3. Implement each layer following existing patterns
4. Export from `index.ts`
5. Add routes to `src/api/routes/index.ts`

## Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `auth.controller.ts`)
- **Classes**: `PascalCase` (e.g., `AuthController`)
- **Interfaces**: `PascalCase` with `I` prefix (e.g., `IRepository`)
- **Methods**: `camelCase` (e.g., `findById`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `ORDER_STATUS`)
- **Enums**: `PascalCase` (e.g., `UserRole`)
