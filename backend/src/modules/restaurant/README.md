# Restaurant Module

Restaurant management functionality for the Restaurant Management System.

## Features

- Create and manage restaurants
- Restaurant profile management
- View restaurant statistics
- Deactivate restaurants (soft delete)

## Endpoints

### Public Endpoints

#### GET /api/v1/restaurants
Get all restaurants.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "My Restaurant",
      "address": "123 Main St",
      "contactNumber": "+1234567890",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "usersCount": 5,
      "menusCount": 2,
      "tablesCount": 10
    }
  ]
}
```

#### GET /api/v1/restaurants/:id
Get restaurant by ID.

#### GET /api/v1/restaurants/stats
Get restaurant statistics.

**Response:**
```json
{
  "status": "success",
  "data": {
    "total": 10,
    "active": 8
  }
}
```

### Protected Endpoints (Admin Only)

#### POST /api/v1/restaurants
Create a new restaurant.

**Request:**
```json
{
  "name": "My Restaurant",
  "address": "123 Main St, City",
  "contactNumber": "+1234567890"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "My Restaurant",
    "address": "123 Main St, City",
    "contactNumber": "+1234567890",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/v1/restaurants/:id
Update restaurant.

**Request:**
```json
{
  "name": "Updated Name",
  "address": "New Address",
  "contactNumber": "+0987654321"
}
```

#### DELETE /api/v1/restaurants/:id
Deactivate restaurant (soft delete).

**Response:**
```json
{
  "status": "success",
  "message": "Restaurant deactivated successfully"
}
```

## Architecture

```
restaurant/
├── controllers/     # HTTP request handlers
├── services/        # Business logic
├── repositories/    # Database operations
├── routes/          # Route definitions
└── README.md        # Documentation
```

## Usage Flow

1. **Create Restaurant** (Admin only)
   - POST `/api/v1/restaurants`
   - Returns restaurant ID

2. **Register User** with restaurant ID
   - Use restaurant ID from step 1
   - POST `/api/v1/auth/register`

3. **Manage Restaurant**
   - Update details
   - View statistics
   - Deactivate if needed

## Relationships

- Restaurant has many Users (staff)
- Restaurant has many Menus
- Restaurant has many Tables
- Restaurant has many Inventory Items
- Restaurant has many Orders
