# Consumables API - User Documentation

Quick guide for fetching consumables data from the ACCORD Backend API.

---

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:5000/api
```

---

## Endpoints

### 1. Get All Consumables

Fetch all active consumables, optionally filtered by category or search term.

**Endpoint:**
```
GET /api/consumables
```

**Authentication:** Not required (Public endpoint)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category name |
| `search` | string | No | Search consumables by name (case-insensitive) |

**Response Format:**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "category": "Medical Supplies",
      "name": "Surgical Gloves",
      "price": 1500,
      "unit": "box",
      "description": "Sterile latex surgical gloves",
      "isActive": true,
      "createdAt": "2024-12-01T10:30:00.000Z",
      "updatedAt": "2024-12-01T10:30:00.000Z"
    }
  ]
}
```

**Response Fields:**

- `success` (boolean): Request status
- `count` (number): Number of consumables returned
- `data` (array): Array of consumable objects
  - `_id` (string): Unique consumable ID
  - `category` (string): Product category
  - `name` (string): Consumable name
  - `price` (number): Price (in your currency)
  - `unit` (string): Unit of measurement (e.g., "box", "pack", "piece")
  - `description` (string): Product description
  - `isActive` (boolean): Whether consumable is active
  - `createdAt` (string): Creation timestamp
  - `updatedAt` (string): Last update timestamp

---

### 2. Get Single Consumable

Fetch details of a specific consumable by ID.

**Endpoint:**
```
GET /api/consumables/:id
```

**Authentication:** Not required (Public endpoint)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | MongoDB ObjectId of the consumable |

**Response Format:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "category": "Medical Supplies",
    "name": "Surgical Gloves",
    "price": 1500,
    "unit": "box",
    "description": "Sterile latex surgical gloves",
    "isActive": true,
    "createdAt": "2024-12-01T10:30:00.000Z",
    "updatedAt": "2024-12-01T10:30:00.000Z"
  }
}
```

---

## Usage Examples

### cURL

#### Get All Consumables
```bash
curl -X GET https://your-domain.com/api/consumables
```

#### Filter by Category
```bash
curl -X GET "https://your-domain.com/api/consumables?category=Medical%20Supplies"
```

#### Search by Name
```bash
curl -X GET "https://your-domain.com/api/consumables?search=gloves"
```

#### Get Single Consumable
```bash
curl -X GET https://your-domain.com/api/consumables/507f1f77bcf86cd799439011
```

---

### JavaScript (Fetch API)

#### Get All Consumables
```javascript
const fetchConsumables = async () => {
  try {
    const response = await fetch('https://your-domain.com/api/consumables');
    const result = await response.json();
    
    if (result.success) {
      console.log(`Found ${result.count} consumables`);
      console.log(result.data);
    }
  } catch (error) {
    console.error('Error fetching consumables:', error);
  }
};

