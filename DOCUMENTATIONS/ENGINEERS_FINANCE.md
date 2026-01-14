# Engineers Finance (Engineering Pricing) Documentation

## Overview
This document outlines the "Engineers Finance" feature, technically implemented as **Engineering Pricing**. This feature allows engineers to submit pricing claims for their activities (installation, maintenance, service, previsit), including fares and other charges. Admins and Managers can review, update, and manage these records.

## Authentication
All endpoints require a valid Bearer token.
- **Engineers**: Can create records and view their own records.
- **Admins/Managers**: Can view all records, update, and delete records.

## Base URL
```
https://app.codewithseth.co.ke/api
```

---

## 1. User (Engineer) Guide

### 1.1 Submit Pricing Claim
Engineers use this endpoint to record expenses and pricing for a specific activity.

- **Endpoint**: `POST /api/engineering-pricing`
- **Access**: Engineer, Manager, Admin

**Request Body:**
```json
{
  "engineerId": "65a1b2c3d4e5f6g7h8i9j0k1", // Required: ID of the engineer (usually self)
  "activityType": "installation",           // Required: 'installation', 'maintenance', 'service', 'previsit'
  "fare": 1500,                             // Required: Transport cost
  "location": "Nairobi CBD",                // Required if activityType is 'installation'
  "facility": "Kenyatta National Hospital", // Optional
  "machine": "X-Ray Model 500",             // Optional
  "otherCharges": [                         // Optional
    {
      "description": "Lunch",
      "amount": 500
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Pricing record created successfully",
  "data": {
    "_id": "...",
    "engineerId": "...",
    "activityType": "installation",
    "fare": 1500,
    "otherCharges": [...],
    "createdAt": "2025-11-30T10:00:00.000Z"
  }
}
```

### 1.2 View My Pricing History
Engineers can view their own pricing records.

- **Endpoint**: `GET /api/engineering-pricing`
- **Access**: Authenticated User

**Query Parameters:**
- `engineerId`: Filter by engineer ID (e.g., your own ID).
- `activityType`: Filter by activity type.
- `fromDate`: Filter records created after this date (ISO format).
- `toDate`: Filter records created before this date (ISO format).
- `page`: Page number (default 1).
- `limit`: Items per page (default 50).

**Example Request:**
```http
GET /api/engineering-pricing?engineerId=MY_ID&page=1
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 50,
    "totalDocs": 10
  }
}
```

---

## 2. Admin / Manager Guide

### 2.1 View All Pricing Records
Admins can view pricing records for all engineers.

- **Endpoint**: `GET /api/engineering-pricing`
- **Access**: Authenticated User (Admins see all if no filter applied)

**Query Parameters:**
- `engineerId`: Filter by specific engineer.
- `activityType`: Filter by activity type.
- `fromDate` / `toDate`: Date range filtering.

### 2.2 Update Pricing Record
Admins can update details of a pricing record (e.g., correcting amounts).

- **Endpoint**: `PUT /api/engineering-pricing/:pricingId`
- **Access**: Admin, Manager

**Request Body (Partial updates allowed):**
```json
{
  "fare": 2000,
  "facility": "Updated Facility Name"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Pricing record updated successfully",
  "data": { ... }
}
```

### 2.3 Delete Pricing Record
Admins can remove a pricing record.

- **Endpoint**: `DELETE /api/engineering-pricing/:pricingId`
- **Access**: Admin, Manager

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Pricing record deleted successfully"
}
```

### 2.4 Get Single Pricing Record
View details of a specific record.

- **Endpoint**: `GET /api/engineering-pricing/:pricingId`
- **Access**: Authenticated User

---

## 3. Data Model

### EngineeringPricing Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `engineerId` | ObjectId (User) | Yes | Reference to the engineer. |
| `activityType` | String | Yes | Enum: `installation`, `maintenance`, `service`, `previsit`. |
| `fare` | Number | Yes | Transport cost (min 0). |
| `location` | String | Conditional | Required if `activityType` is `installation`. |
| `facility` | String | No | Name of the facility visited. |
| `machine` | String | No | Details of the machine worked on. |
| `otherCharges` | Array | No | List of additional expenses. |
| `otherCharges[].description` | String | Yes | Description of the charge. |
| `otherCharges[].amount` | Number | Yes | Amount of the charge. |
| `createdBy` | ObjectId (User) | No | User who created the record. |
| `createdAt` | Date | Auto | Timestamp of creation. |
| `updatedAt` | Date | Auto | Timestamp of last update. |
