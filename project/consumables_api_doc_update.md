
## 9. Consumables API

### Overview
Manage consumables (products) grouped by category.

### Public Endpoints

#### GET `/api/consumables`
**Purpose**: List all consumables.
**Query Parameters**:
- `category`: Filter by category name (e.g., "LABORATORY EQUIPMENT", "SEROLOGY KITS")
- `search`: Search by name

**Response**:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "category": "LABORATORY EQUIPMENT",
      "name": "Blood Gas Analyzer-vita5",
      "price": 920000,
      "isActive": true
    }
  ]
}
```

#### GET `/api/consumables/:id`
**Purpose**: Get details of a single consumable.

### Admin Endpoints (Requires Authentication)

#### POST `/api/admin/consumables`
**Purpose**: Create a new consumable.
**Body**:
```json
{
  "category": "LABORATORY EQUIPMENT",
  "name": "New Analyzer",
  "price": 500000,
  "unit": "unit",
  "description": "Optional description"
}
```

#### PUT `/api/admin/consumables/:id`
**Purpose**: Update a consumable.

#### DELETE `/api/admin/consumables/:id`
**Purpose**: Soft delete a consumable (sets `isActive` to false).
