# Staff Management Module

This module provides staff management functionality for the restaurant system.

## Features

- Staff account creation and management
- Role assignment (ADMIN, WAITER, COOK)
- Staff activation/deactivation
- Password management
- Staff search and filtering
- Restaurant-level staff statistics

## API Endpoints

### Get All Staff
```
GET /api/v1/staff
```
Query Parameters:
- `restaurantId` (optional): Filter by restaurant
- `role` (optional): Filter by role (ADMIN, WAITER, COOK)
- `isActive` (optional): Filter by active status (true/false)
- `search` (optional): Search by name or email

### Get Staff by ID
```
GET /api/v1/staff/:id
```

### Get Staff by Restaurant
```
GET /api/v1/staff/restaurant/:restaurantId
```

### Search Staff
```
GET /api/v1/staff/search?restaurantId=:restaurantId&q=:query
```
Query Parameters:
- `restaurantId` (required): Restaurant ID
- `q` (optional): Search query
- `role` (optional): Filter by role
- `isActive` (optional): Filter by active status

### Get Staff Statistics
```
GET /api/v1/staff/stats/:restaurantId
```

### Create Staff Member
```
POST /api/v1/staff
```
Body:
```json
{
  "restaurantId": "string",
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "ADMIN | WAITER | COOK"
}
```

### Update Staff Member
```
PUT /api/v1/staff/:id
```
Body:
```json
{
  "name": "string",
  "email": "string",
  "role": "ADMIN | WAITER | COOK",
  "isActive": "boolean"
}
```

### Update Staff Password
```
PUT /api/v1/staff/:id/password
```
Body:
```json
{
  "newPassword": "string"
}
```

### Activate Staff Member
```
PATCH /api/v1/staff/:id/activate
```

### Deactivate Staff Member (Soft Delete)
```
DELETE /api/v1/staff/:id
```

### Delete Staff Member (Hard Delete)
```
DELETE /api/v1/staff/:id/permanent
```

## Authorization

All staff management endpoints require:
- Authentication (valid JWT token)
- ADMIN role authorization

## Architecture

The module follows the layered architecture pattern:

- **Controller**: Handles HTTP requests/responses
- **Service**: Contains business logic
- **Repository**: Handles database operations

## Files

- `controllers/staff.controller.ts` - HTTP request handlers
- `services/staff.service.ts` - Business logic
- `repositories/staff.repository.ts` - Database operations
- `routes/staff.routes.ts` - Route definitions
- `index.ts` - Module exports
