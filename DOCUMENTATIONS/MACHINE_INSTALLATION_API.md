# Machine Installation API Documentation

## Overview
This endpoint allows you to register a facility with contact person and optionally install a machine there in a single request.

---

## Quick Start

### Install Machine at Facility

```bash
curl -X POST http://localhost:4500/api/admin/machines/install \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "facilityName": "Kenyatta National Hospital",
    "location": "Nairobi",
    "contactPerson": "Dr. John Njoroge",
    "phoneNumber": "+254712345678",
    "role": "Facility Manager",
    "machineInstalled": true,
    "machineName": "X-Ray Model 5000",
    "serialNumber": "SN-2026-001",
    "manufacturer": "Siemens"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Machine installed successfully",
  "data": {
    "facility": {
      "_id": "63f8a1b2c3d4e5f6g7h8i9j0",
      "type": "Feature",
      "properties": {
        "name": "Kenyatta National Hospital",
        "location": "Nairobi",
        "contactPerson": {
          "name": "Dr. John Njoroge",
          "phone": "+254712345678",
          "role": "Facility Manager"
        }
      }
    },
    "machine": {
      "_id": "664f8a1b2c3d4e5f6g7h8i9j1",
      "serialNumber": "SN-2026-001",
      "model": "X-Ray Model 5000",
      "manufacturer": "Siemens",
      "facility": {
        "name": "Kenyatta National Hospital",
        "location": "Nairobi"
      },
      "status": "active"
    }
  }
}
```

---

## API Endpoint

### Install Machine at Facility
**Register facility with contact person and optionally install a machine**

#### Route
```
POST /api/admin/machines/install
```

#### Authentication
- ✅ Required: Bearer Token (JWT)
- ✅ Role Required: `admin` or `manager`

#### Request Body

```json
{
  "facilityName": "Kenyatta National Hospital",
  "location": "Nairobi",
  "contactPerson": "Dr. John Njoroge",
  "phoneNumber": "+254712345678",
  "role": "Facility Manager",
  "machineInstalled": true,
  "machineName": "X-Ray Model 5000",
  "serialNumber": "SN-2026-001",
  "manufacturer": "Siemens"
}
```

#### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `facilityName` | String | ✅ Yes | Name of the facility |
| `location` | String | No | Location/City |
| `contactPerson` | String | ✅ Yes | Contact person's full name |
| `phoneNumber` | String | ✅ Yes | Contact phone number |
| `role` | String | No | Contact person's role (e.g., "Facility Manager") |
| `machineInstalled` | Boolean | No | Is a machine installed there? (true/false) |
| `machineName` | String | ✅ If machineInstalled=true | Machine model name |
| `serialNumber` | String | ✅ If machineInstalled=true | Machine serial number |
| `manufacturer` | String | No | Machine manufacturer |

#### Response (Success - 201 Created)

**With Machine Installed:**
```json
{
  "success": true,
  "message": "Machine installed successfully",
  "data": {
    "facility": {
      "_id": "63f8a1b2c3d4e5f6g7h8i9j0",
      "properties": {
        "name": "Kenyatta National Hospital",
        "contactPerson": {
          "name": "Dr. John Njoroge",
          "phone": "+254712345678",
          "role": "Facility Manager"
        }
      }
    },
    "machine": {
      "_id": "664f8a1b2c3d4e5f6g7h8i9j1",
      "serialNumber": "SN-2026-001",
      "model": "X-Ray Model 5000",
      "manufacturer": "Siemens",
      "status": "active"
    }
  }
}
```

**Without Machine (Facility Only):**
```json
{
  "success": true,
  "message": "Facility registered successfully (no machine installed)",
  "data": {
    "facility": {
      "_id": "63f8a1b2c3d4e5f6g7h8i9j0",
      "properties": {
        "name": "Kenyatta National Hospital",
        "contactPerson": {
          "name": "Dr. John Njoroge",
          "phone": "+254712345678",
          "role": "Facility Manager"
        }
      }
    },
    "machine": null
  }
}
```

#### Response (Error Cases)

**Missing Facility Name:**
```json
{
  "success": false,
  "message": "Facility name is required"
}
```

**Missing Required Contact Person:**
```json
{
  "success": false,
  "message": "Contact person name is required"
}
```

**Machine Installed But Missing Name:**
```json
{
  "success": false,
  "message": "Machine name is required when machine is installed"
}
```

**Machine Installed But Missing Serial Number:**
```json
{
  "success": false,
  "message": "Serial number is required when machine is installed"
}
```

---

## Use Cases

### 1. Register Facility with Contact (No Machine)
```json
{
  "facilityName": "Hayat Pharmacy",
  "location": "Juba",
  "contactPerson": "Ahmed Hassan",
  "phoneNumber": "+211927654321",
  "role": "Manager",
  "machineInstalled": false
}
```

### 2. Register Facility and Install Machine
```json
{
  "facilityName": "Kenyatta National Hospital",
  "location": "Nairobi",
  "contactPerson": "Dr. John Smith",
  "phoneNumber": "+254712345678",
  "role": "Chief Medical Officer",
  "machineInstalled": true,
  "machineName": "CT Scanner Pro",
  "serialNumber": "CT-2026-0042",
  "manufacturer": "GE Healthcare"
}
```

