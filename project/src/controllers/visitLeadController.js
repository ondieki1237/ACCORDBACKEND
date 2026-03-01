import Visit from '../models/Visit.js';
import Lead from '../models/Lead.js';

// POST /api/visits/:visitId/convert-to-lead
export const convertVisitToLead = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const { expectedPurchaseDate } = req.body;
    if (!expectedPurchaseDate) {
      return res.status(400).json({ success: false, message: 'Expected purchase date is required.' });
    }
    const visit = await Visit.findById(visitId).lean();
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found.' });
    }
    // Map visit fields to lead fields, including all available contact fields
    let contactPerson = undefined;
    if (visit.contacts && visit.contacts.length > 0) {
      const c = visit.contacts[0];
      contactPerson = {
        name: c.name,
        role: c.role,
        phone: c.phone,
        email: c.email,
        department: c.department,
        notes: c.notes
      };
    }
    let budget = '';
    if (visit.productsOfInterest && visit.productsOfInterest.length > 0) {
      const b = visit.productsOfInterest[0].estimatedBudget;
      budget = b !== undefined && b !== null ? String(b) : '';
    }
    const leadData = {
      facilityName: visit.client?.name || '',
      facilityType: visit.client?.type || '',
      location: visit.client?.location || '',
      contactPerson,
      hospitalLevel: visit.client?.level || '',
      equipmentName: visit.productsOfInterest && visit.productsOfInterest.length > 0 ? visit.productsOfInterest[0].name : '',
      budget,
      expectedPurchaseDate: expectedPurchaseDate,
      competitorAnalysis: '',
      leadSource: 'field-visit',
      leadStatus: 'new',
      statusHistory: [{ from: 'visit', to: 'new', date: new Date() }],
      createdFromVisit: visit._id,
      createdBy: visit.userId
    };
    // Save lead
    const lead = new Lead(leadData);
    await lead.save();
    res.status(201).json({ success: true, message: 'Visit converted to lead successfully.', data: lead });
  } catch (err) {
    next(err);
  }
};
