# Engineer Mobile/Web Application - Implementation Guide

## Overview
This guide explains how engineers will use the application to:
1. View services/duties assigned to them
2. Update service status as they work
3. Submit service completion reports with conditions and notes

---

## Authentication

### Login Flow
Engineers must authenticate to access their assigned services.

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "engineer@accord.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "eng123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "engineer@accord.com",
      "role": "engineer",
      "employeeId": "ENG001"
    }
  }
}
```

**Store the tokens**:
- `accessToken` - Use in Authorization header for all requests
- `refreshToken` - Use to get new access token when expired
- Store in secure storage (AsyncStorage/SecureStore for mobile, httpOnly cookie for web)

---

## 1. View Assigned Services (Engineer Dashboard)

### Get My Assigned Services

**Endpoint**: `GET /api/engineering-services`

**Query Parameters**:
- `engineerId` - Filter by engineer ID (use logged-in user's _id)
- `status` - Filter by status (pending, assigned, in-progress, completed)
- `startDate` - Filter from date
- `endDate` - Filter to date
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Example Request**:
```bash
GET /api/engineering-services?engineerId=eng123&status=assigned&page=1&limit=20
```

**Response**:
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "service123",
        "date": "2025-01-15T10:00:00Z",
        "facility": {
          "name": "City Hospital",
          "location": "Downtown, Nairobi"
        },
        "serviceType": "maintenance",
        "engineerInCharge": {
          "_id": "eng123",
          "name": "John Doe",
          "phone": "+254712345678"
        },
        "machineDetails": "Model X500 - Serial #12345",
        "conditionBefore": "",
        "conditionAfter": "",
        "status": "assigned",
        "notes": "Routine maintenance check",
        "scheduledDate": "2025-01-15T08:00:00Z",
        "userId": {
          "_id": "admin123",
          "firstName": "Admin",
          "lastName": "User"
        },
        "createdAt": "2025-01-10T12:00:00Z",
        "updatedAt": "2025-01-10T12:00:00Z"
      }
    ],
    "totalDocs": 15,
    "totalPages": 1,
    "page": 1,
    "limit": 20,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Implementation Tips (Frontend):

**React/React Native Example**:
```javascript
const fetchMyServices = async (status = 'assigned') => {
  try {
    const token = await getStoredToken(); // From secure storage
    const userId = await getStoredUserId();
    
    const response = await fetch(
      `${API_BASE}/api/engineering-services?engineerId=${userId}&status=${status}&page=1&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      setServices(result.data.docs);
      setTotalPages(result.data.totalPages);
    }
  } catch (error) {
    console.error('Error fetching services:', error);
  }
};
```

**UI Display**:
- Show services in a list/card view
- Group by status: "Assigned", "In Progress", "Completed Today"
- Color-code status badges:
  - Assigned: Yellow/Orange
  - In Progress: Blue
  - Completed: Green
- Display: Date, Facility name, Service type, Machine details
- Add "Start Service" button for assigned services
- Add "View Details" button to see full information

---

## 2. View Service Details

**Endpoint**: `GET /api/engineering-services/:id`

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Example Request**:
```bash
GET /api/engineering-services/service123
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "service123",
    "date": "2025-01-15T10:00:00Z",
    "facility": {
      "name": "City Hospital",
      "location": "Downtown, Nairobi"
    },
    "serviceType": "maintenance",
    "engineerInCharge": {
      "_id": "eng123",
      "name": "John Doe",
      "phone": "+254712345678"
    },
    "machineDetails": "Model X500 - Serial #12345\nManufacturer: Accord Medical\nYear: 2020",
    "conditionBefore": "",
    "conditionAfter": "",
    "status": "assigned",
    "notes": "Routine maintenance check. Client requested priority service.",
    "scheduledDate": "2025-01-15T08:00:00Z",
    "otherPersonnel": ["Tech Support: Jane Smith"],
    "nextServiceDate": "2025-04-15T08:00:00Z",
    "userId": {
      "_id": "admin123",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-01-10T12:00:00Z",
    "updatedAt": "2025-01-10T12:00:00Z"
  }
}
```

**UI Display**:
- Show full service details in a modal/separate screen
- Display all fields in organized sections:
  - **Service Info**: Type, Status, Scheduled Date
  - **Facility**: Name, Location, Contact
  - **Machine**: Details, Condition Before/After
  - **Notes**: Admin notes, engineer notes
  - **Personnel**: Other people involved
- Action buttons: "Start Service", "Complete Service", "Report Issue"

---

## 3. Update Service Status

### Start Service (Change status to "in-progress")

**Endpoint**: `PUT /api/engineering-services/:id`

**Headers**:
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "in-progress",
  "conditionBefore": "Machine displaying error code E402. Unable to start calibration sequence.",
  "notes": "Started diagnostics at 8:30 AM. Initial inspection shows possible sensor malfunction."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Service updated successfully",
  "data": {
    "_id": "service123",
    "status": "in-progress",
    "conditionBefore": "Machine displaying error code E402...",
    "notes": "Started diagnostics at 8:30 AM...",
    "updatedAt": "2025-01-15T08:35:00Z"
  }
}
```

### Implementation Example:
```javascript
const startService = async (serviceId) => {
  try {
    const token = await getStoredToken();
    
    const response = await fetch(
      `${API_BASE}/api/engineering-services/${serviceId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'in-progress',
          conditionBefore: conditionBeforeText,
          notes: `Started service at ${new Date().toLocaleString()}`
        })
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      Alert.alert('Success', 'Service started successfully');
      // Navigate to service work screen
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to start service');
  }
};
```

---

## 4. Complete Service (Submit Report)

### Update Service with Completion Details

**Endpoint**: `PUT /api/engineering-services/:id`

**Headers**:
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "completed",
  "conditionBefore": "Machine displaying error code E402. Unable to start calibration sequence. Sensor readings inconsistent.",
  "conditionAfter": "All systems operational. Error code cleared. Sensor replaced and calibrated. Machine passed all diagnostic tests.",
  "notes": "Completed maintenance:\n- Replaced faulty temperature sensor\n- Recalibrated all measurement parameters\n- Updated firmware to v2.3.1\n- Performed full system test\n- Trained staff on new features\n\nNext service recommended in 3 months.",
  "nextServiceDate": "2025-04-15T08:00:00Z",
  "otherPersonnel": ["Hospital technician: Mary Wanjiru (assisted with testing)"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Service updated successfully",
  "data": {
    "_id": "service123",
    "status": "completed",
    "conditionBefore": "Machine displaying error code E402...",
    "conditionAfter": "All systems operational...",
    "notes": "Completed maintenance...",
    "nextServiceDate": "2025-04-15T08:00:00Z",
    "otherPersonnel": ["Hospital technician: Mary Wanjiru"],
    "updatedAt": "2025-01-15T14:30:00Z"
  }
}
```

### Implementation Example (Service Completion Form):

**React Native Form Component**:
```javascript
const CompleteServiceScreen = ({ route, navigation }) => {
  const { serviceId } = route.params;
  const [conditionBefore, setConditionBefore] = useState('');
  const [conditionAfter, setConditionAfter] = useState('');
  const [notes, setNotes] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState(null);
  const [otherPersonnel, setOtherPersonnel] = useState('');
  const [loading, setLoading] = useState(false);

  const completeService = async () => {
    if (!conditionBefore.trim() || !conditionAfter.trim()) {
      Alert.alert('Error', 'Please fill in machine condition before and after');
      return;
    }

    setLoading(true);
    try {
      const token = await getStoredToken();
      
      const payload = {
        status: 'completed',
        conditionBefore: conditionBefore.trim(),
        conditionAfter: conditionAfter.trim(),
        notes: notes.trim(),
        otherPersonnel: otherPersonnel.trim() ? [otherPersonnel.trim()] : []
      };

      if (nextServiceDate) {
        payload.nextServiceDate = nextServiceDate.toISOString();
      }

      const response = await fetch(
        `${API_BASE}/api/engineering-services/${serviceId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'Service completed successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to complete service');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Condition Before Service *</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={4}
        value={conditionBefore}
        onChangeText={setConditionBefore}
        placeholder="Describe the machine condition before service..."
      />

      <Text style={styles.label}>Condition After Service *</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={4}
        value={conditionAfter}
        onChangeText={setConditionAfter}
        placeholder="Describe the machine condition after service..."
      />

      <Text style={styles.label}>Work Done / Notes</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={6}
        value={notes}
        onChangeText={setNotes}
        placeholder="Describe work performed, parts replaced, recommendations..."
      />

      <Text style={styles.label}>Other Personnel (Optional)</Text>
      <TextInput
        style={styles.input}
        value={otherPersonnel}
        onChangeText={setOtherPersonnel}
        placeholder="e.g., Hospital technician: John Doe"
      />

      <Text style={styles.label}>Next Service Date (Optional)</Text>
      <DatePicker
        date={nextServiceDate}
        onDateChange={setNextServiceDate}
      />

      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={completeService}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Submitting...' : 'Complete Service'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
```

---

## 5. Offline Support (Optional but Recommended)

Engineers may work in areas with poor connectivity. Implement offline support:

### Offline Data Storage:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save services for offline access
const cacheServices = async (services) => {
  await AsyncStorage.setItem('cached_services', JSON.stringify(services));
};

// Load cached services
const loadCachedServices = async () => {
  const cached = await AsyncStorage.getItem('cached_services');
  return cached ? JSON.parse(cached) : [];
};

// Queue service updates for later sync
const queueServiceUpdate = async (serviceId, updateData) => {
  const queue = await AsyncStorage.getItem('pending_updates') || '[]';
  const updates = JSON.parse(queue);
  
  updates.push({
    serviceId,
    updateData,
    timestamp: Date.now()
  });
  
  await AsyncStorage.setItem('pending_updates', JSON.stringify(updates));
};

// Sync pending updates when online
const syncPendingUpdates = async () => {
  const queue = await AsyncStorage.getItem('pending_updates') || '[]';
  const updates = JSON.parse(queue);
  
  for (const update of updates) {
    try {
      await fetch(`${API_BASE}/api/engineering-services/${update.serviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(update.updateData)
      });
    } catch (error) {
      console.error('Sync failed for update:', update);
      // Keep in queue for next sync attempt
    }
  }
  
  // Clear successfully synced updates
  await AsyncStorage.setItem('pending_updates', '[]');
};
```

---

## 6. App Screens & Navigation Flow

### Recommended Screen Structure:

1. **Login Screen**
   - Email/Password input
   - Remember me checkbox
   - Login button

2. **Dashboard/Home Screen**
   - Summary cards: Assigned, In Progress, Completed Today
   - Quick actions: View All, Today's Schedule
   - Recent services list

3. **Services List Screen**
   - Filterable list (by status, date)
   - Search by facility name
   - Pull-to-refresh
   - Pagination

4. **Service Detail Screen**
   - Full service information
   - Action buttons based on status:
     - Assigned → "Start Service"
     - In Progress → "Complete Service", "Update Progress"
     - Completed → View only

5. **Complete Service Screen**
   - Form with required fields
   - Photo upload (optional enhancement)
   - Submit button

6. **Profile Screen**
   - Engineer details
   - Logout button
   - Sync status (if offline mode)

### Navigation Example (React Navigation):
```javascript
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="ServicesList" component={ServicesListScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="CompleteService" component={CompleteServiceScreen} />
    </Stack.Navigator>
  );
}

function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Today" component={TodayScheduleScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

---

## 7. UI/UX Best Practices

### Status Color Coding:
```javascript
const getStatusColor = (status) => {
  switch(status) {
    case 'pending': return '#FFA500'; // Orange
    case 'assigned': return '#FFD700'; // Gold
    case 'in-progress': return '#008CF7'; // ACCORD Blue
    case 'completed': return '#28A745'; // Green
    case 'cancelled': return '#DC3545'; // Red
    default: return '#6C757D'; // Gray
  }
};
```

### Service Type Icons:
```javascript
const getServiceIcon = (serviceType) => {
  switch(serviceType) {
    case 'installation': return 'build-outline';
    case 'maintenance': return 'settings-outline';
    case 'service': return 'construct-outline';
    case 'repair': return 'hammer-outline';
    default: return 'briefcase-outline';
  }
};
```

### Loading States:
- Show skeleton screens while loading
- Use ActivityIndicator for button actions
- Implement pull-to-refresh

### Error Handling:
```javascript
const handleApiError = (error, response) => {
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired - redirect to login
      navigation.navigate('Login');
    } else if (response.status === 403) {
      Alert.alert('Access Denied', 'You do not have permission to perform this action');
    } else if (response.status === 404) {
      Alert.alert('Not Found', 'Service not found');
    } else {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }
};
```

---

## 8. Testing Checklist

### Engineer App Testing:
- [ ] Login with engineer credentials
- [ ] View assigned services list
- [ ] Filter services by status
- [ ] View service details
- [ ] Start a service (status → in-progress)
- [ ] Update service progress/notes
- [ ] Complete service with full report
- [ ] Submit report with all required fields
- [ ] Handle missing required fields (validation)
- [ ] Test offline mode (cache services, queue updates)
- [ ] Test sync when back online
- [ ] Logout and clear data
- [ ] Handle expired token (auto-refresh or re-login)
- [ ] Test on slow network
- [ ] Test with no network

---

## 9. API Error Responses

### Common Error Responses:

**Unauthorized (401)**:
```json
{
  "success": false,
  "message": "Authentication required or provide userId in body"
}
```

**Forbidden (403)**:
```json
{
  "success": false,
  "message": "Access denied"
}
```

**Not Found (404)**:
```json
{
  "success": false,
  "message": "Service not found"
}
```

**Validation Error (400)**:
```json
{
  "success": false,
  "message": "Facility name is required"
}
```

**Server Error (500)**:
```json
{
  "success": false,
  "message": "Failed to update service"
}
```

---

## 10. Future Enhancements

### Phase 2 Features:
1. **Photo Upload**
   - Add before/after photos to service reports
   - Endpoint: `POST /api/engineering-services/:id/photos`

2. **Real-time Notifications**
   - Push notifications when new service assigned
   - Socket.IO for live updates

3. **GPS Location Tracking**
   - Track engineer location during service
   - Integration with existing location tracking API

4. **Signature Capture**
   - Client signature on service completion
   - Store as image attachment

5. **Parts Inventory**
   - Track parts used during service
   - Integration with inventory system

6. **Time Tracking**
   - Auto-track time spent on each service
   - Generate timesheets

7. **Offline Maps**
   - Download facility locations for offline use
   - Navigation to facilities

---

## Quick Start Code Snippets

### Complete API Service Class (JavaScript/TypeScript):

```javascript
// api/engineeringService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.accord.com'; // Replace with your API URL

class EngineeringServiceAPI {
  async getToken() {
    return await AsyncStorage.getItem('accessToken');
  }

  async getUserId() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user)._id : null;
  }

  async getMyServices(status = null, page = 1, limit = 20) {
    const token = await this.getToken();
    const userId = await this.getUserId();
    
    let url = `${API_BASE}/api/engineering-services?engineerId=${userId}&page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return await response.json();
  }

  async getServiceById(serviceId) {
    const token = await this.getToken();
    
    const response = await fetch(
      `${API_BASE}/api/engineering-services/${serviceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return await response.json();
  }

  async startService(serviceId, conditionBefore, notes = '') {
    const token = await this.getToken();
    
    const response = await fetch(
      `${API_BASE}/api/engineering-services/${serviceId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'in-progress',
          conditionBefore,
          notes: notes || `Started at ${new Date().toLocaleString()}`
        })
      }
    );

    return await response.json();
  }

  async completeService(serviceId, data) {
    const token = await this.getToken();
    
    const payload = {
      status: 'completed',
      conditionBefore: data.conditionBefore,
      conditionAfter: data.conditionAfter,
      notes: data.notes,
      otherPersonnel: data.otherPersonnel || [],
      nextServiceDate: data.nextServiceDate || null
    };

    const response = await fetch(
      `${API_BASE}/api/engineering-services/${serviceId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    return await response.json();
  }

  async updateService(serviceId, updates) {
    const token = await this.getToken();
    
    const response = await fetch(
      `${API_BASE}/api/engineering-services/${serviceId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      }
    );

    return await response.json();
  }
}

export default new EngineeringServiceAPI();
```

### Usage Example:
```javascript
import EngineeringServiceAPI from './api/engineeringService';

// In your component
const loadServices = async () => {
  try {
    const result = await EngineeringServiceAPI.getMyServices('assigned');
    if (result.success) {
      setServices(result.data.docs);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const handleCompleteService = async () => {
  const data = {
    conditionBefore: 'Machine not working properly...',
    conditionAfter: 'All systems operational...',
    notes: 'Replaced sensor, calibrated...',
    nextServiceDate: '2025-04-15'
  };

  const result = await EngineeringServiceAPI.completeService(serviceId, data);
  if (result.success) {
    Alert.alert('Success', 'Service completed!');
  }
};
```

---

## Summary

This implementation guide provides everything needed to build the engineer mobile/web app:

1. **Authentication** - Login and token management
2. **View Services** - Fetch and display assigned services
3. **Service Details** - View full service information
4. **Update Status** - Start service, mark in-progress
5. **Complete Service** - Submit full service report with conditions and notes
6. **Offline Support** - Cache data and sync when online
7. **UI/UX Guidelines** - Color coding, icons, error handling
8. **Code Examples** - Ready-to-use API service class

Engineers can now:
- ✅ View all services assigned to them
- ✅ See service details (facility, machine, schedule)
- ✅ Start services and track progress
- ✅ Submit comprehensive service reports
- ✅ Work offline and sync later
- ✅ Get real-time updates

---

**Version**: 1.0  
**Date**: October 2025  
**Backend API**: ACCORD Engineering Services API  
**Author**: ACCORD Development Team