### 3. Register Facility and Install Multiple Machines
*Make separate requests for each machine*
```json
[
  {
    "facilityName": "Aga Khan Hospital",
    "location": "Nairobi",
    "contactPerson": "Dr. Sarah Ochieng",
    "phoneNumber": "+254723456789",
    "role": "Radiology Director",
    "machineInstalled": true,
    "machineName": "X-Ray System",
    "serialNumber": "XRS-001",
    "manufacturer": "Siemens"
  },
  {
    "facilityName": "Aga Khan Hospital",
    "location": "Nairobi",
    "contactPerson": "Dr. Sarah Ochieng",
    "phoneNumber": "+254723456789",
    "role": "Radiology Director",
    "machineInstalled": true,
    "machineName": "Ultrasound",
    "serialNumber": "US-002",
    "manufacturer": "GE Healthcare"
  }
]
```

---

## Frontend Implementation

### React Component - Machine Installation Form

```javascript
import { useState } from 'react';

export function InstallMachineForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [machineInstalled, setMachineInstalled] = useState(false);
  const [formData, setFormData] = useState({
    facilityName: '',
    location: '',
    contactPerson: '',
    phoneNumber: '',
    role: '',
    machineName: '',
    serialNumber: '',
    manufacturer: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    setMachineInstalled(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');

      const payload = {
        facilityName: formData.facilityName,
        location: formData.location,
        contactPerson: formData.contactPerson,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        machineInstalled: machineInstalled,
        ...(machineInstalled && {
          machineName: formData.machineName,
          serialNumber: formData.serialNumber,
          manufacturer: formData.manufacturer
        })
      };

      const response = await fetch('/api/admin/machines/install', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Installed:', result.data);
        // Clear form
        setFormData({
          facilityName: '',
          location: '',
          contactPerson: '',
          phoneNumber: '',
          role: '',
          machineName: '',
          serialNumber: '',
          manufacturer: ''
        });
        setMachineInstalled(false);
        onSuccess?.(result.data);
      } else {
        setError(result.message || 'Installation failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="install-form">
      <fieldset>
        <legend>Facility Information</legend>

        <div className="form-group">
          <label htmlFor="facilityName">Facility Name *</label>
          <input
            type="text"
            id="facilityName"
            name="facilityName"
            value={formData.facilityName}
            onChange={handleChange}
            placeholder="e.g., Kenyatta National Hospital"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Nairobi"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Contact Person</legend>

        <div className="form-group">
          <label htmlFor="contactPerson">Contact Person Name *</label>
          <input
            type="text"
            id="contactPerson"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            placeholder="e.g., Dr. John Smith"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number *</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="e.g., +254712345678"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="role">Role</label>
          <input
            type="text"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="e.g., Facility Manager"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Machine Installation</legend>

        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="machineInstalled"
            checked={machineInstalled}
            onChange={handleCheckboxChange}
          />
          <label htmlFor="machineInstalled">Is a machine installed here?</label>
        </div>

        {machineInstalled && (
          <>
            <div className="form-group">
              <label htmlFor="machineName">Machine Name *</label>
              <input
                type="text"
                id="machineName"
                name="machineName"
                value={formData.machineName}
                onChange={handleChange}
                placeholder="e.g., X-Ray Model 5000"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="serialNumber">Serial Number *</label>
              <input
                type="text"
                id="serialNumber"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="e.g., SN-2026-001"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="manufacturer">Manufacturer</label>
              <input
                type="text"
                id="manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                placeholder="e.g., Siemens"
              />
            </div>
          </>
        )}
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? 'Installing...' : 'Install Machine'}
      </button>

      {error && <div className="error-message">{error}</div>}
    </form>
  );
}
```

### CSS Styling

```css
.install-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.install-form fieldset {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.install-form legend {
  font-weight: bold;
  color: #333;
  padding: 0 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #444;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group.checkbox {
  display: flex;
  align-items: center;
}

.form-group.checkbox input {
  width: auto;
  margin-right: 8px;
}

.form-group.checkbox label {
  margin-bottom: 0;
}

button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #d32f2f;
  margin-top: 10px;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}
```

---

## Behavior

### Facility Creation
- If facility doesn't exist, it's created automatically
- If facility exists, contact person info is updated
- Location is stored in facility properties

### Machine Installation
- Only created if `machineInstalled: true`
- Machine is linked to the facility
- Contact person is copied to machine record
- Machine status defaults to 'active'

### Data Persistence
- Facility stored in MongoDB `locations` collection
- Machine stored in MongoDB `machines` collection
- Both have automatic timestamps

---

## Testing

### Using Postman

1. **Set Authorization:**
   - Type: Bearer Token
   - Token: Your JWT

2. **Create Request:**
   - Method: POST
   - URL: `http://localhost:4500/api/admin/machines/install`

3. **Body (JSON):**
   ```json
   {
     "facilityName": "Test Hospital",
     "location": "Nairobi",
     "contactPerson": "Dr. Test",
     "phoneNumber": "+254700000000",
     "role": "Director",
     "machineInstalled": true,
     "machineName": "X-Ray",
     "serialNumber": "TEST-001",
     "manufacturer": "Siemens"
   }
   ```

4. **Send and verify:**
   - Status: 201
   - `success: true`
   - Response includes both facility and machine IDs

---

## Tips

✅ **Facility Name** - Only this is absolutely required if no machine  
✅ **Contact Info** - Required for tracking who manages the facility  
✅ **Phone Format** - Can be any format (+254..., 0700..., etc.)  
✅ **Machine Optional** - You can register a facility without a machine  
✅ **Serial Number** - Should be unique for each machine  

---

## Error Handling

Each field has validation:
- Facility name: Cannot be empty
- Contact person: Cannot be empty
- Phone number: Cannot be empty
- Machine name: Required if `machineInstalled=true`
- Serial number: Required if `machineInstalled=true`

Clear error messages help you fix issues quickly!
