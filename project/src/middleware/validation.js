import { body, param, query, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

export const validateRegistration = [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'manager', 'sales', 'engineer']).withMessage('Invalid role'),
  body('region').notEmpty().trim().withMessage('Region is required'),
  body('department').optional().trim(),
  validate
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

export const validateTrail = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').optional().isISO8601().withMessage('Valid end time required'),
  body('path.coordinates').isArray({ min: 2 }).withMessage('At least 2 coordinates required'),
  body('path.coordinates.*.*').isFloat().withMessage('Coordinates must be numbers'),
  validate
];

export const validateVisit = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('client.name').notEmpty().trim().withMessage('Client name is required'),
  body('client.type').isIn(['hospital', 'clinic', 'pharmacy', 'lab', 'imaging_center', 'other']).withMessage('Invalid client type'),
  body('client.level').optional().customSanitizer(value => value === '' ? undefined : String(value)).isIn(['1', '2', '3', '4', '5', '6', 'not_applicable']).withMessage('Invalid facility level'),
  body('client.location').notEmpty().isString().withMessage('Client location is required'),
  body('visitPurpose').isIn(['demo', 'followup', 'installation', 'maintenance', 'consultation', 'sales', 'complaint', 'other', 'telesales', 'quotation_followup', 'company_introduction', 'debt_collection']).withMessage('Invalid visit purpose'),
  body('visitOutcome').optional().customSanitizer(value => value === '' ? undefined : value).isIn(['successful', 'pending', 'followup_required', 'no_interest', 'no_access']).withMessage('Invalid visit outcome'),
  body('contacts').optional().isArray().withMessage('Contacts must be an array'),
  body('contacts.*.name').optional().notEmpty().withMessage('Contact name is required'),
  body('contacts.*.role').optional().isIn(['doctor', 'nurse', 'admin', 'procurement', 'it_manager', 'ceo', 'pharmacist', 'other']).withMessage('Invalid contact role'),
  body('productsOfInterest').optional().isArray().withMessage('Products of interest must be an array'),
  body('productsOfInterest.*.name').optional().notEmpty().withMessage('Product name is required'),
  body('productsOfInterest.*.notes').optional().isString().withMessage('Product notes must be a string'),
  body('customData').optional().isString().withMessage('Custom data must be a string'),
  validate
];

export const validateOrder = [
  body('client.name').notEmpty().trim().withMessage('Client name is required'),
  body('client.type').isIn(['hospital', 'clinic', 'dispensary', 'pharmacy', 'laboratory', 'other']).withMessage('Invalid client type'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productName').notEmpty().withMessage('Product name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  validate
];

export const validateObjectId = (field) => [
  param(field).isMongoId().withMessage(`Invalid ${field}`),
  validate
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  // Allow larger page sizes for admin or bulk requests; frontend should still prefer reasonable page sizes.
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  validate
];

export const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('Valid start date required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date required'),
  validate
];