# Admin API - Consumables Management

**Version:** 1.0  
**Last Updated:** January 3, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [List Consumables](#list-consumables)
3. [Create Consumable](#create-consumable)
4. [Update Consumable](#update-consumable)
5. [Delete Consumable](#delete-consumable)
6. [Examples](#examples)

---

## Overview

Consumables management endpoints allow admins to maintain the catalog of medical consumables and supplies available for purchase.

**Base Path**: `/api/admin/consumables`  
**Required Role**: `admin` or `manager`  
**Authentication**: Required (Bearer Token)

---

## List Consumables

Retrieve paginated list of all consumables with search and filtering.

### Endpoint

```http
GET /api/admin/consumables
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Results per page (default: 20) |
| category | string | No | Filter by category |
| search | string | No | Search consumable name (case-insensitive) |

### Response

```json
{
  "success": true,
  "count": 15,
  "pagination": {
    "total": 156,
    "page": 1,
    "pages": 8
  },
  "data": [
    {
      "_id": "cons123abc",
      "category": "laboratory",
      "name": "Blood Collection Tubes (EDTA) - 5ml",
      "price": 15,
      "unit": "piece",
      "description": "Purple top tubes for hematology testing. Pack of 100.",
      "isActive": true,
      "createdBy": {
        "_id": "admin123",
        "firstName": "Super",
        "lastName": "Admin"
      },
      "createdAt": "2026-01-05T10:00:00.000Z",
      "updatedAt": "2026-01-05T10:00:00.000Z"
    },
    {
      "_id": "cons456def",
      "category": "surgical",
      "name": "Surgical Gloves - Latex Size 7.5",
      "price": 25,
      "unit": "pair",
      "description": "Sterile surgical gloves. Box of 50 pairs.",
      "isActive": true,
      "createdBy": {
        "_id": "admin123",
        "firstName": "Super",
        "lastName": "Admin"
      },
      "createdAt": "2026-01-04T14:30:00.000Z",
      "updatedAt": "2026-01-04T14:30:00.000Z"
    }
  ]
}
```

### Example Requests

```bash
# List all consumables
curl -X GET "https://app.codewithseth.co.ke/api/admin/consumables?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by category
curl -X GET "https://app.codewithseth.co.ke/api/admin/consumables?category=laboratory" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search by name
curl -X GET "https://app.codewithseth.co.ke/api/admin/consumables?search=gloves" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Combined filters
curl -X GET "https://app.codewithseth.co.ke/api/admin/consumables?category=surgical&search=mask&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Create Consumable

Add a new consumable to the catalog.

### Endpoint

```http
POST /api/admin/consumables
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body

```json
{
  "category": "laboratory",
  "name": "Blood Collection Tubes (EDTA) - 5ml",
  "price": 15,
  "unit": "piece",
  "description": "Purple top tubes for hematology testing. Pack of 100."
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| category | string | Yes | Consumable category |
| name | string | Yes | Consumable name |
| price | number | Yes | Price per unit |
| unit | string | No | Unit of measurement (piece, box, pack, etc.) |
| description | string | No | Detailed description |

### Response

**Success (201 Created)**

```json
{
  "success": true,
  "data": {
    "_id": "cons123abc",
    "category": "laboratory",
    "name": "Blood Collection Tubes (EDTA) - 5ml",
    "price": 15,
    "unit": "piece",
    "description": "Purple top tubes for hematology testing. Pack of 100.",
    "isActive": true,
    "createdBy": "admin123",
    "createdAt": "2026-01-06T11:00:00.000Z",
    "updatedAt": "2026-01-06T11:00:00.000Z"
  }
}
```

**Error Responses**

**400 Bad Request - Missing Fields**
```json
{
  "success": false,
  "message": "Please provide category, name, and price"
}
```

### Example Request

```bash
curl -X POST "https://app.codewithseth.co.ke/api/admin/consumables" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "laboratory",
    "name": "Blood Collection Tubes (EDTA) - 5ml",
    "price": 15,
    "unit": "piece",
    "description": "Purple top tubes for hematology testing"
  }'
```

---

## Update Consumable

Update consumable information including price, description, and status.

### Endpoint

```http
PUT /api/admin/consumables/:id
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Consumable MongoDB ObjectId |

### Request Body

```json
{
  "price": 18,
  "description": "Purple top tubes for hematology testing. Pack of 100. Updated pricing.",
  "isActive": true
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| category | string | No | Consumable category |
| name | string | No | Consumable name |
| price | number | No | Price per unit |
| unit | string | No | Unit of measurement |
| description | string | No | Description |
| isActive | boolean | No | Active status (true/false) |

### Response

```json
{
  "success": true,
  "data": {
    "_id": "cons123abc",
    "category": "laboratory",
    "name": "Blood Collection Tubes (EDTA) - 5ml",
    "price": 18,
    "unit": "piece",
    "description": "Purple top tubes for hematology testing. Pack of 100. Updated pricing.",
    "isActive": true,
    "updatedAt": "2026-01-06T12:00:00.000Z"
  }
}
```

### Example Requests

```bash
# Update price
curl -X PUT "https://app.codewithseth.co.ke/api/admin/consumables/cons123abc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 18,
    "description": "Updated pricing for 2026"
  }'

# Deactivate consumable
curl -X PUT "https://app.codewithseth.co.ke/api/admin/consumables/cons123abc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'

# Update multiple fields
curl -X PUT "https://app.codewithseth.co.ke/api/admin/consumables/cons123abc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blood Collection Tubes (EDTA) - 5ml (Premium)",
    "price": 20,
    "description": "Premium quality purple top tubes. Pack of 100."
  }'
```

---

## Delete Consumable

Delete a consumable from the catalog (admin only).

### Endpoint

```http
DELETE /api/admin/consumables/:id
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Consumable MongoDB ObjectId |

### Response

**Success (200 OK)**

```json
{
  "success": true,
  "message": "Consumable deleted successfully"
}
```

**Error Responses**

**404 Not Found**
```json
{
  "success": false,
  "message": "Consumable not found"
}
```

### Example Request

```bash
curl -X DELETE "https://app.codewithseth.co.ke/api/admin/consumables/cons123abc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Consumable Categories

Common categories used in the system:

- `laboratory` - Laboratory supplies (tubes, reagents, test kits)
- `surgical` - Surgical supplies (gloves, masks, gowns)
- `diagnostic` - Diagnostic supplies (test strips, electrodes)
- `personal_protective_equipment` - PPE (masks, face shields, gloves)
- `wound_care` - Wound care supplies (bandages, gauze, dressings)
- `injection` - Injection supplies (syringes, needles, IV sets)
- `sterilization` - Sterilization supplies (indicator tapes, pouches)
- `other` - Other consumables

---

## Units of Measurement

Common units used:

- `piece` - Individual item
- `pair` - Pair of items (gloves)
- `box` - Box/package
- `pack` - Pack/bundle
- `bottle` - Bottle/container
- `roll` - Roll (tape, gauze)
- `set` - Set/kit
- `tube` - Tube/vial
- `bag` - Bag (IV bags)

---

## Examples

### JavaScript/Axios

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://app.codewithseth.co.ke/api',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// List consumables
async function listConsumables(filters = {}) {
  const response = await api.get('/admin/consumables', { params: filters });
  return response.data;
}

// Create consumable
async function createConsumable(consumableData) {
  const response = await api.post('/admin/consumables', consumableData);
  return response.data;
}

// Update consumable
async function updateConsumable(consumableId, updates) {
  const response = await api.put(`/admin/consumables/${consumableId}`, updates);
  return response.data;
}

// Delete consumable
async function deleteConsumable(consumableId) {
  const response = await api.delete(`/admin/consumables/${consumableId}`);
  return response.data;
}

// Example: Create a new consumable
const newConsumable = {
  category: 'laboratory',
  name: 'Blood Collection Tubes (EDTA) - 5ml',
  price: 15,
  unit: 'piece',
  description: 'Purple top tubes for hematology testing'
};

createConsumable(newConsumable)
  .then(result => console.log('Consumable created:', result.data))
  .catch(error => console.error('Error:', error));
```

### Python

```python
import requests

BASE_URL = "https://app.codewithseth.co.ke/api"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# List consumables
def list_consumables(filters=None):
    params = {"page": 1, "limit": 20}
    if filters:
        params.update(filters)
    
    response = requests.get(
        f"{BASE_URL}/admin/consumables",
        headers=headers,
        params=params
    )
    return response.json()

# Create consumable
def create_consumable(consumable_data):
    response = requests.post(
        f"{BASE_URL}/admin/consumables",
        headers=headers,
        json=consumable_data
    )
    return response.json()

# Update consumable
def update_consumable(consumable_id, updates):
    response = requests.put(
        f"{BASE_URL}/admin/consumables/{consumable_id}",
        headers=headers,
        json=updates
    )
    return response.json()

# Delete consumable
def delete_consumable(consumable_id):
    response = requests.delete(
        f"{BASE_URL}/admin/consumables/{consumable_id}",
        headers=headers
    )
    return response.json()

# Example: Update consumable price
consumable_id = "cons123abc"
result = update_consumable(consumable_id, {
    "price": 18,
    "description": "Updated pricing for 2026"
})
print(f"Consumable updated: {result['success']}")
```

---

## Best Practices

### Catalog Management

1. **Consistent Naming**: Use clear, descriptive names with specifications (size, volume, material)
2. **Categories**: Assign appropriate categories for easy filtering
3. **Pricing**: Keep prices current and competitive
4. **Units**: Specify clear units (piece, box, pack)
5. **Descriptions**: Include important details (quantity per pack, material, specifications)

### Data Quality

1. **Complete Information**: Fill all fields including descriptions
2. **Regular Updates**: Review and update prices quarterly
3. **Active Status**: Mark discontinued items as inactive instead of deleting
4. **Bulk Operations**: Use bulk import for initial catalog setup
5. **Validation**: Verify pricing and specifications before publishing

### Price Management

1. **Document Changes**: Include reasons for price updates in descriptions
2. **Historical Data**: Consider keeping price history for analysis
3. **Market Research**: Review competitor pricing regularly
4. **Volume Discounts**: Document bulk pricing in descriptions
5. **Currency**: All prices in KES (Kenyan Shillings)

---

## Related Endpoints

- **Public Consumables**: `GET /api/consumables` (Public - active items only)
- **Orders**: `POST /api/orders/checkout` (Create order with consumables)
- **Analytics**: `GET /api/admin/analytics` (Sales analytics)

---

**[← Back to Machines](./ADMIN_API_07_MACHINES.md)** | **[Back to Index](./ADMIN_API_DOCUMENTATION_INDEX.md)** | **[Next: Analytics →](./ADMIN_API_10_ANALYTICS.md)**
