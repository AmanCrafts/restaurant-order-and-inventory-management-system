# Auth Module

Complete authentication and authorization module for the Restaurant Management System.

## Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Token refresh
- Password change
- Supabase Auth integration

## Endpoints

### Public Endpoints

#### POST /api/v1/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "WAITER",
      "restaurantId": "uuid"
    }
  }
}
```

#### POST /api/v1/auth/register
Register a new user.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Smith",
  "role": "WAITER",
  "restaurantId": "restaurant-uuid"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "name": "Jane Smith",
      "role": "WAITER",
      "restaurantId": "restaurant-uuid"
    },
    "message": "User registered successfully"
  }
}
```

#### POST /api/v1/auth/refresh
Refresh authentication token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Protected Endpoints

All protected endpoints require the `Authorization: Bearer <token>` header.

#### GET /api/v1/auth/me
Get current authenticated user.

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "WAITER",
      "restaurantId": "uuid"
    }
  }
}
```

#### POST /api/v1/auth/change-password
Change user password.

**Request:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

#### POST /api/v1/auth/logout
Logout user (client-side token removal recommended).

## Roles

- `ADMIN` - Full access to all resources
- `WAITER` - Can create/manage orders, view menu
- `COOK` - Can view kitchen orders, update order status

## Middleware Usage

### Authenticate
Protect routes requiring authentication:

```typescript
import { authenticate } from '../../shared/middleware/auth';

router.get('/protected', authenticate(), handler);
```

### Authorize
Restrict routes by role:

```typescript
import { authenticate, authorize } from '../../shared/middleware/auth';
import { UserRole } from '../../shared/constants/roles';

router.post('/admin-only',
  authenticate(),
  authorize([UserRole.ADMIN]),
  handler
);
```

### Restaurant Access
Ensure users can only access their restaurant's data:

```typescript
import { authenticate, requireRestaurantAccess } from '../../shared/middleware/auth';

router.get('/restaurant/:restaurantId',
  authenticate(),
  requireRestaurantAccess(),
  handler
);
```

## Architecture

```
auth/
├── controllers/     # HTTP request handlers
├── services/        # Business logic
├── repositories/    # Database operations
├── routes/          # Route definitions
└── README.md        # Documentation
```

### Flow

1. **Login**: Client sends credentials → AuthService validates → JWT token generated
2. **Register**: Client sends data → Supabase Auth creates user → Database user created → JWT token generated
3. **Protected Routes**: Middleware validates JWT → Attaches user to request → Route handler executes
4. **RBAC**: After authentication, authorize middleware checks user role
