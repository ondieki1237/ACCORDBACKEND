# Sales Visit Form Updates - Backend Implementation Guide

**Date:** February 5, 2026  
**Status:** ✅ Frontend Changes Complete  
**Impact:** Sales Team Visit Recording

---

## Summary of Changes

The sales visit form has been updated to support multi-channel customer interactions (phone, email, in-person) instead of only physical visits. The following changes have been made:

---

## 1. New Visit Purpose Options

### Added to Visit Purpose Dropdown:
- **Telesales** (value: `telesales`) - 📱 Phone/remote sales calls
- **Quotation Followup** (value: `quotation_followup`) - 📋 Follow-up on submitted quotations
- **Company Introduction** (value: `company_introduction`) - 🏢 Initial company/facility introduction
- **Debt Collection** (value: `debt_collection`) - 💳 Payment/debt follow-up calls

### Existing Purposes Retained:
- Demo
- Follow Up
- Installation
- Maintenance
- Consultation
- Sales
- Other

### Database Field:
```typescript
visitPurpose: string // Enum values: "demo" | "telesales" | "quotation_followup" | "company_introduction" | "debt_collection" | "followup" | "installation" | "maintenance" | "consultation" | "sales" | "other"
```

---

## 2. Section Label Changes

### Before → After

| Before | After | Reason |
|--------|-------|--------|
| "Visit Outcome & Follow-Up" | "The Outcome" | Reflects interaction outcome, not just physical visit |
| "People Met" | "Persons in Contact" | Includes phone, email, and in-person interactions |

### Description Updates

| Field | Old Description | New Description |
|-------|-----------------|-----------------|
| **The Outcome** | "What is the goal and result of this visit?" | "What was the outcome of this interaction?" |
| **Persons in Contact** | "Who did you meet with? (At least one required)" | "Who did you interact with? (At least one required)" |

---

## 3. API/Database Implications

### No Breaking Changes
- The underlying data structure remains identical
- Field names in the API request body have NOT changed
- The backend does NOT need modifications to accept these values

### New Values to Accept
The backend should add these enum values to the `visitPurpose` field validation:

```javascript
// Existing validation
const validPurposes = [
  'demo',
  'followup',
  'installation',
  'maintenance',
  'consultation',
  'sales',
  'other',
  // NEW VALUES - add these
  'telesales',
  'quotation_followup',
  'company_introduction',
  'debt_collection'
];
```

### Request Payload Example

```json
{
  "date": "2026-02-05",
  "client": {
    "name": "Nairobi General Hospital",
    "type": "hospital",
    "location": "Nairobi"
  },
  "visitPurpose": "telesales",
  "visitOutcome": "successful",
  "contacts": [
    {
      "name": "Dr. John Doe",
      "role": "doctor",
      "phone": "+254712345678",
      "email": "john@hospital.com"
    }
  ],
  "isFollowUpRequired": true,
  "notes": "Discussed pricing via phone call"
}
```

---

## 4. Backend Validation Updates Required

### Update Visit Schema Validation

```javascript
// Node.js / Express example
const visitSchema = new Schema({
  // ... other fields ...
  
  visitPurpose: {
    type: String,
    enum: [
      'demo',
      'telesales',              // NEW
      'quotation_followup',     // NEW
      'company_introduction',   // NEW
      'debt_collection',        // NEW
      'followup',
      'installation',
      'maintenance',
      'consultation',
      'sales',
      'other'
    ],
    required: true
  },
  
  // ... other fields ...
});
```

### Similar Update for Other Frameworks

**Django:**
```python
VISIT_PURPOSE_CHOICES = [
    ('demo', 'Demo'),
    ('telesales', 'Telesales'),  # NEW
    ('quotation_followup', 'Quotation Followup'),  # NEW
    ('company_introduction', 'Company Introduction'),  # NEW
    ('debt_collection', 'Debt Collection'),  # NEW
    ('followup', 'Follow Up'),
    ('installation', 'Installation'),
    ('maintenance', 'Maintenance'),
    ('consultation', 'Consultation'),
    ('sales', 'Sales'),
    ('other', 'Other'),
]

visit_purpose = models.CharField(
    max_length=20,
    choices=VISIT_PURPOSE_CHOICES,
    required=True
)
```

**MongoDB:**
```javascript
{
  visitPurpose: {
    type: String,
    enum: ['demo', 'telesales', 'quotation_followup', 'company_introduction', 'debt_collection', 'followup', 'installation', 'maintenance', 'consultation', 'sales', 'other'],
    required: true
  }
}
```

---

## 5. Frontend Source Code

### File Modified
- **Path:** `components/visits/create-visit-form.tsx`
- **Lines Changed:** 536-554 (Visit Purpose select options), 760-778 (Outcome section header), 821-834 (Persons in Contact header)

### Purpose Values in Frontend
The frontend sends these exact values for the new purposes:
- `telesales`
- `quotation_followup`
- `company_introduction`
- `debt_collection`

---

## 6. Analytics & Reporting Impact

With the new visit purposes, you can now segment and analyze:
- **Telesales efficiency:** Track phone-based sales activities
- **Quotation follow-ups:** Monitor quote-to-closure conversion
- **Company introductions:** Measure new prospect engagement
- **Debt collection:** Track payment follow-up activities

---

## 7. Deployment Checklist

- [ ] Update Visit/Visit schema to include new enum values
- [ ] Update API request validation to accept new `visitPurpose` values
- [ ] Update database enum constraints (if using strict enums)
- [ ] Update API documentation with new visit purposes
- [ ] Add tests for new visit purpose values
- [ ] Update admin panel/dashboard filters if they reference visit purposes
- [ ] Communicate changes to sales team via in-app messaging
- [ ] Monitor API logs for proper acceptance of new values

---

## 8. No Breaking Changes

✅ All existing visit records remain valid  
✅ Old visit purposes continue to work  
✅ No database migration required  
✅ Backward compatible with existing API clients  

---

## 9. Questions & Support

- **Frontend:** Form submission with new purposes → `POST /api/visits`
- **Validation:** Backend should accept all 11 visit purpose values
- **Storage:** Store as-is in database (string/enum)
- **Reporting:** Can filter/group visits by new purpose values

---

**Next Steps:**
1. Update backend Visit schema validation
2. Deploy backend changes
3. Test with new visit purpose values
4. Monitor for errors in logs
5. Update admin panel if needed

