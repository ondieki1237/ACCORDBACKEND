# ACCORD Backend - Admin API Documentation Index

**Date:** January 3, 2026  
**Version:** 1.0  
**Base URL:** `https://app.codewithseth.co.ke`  
**Documentation Status:** ✅ Complete

---

## 📚 Documentation Files

This is the master index for all Admin API documentation. Each document covers a specific functional area of the admin system.

### Core Documentation

1. **[Admin API Overview & Authentication](./ADMIN_API_01_OVERVIEW.md)**
   - Authentication flow
   - Authorization roles
   - Common patterns
   - Error handling
   - Rate limiting

### Functional Area Documentation

2. **[User Management APIs](./ADMIN_API_02_USERS.md)**
   - Create users (all roles)
   - List users
   - Update users
   - Delete users
   - User analytics

3. **[Reports Management APIs](./ADMIN_API_03_REPORTS.md)**
   - List all reports
   - View report details
   - Approve/reject reports
   - Bulk report operations
   - Report statistics

4. **[Quotations Management APIs](./ADMIN_API_04_QUOTATIONS.md)**
   - List quotations
   - View quotation details
   - Respond to quotations
   - Update quotation status
   - Quotation statistics

5. **[Visits Management APIs](./ADMIN_API_05_VISITS.md)**
   - List all visits
   - View visit details
   - Daily activities
   - Visit summary
   - Delete visits

6. **[Leads Management APIs](./ADMIN_API_06_LEADS.md)**
   - List all leads
   - View lead details
   - Update lead status
   - Lead history timeline
   - Delete leads
   - Lead diagnostics

7. **[Machines Management APIs](./ADMIN_API_07_MACHINES.md)**
   - Create machines
   - Bulk create machines
   - List machines
   - Update machines
   - Delete machines
   - Service due reports

8. **[Consumables Management APIs](./ADMIN_API_08_CONSUMABLES.md)**
   - Create consumables
   - List consumables
   - Update consumables
   - Delete consumables
   - Category management

9. **[Analytics & Dashboard APIs](./ADMIN_API_10_ANALYTICS.md)** ✅
    - Sales analytics by user
    - Performance metrics
    - Revenue tracking
    - Time series data
    - Top clients analysis

---

## 🔑 Quick Reference

### Base URLs
```
Production: https://app.codewithseth.co.ke
Local Dev:  http://localhost:4500
```

### Authentication Header
```http
Authorization: Bearer <access_token>
```

### Admin Role Required
Most endpoints require `admin` or `manager` role. Specific requirements are documented in each API file.

### Common Response Format
```json
{
  "success": true|false,
  "message": "Description",
  "data": { /* Response data */ }
}
```

### Pagination Format
```json
{
  "docs": [],
  "totalDocs": 100,
  "limit": 20,
  "page": 1,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

---

## 📊 API Statistics

| Category | Endpoints | Status | Link |
|----------|-----------|--------|------|
| User Management | 3 | ✅ Complete | [View Docs](./ADMIN_API_02_USERS.md) |
| Reports | 5 | ✅ Complete | [View Docs](./ADMIN_API_03_REPORTS.md) |
| Quotations | 7 | ✅ Complete | [View Docs](./ADMIN_API_04_QUOTATIONS.md) |
| Visits | 5 | ✅ Complete | [View Docs](./ADMIN_API_05_VISITS.md) |
| Leads | 8 | ✅ Complete | [View Docs](./ADMIN_API_06_LEADS.md) |
| Machines | 8 | ✅ Complete | [View Docs](./ADMIN_API_07_MACHINES.md) |
| Consumables | 4 | ✅ Complete | [View Docs](./ADMIN_API_08_CONSUMABLES.md) |
| Analytics | 1 | ✅ Complete | [View Docs](./ADMIN_API_10_ANALYTICS.md) |
| **Total Documented** | **41** | **100%** | **9 Documentation Files** |
| Facilities | 4 | Admin/Manager |
| **Total** | **69** | - |

---

## 🎯 Common Admin Tasks

### Creating a New User
→ See [User Management APIs](./ADMIN_API_02_USERS.md#create-user)

### Approving a Report
→ See [Reports Management APIs](./ADMIN_API_03_REPORTS.md#update-report-status)

### Responding to a Quotation
→ See [Quotations Management APIs](./ADMIN_API_04_QUOTATIONS.md#respond-to-quotation)

### Assigning an Engineer
→ See [Engineering Services APIs](./ADMIN_API_09_ENGINEERING.md#assign-service-to-engineer)

### Viewing Analytics
→ See [Analytics & Dashboard APIs](./ADMIN_API_10_ANALYTICS.md#dashboard-overview)

---

## 🔐 Role Permissions Summary

| Role | Access Level | Description |
|------|-------------|-------------|
| **admin** | Full Access | All admin endpoints, can delete users |
| **manager** | Most Access | All admin endpoints except user deletion |
| **sales** | Limited | Own data only, no admin access |
| **engineer** | Limited | Assigned services only, no admin access |

---

## 🚀 Getting Started

1. **Authenticate**: Use `/api/auth/login` to get access token
2. **Choose Documentation**: Select the relevant API document from the list above
3. **Test Endpoints**: Use the examples provided in each document
4. **Handle Errors**: Follow error handling patterns in Overview document

---

## 📞 Support

- **Email**: info@accordmedical.co.ke
- **Technical Issues**: Check logs in `/project/logs/`
- **API Status**: `GET /api/health`

---

## 📝 Document Versions

| Document | Version | Last Updated |
|----------|---------|--------------|
| Overview | 1.0 | Jan 3, 2026 |
| Users | 1.0 | Jan 3, 2026 |
| Reports | 1.0 | Jan 3, 2026 |
| Quotations | 1.0 | Jan 3, 2026 |
| Visits | 1.0 | Jan 3, 2026 |
| Leads | 1.0 | Jan 3, 2026 |
| Machines | 1.0 | Jan 3, 2026 |
| Consumables | 1.0 | Jan 3, 2026 |
| Engineering | 1.0 | Jan 3, 2026 |
| Analytics | 1.0 | Jan 3, 2026 |
| Orders | 1.0 | Jan 3, 2026 |
| Facilities | 1.0 | Jan 3, 2026 |

---

**Last Updated:** January 3, 2026  
**Maintained By:** Accord Medical Development Team