fetchConsumables();
```

#### Filter by Category
```javascript
const fetchByCategory = async (category) => {
  try {
    const response = await fetch(
      `https://your-domain.com/api/consumables?category=${encodeURIComponent(category)}`
    );
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage
const supplies = await fetchByCategory('Medical Supplies');
```

#### Search Consumables
```javascript
const searchConsumables = async (searchTerm) => {
  try {
    const response = await fetch(
      `https://your-domain.com/api/consumables?search=${encodeURIComponent(searchTerm)}`
    );
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage
const gloves = await searchConsumables('gloves');
```

#### Get Single Consumable
```javascript
const fetchConsumableById = async (id) => {
  try {
    const response = await fetch(`https://your-domain.com/api/consumables/${id}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage
const consumable = await fetchConsumableById('507f1f77bcf86cd799439011');
```

---

### JavaScript (Axios)

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://your-domain.com/api';

// Get all consumables
const getAllConsumables = async () => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/consumables`);
    return data.data; // Array of consumables
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

// Filter by category
const getByCategory = async (category) => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/consumables`, {
      params: { category }
    });
    return data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

// Search consumables
const searchConsumables = async (searchTerm) => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/consumables`, {
      params: { search: searchTerm }
    });
    return data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

// Get single consumable
const getConsumableById = async (id) => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/consumables/${id}`);
    return data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};
```

---

### Python (Requests)

```python
import requests

API_BASE_URL = "https://your-domain.com/api"

# Get all consumables
def get_all_consumables():
    try:
        response = requests.get(f"{API_BASE_URL}/consumables")
        response.raise_for_status()
        result = response.json()
        
        if result['success']:
            return result['data']
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")

# Filter by category
def get_by_category(category):
    try:
        response = requests.get(
            f"{API_BASE_URL}/consumables",
            params={'category': category}
        )
        response.raise_for_status()
        result = response.json()
        
        if result['success']:
            return result['data']
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")

# Search consumables
def search_consumables(search_term):
    try:
        response = requests.get(
            f"{API_BASE_URL}/consumables",
            params={'search': search_term}
        )
        response.raise_for_status()
        result = response.json()
        
        if result['success']:
            return result['data']
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")

# Get single consumable
def get_consumable_by_id(consumable_id):
    try:
        response = requests.get(f"{API_BASE_URL}/consumables/{consumable_id}")
        response.raise_for_status()
        result = response.json()
        
        if result['success']:
            return result['data']
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")

# Usage examples
if __name__ == "__main__":
    # Get all
    consumables = get_all_consumables()
    print(f"Total consumables: {len(consumables)}")
    
    # Filter by category
    supplies = get_by_category("Medical Supplies")
    
    # Search
    gloves = search_consumables("gloves")
    
    # Get specific item
    item = get_consumable_by_id("507f1f77bcf86cd799439011")
```

---

### PHP

```php
<?php

$API_BASE_URL = "https://your-domain.com/api";

// Get all consumables
function getAllConsumables() {
    global $API_BASE_URL;
    
    $url = "$API_BASE_URL/consumables";
    $response = file_get_contents($url);
    $result = json_decode($response, true);
    
    if ($result['success']) {
        return $result['data'];
    }
    
    return [];
}

// Filter by category
function getByCategory($category) {
    global $API_BASE_URL;
    
    $url = "$API_BASE_URL/consumables?category=" . urlencode($category);
    $response = file_get_contents($url);
    $result = json_decode($response, true);
    
    if ($result['success']) {
        return $result['data'];
    }
    
    return [];
}

// Search consumables
function searchConsumables($searchTerm) {
    global $API_BASE_URL;
    
    $url = "$API_BASE_URL/consumables?search=" . urlencode($searchTerm);
    $response = file_get_contents($url);
    $result = json_decode($response, true);
    
    if ($result['success']) {
        return $result['data'];
    }
    
    return [];
}

// Get single consumable
function getConsumableById($id) {
    global $API_BASE_URL;
    
    $url = "$API_BASE_URL/consumables/$id";
    $response = file_get_contents($url);
    $result = json_decode($response, true);
    
    if ($result['success']) {
        return $result['data'];
    }
    
    return null;
}

// Usage examples
$consumables = getAllConsumables();
echo "Total consumables: " . count($consumables) . "\n";

$supplies = getByCategory("Medical Supplies");
$gloves = searchConsumables("gloves");
$item = getConsumableById("507f1f77bcf86cd799439011");
?>
```

---

## Error Handling

### Error Response Format

When an error occurs, the API returns:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success - Request completed successfully |
| `400` | Bad Request - Invalid parameters |
| `404` | Not Found - Consumable doesn't exist or is inactive |
| `500` | Internal Server Error - Server-side issue |

### Error Handling Example

```javascript
const fetchConsumables = async () => {
  try {
    const response = await fetch('https://your-domain.com/api/consumables');
    
    // Check HTTP status
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check API success field
    if (!result.success) {
      throw new Error(result.message || 'Request failed');
    }
    
    return result.data;
    
  } catch (error) {
    console.error('Failed to fetch consumables:', error.message);
    return [];
  }
};
```

---

## Response Data Structure

### Consumable Object

Each consumable in the response contains:

```typescript
interface Consumable {
  _id: string;           // Unique MongoDB ID
  category: string;      // Product category
  name: string;          // Product name
  price: number;         // Price (numeric)
  unit: string;          // Unit of measurement
  description: string;   // Product description
  isActive: boolean;     // Active status (only true in public API)
  createdAt: string;     // ISO 8601 timestamp
  updatedAt: string;     // ISO 8601 timestamp
}
```

---

## Rate Limiting

The API has rate limiting in place to prevent abuse:

- **Rate Limit:** Check with your administrator
- **Headers:** Rate limit information may be returned in response headers
- **Recommendation:** Implement caching to reduce API calls

### Caching Example

```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cachedData = null;
let cacheTimestamp = null;

const fetchConsumables = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (!forceRefresh && cachedData && 
      cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    return cachedData;
  }
  
  // Fetch fresh data
  const response = await fetch('https://your-domain.com/api/consumables');
  const result = await response.json();
  
  if (result.success) {
    cachedData = result.data;
    cacheTimestamp = now;
    return cachedData;
  }
  
  return [];
};
```

---

## Best Practices

### 1. **Always Check Success Field**
```javascript
if (result.success) {
  // Process data
} else {
  // Handle error
}
```

### 2. **Use URL Encoding for Query Parameters**
```javascript
const category = "Medical & Surgical";
const url = `/api/consumables?category=${encodeURIComponent(category)}`;
```

### 3. **Implement Error Handling**
Always wrap API calls in try-catch blocks and handle both network errors and API errors.

### 4. **Cache Results When Appropriate**
Consumables data doesn't change frequently, so caching for a few minutes can improve performance.

### 5. **Validate IDs Before Calling**
```javascript
const isValidMongoId = (id) => /^[a-f\d]{24}$/i.test(id);

if (isValidMongoId(consumableId)) {
  await fetchConsumableById(consumableId);
}
```

---

## Integration Examples

### React Component

```jsx
import React, { useState, useEffect } from 'react';

const ConsumablesList = () => {
  const [consumables, setConsumables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://your-domain.com/api/consumables');
        const result = await response.json();
        
        if (result.success) {
          setConsumables(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Consumables ({consumables.length})</h2>
      <ul>
        {consumables.map(item => (
          <li key={item._id}>
            <strong>{item.name}</strong> - {item.price} ({item.unit})
            <br />
            <small>{item.category}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConsumablesList;
```

### Vue.js Component

```vue
<template>
  <div>
    <h2>Consumables ({{ consumables.length }})</h2>
    
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    
    <ul v-else>
      <li v-for="item in consumables" :key="item._id">
        <strong>{{ item.name }}</strong> - {{ item.price }} ({{ item.unit }})
        <br />
        <small>{{ item.category }}</small>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      consumables: [],
      loading: true,
      error: null
    };
  },
  
  async mounted() {
    try {
      const response = await fetch('https://your-domain.com/api/consumables');
      const result = await response.json();
      
      if (result.success) {
        this.consumables = result.data;
      } else {
        this.error = result.message;
      }
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
};
</script>
```

---

## Testing the API

### Quick Test with cURL

```bash
# Test basic connectivity
curl -i https://your-domain.com/api/consumables

# Pretty print JSON response
curl -s https://your-domain.com/api/consumables | jq

# Count total consumables
curl -s https://your-domain.com/api/consumables | jq '.count'

# Get all consumable names
curl -s https://your-domain.com/api/consumables | jq '.data[].name'

# Filter by category
curl -s "https://your-domain.com/api/consumables?category=Medical%20Supplies" | jq

# Search
curl -s "https://your-domain.com/api/consumables?search=gloves" | jq
```

---

## Support

### Need Help?

- **API Issues:** Contact your system administrator
- **Documentation:** Check this guide or other API documentation
- **Rate Limits:** Contact admin to request limit increase

### Reporting Issues

When reporting API issues, include:
1. Request URL (with query parameters)
2. HTTP method used
3. Response status code
4. Response body
5. Timestamp of the request

---

## Changelog

### v1.0.0 (Current)
- ✅ Public consumables endpoint
- ✅ Category filtering
- ✅ Search functionality
- ✅ Single consumable retrieval
- ✅ No authentication required for reading

---

## Related Documentation

- [Backend API Documentation](./BACKEND_API_DOCUMENTATION.md)
- [PDF Generator Documentation](./PDF_GENERATOR_DOCUMENTATION.md)
- [Admin API Documentation](./BACKEND_ADMIN_DOCUMENTATION.md)

---

**Last Updated:** December 12, 2025
