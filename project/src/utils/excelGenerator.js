import XLSX from 'xlsx';
import logger from './logger.js';

/**
 * Generate Excel (XLSX) for weekly reports
 * @param {Object} data - Data containing users, visits, reports, and leads
 * @returns {Object} Workbook object
 */
export const generateWeeklyReportExcel = (data) => {
    try {
        const { weekStart, weekEnd, usersData } = data;

        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Summary
        // Aggregate top demanded product per region
        const regionProductMap = {};
        for (const userData of usersData) {
            const region = userData.user.region || 'Unknown';
            for (const visit of userData.visits) {
                if (visit.productsOfInterest && visit.productsOfInterest.length > 0) {
                    for (const product of visit.productsOfInterest) {
                        const key = region + '|' + (product.name || 'Unknown');
                        regionProductMap[key] = (regionProductMap[key] || 0) + 1;
                    }
                }
            }
        }
        // Find top product per region
        const topProductsByRegion = {};
        for (const key in regionProductMap) {
            const [region, product] = key.split('|');
            if (!topProductsByRegion[region] || regionProductMap[key] > topProductsByRegion[region].count) {
                topProductsByRegion[region] = { product, count: regionProductMap[key] };
            }
        }

        // Collect improvement feedback (assuming userData.user.improvementFeedback exists)
        const improvementFeedback = usersData.map(u => [u.user.employeeId, `${u.user.firstName} ${u.user.lastName}`, u.user.improvementFeedback || '']).filter(row => row[2]);

        const summaryData = [
            ['Weekly Activity Report'],
            [''],
            ['Week Start', new Date(weekStart).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
            ['Week End', new Date(weekEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
            ['Generated At', new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }) + ' EAT'],
            ['Total Users', usersData.length],
            ['Total Visits', usersData.reduce((sum, u) => sum + u.visits.length, 0)],
            ['Total Reports', usersData.reduce((sum, u) => sum + u.reports.length, 0)],
            // No Total Leads
            [''],
            ['Top Demanded Product in your region'],
            ['Region', 'Product', 'Count'],
            ...Object.entries(topProductsByRegion).map(([region, obj]) => [region, obj.product, obj.count]),
            [''],
            ['What you would love to be improved the coming week'],
            ['Employee ID', 'Name', 'Feedback'],
            ...improvementFeedback
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Sheet 2: User Information
        const userHeaders = ['Employee ID', 'Name', 'Email', 'Role', 'Region', 'Territory', 'Visits', 'Reports', 'Leads'];
        const userRows = usersData.map(userData => [
            userData.user.employeeId || 'N/A',
            `${userData.user.firstName} ${userData.user.lastName}`,
            userData.user.email || 'N/A',
            userData.user.role || 'N/A',
            userData.user.region || 'N/A',
            userData.user.territory || 'N/A',
            userData.visits.length,
            userData.reports.length,
            userData.leads.length
        ]);
        const userSheet = XLSX.utils.aoa_to_sheet([userHeaders, ...userRows]);
        XLSX.utils.book_append_sheet(workbook, userSheet, 'Users');

        // Sheet 3: All Visits
        const visitHeaders = [
            'Employee ID', 'Employee Name', 'Visit ID', 'Date', 'Start Time', 'End Time', 'Duration (min)',
            'Client Name', 'Client Type', 'Client Level', 'Location',
            'Visit Purpose', 'Visit Outcome', 'Contacts Count', 'Products of Interest',
            'Competitor Activity', 'Market Insights', 'Notes', 'Follow-up Required'
        ];
        const visitRows = [];
        for (const userData of usersData) {
            for (const visit of userData.visits) {
                visitRows.push([
                    userData.user.employeeId || 'N/A',
                    `${userData.user.firstName} ${userData.user.lastName}`,
                    visit.visitId || visit._id?.toString() || 'N/A',
                    visit.date ? new Date(visit.date).toLocaleDateString() : 'N/A',
                    visit.startTime ? new Date(visit.startTime).toLocaleTimeString() : 'N/A',
                    visit.endTime ? new Date(visit.endTime).toLocaleTimeString() : 'N/A',
                    visit.duration || 'N/A',
                    visit.client?.name || 'N/A',
                    visit.client?.type || 'N/A',
                    visit.client?.level || 'N/A',
                    visit.client?.location || 'N/A',
                    visit.visitPurpose || 'N/A',
                    visit.visitOutcome || 'N/A',
                    visit.contacts?.length || 0,
                    visit.productsOfInterest?.map(p => p.name).join(', ') || 'N/A',
                    visit.competitorActivity || 'N/A',
                    visit.marketInsights || 'N/A',
                    visit.notes || 'N/A',
                    visit.isFollowUpRequired ? 'Yes' : 'No'
                ]);
            }
        }
        const visitSheet = XLSX.utils.aoa_to_sheet([visitHeaders, ...visitRows]);
        XLSX.utils.book_append_sheet(workbook, visitSheet, 'Visits');

        // Sheet 4: Visit Contacts
        const contactHeaders = [
            'Employee ID', 'Employee Name', 'Visit ID', 'Visit Date',
            'Contact Name', 'Contact Role', 'Phone', 'Email', 'Department',
            'Follow-up Required', 'Follow-up Date', 'Priority', 'Notes'
        ];
        const contactRows = [];
        for (const userData of usersData) {
            for (const visit of userData.visits) {
                if (visit.contacts && visit.contacts.length > 0) {
                    for (const contact of visit.contacts) {
                        contactRows.push([
                            userData.user.employeeId || 'N/A',
                            `${userData.user.firstName} ${userData.user.lastName}`,
                            visit.visitId || visit._id?.toString() || 'N/A',
                            visit.date ? new Date(visit.date).toLocaleDateString() : 'N/A',
                            contact.name || 'N/A',
                            contact.role || 'N/A',
                            contact.phone || 'N/A',
                            contact.email || 'N/A',
                            contact.department || 'N/A',
                            contact.followUpRequired ? 'Yes' : 'No',
                            contact.followUpDate ? new Date(contact.followUpDate).toLocaleDateString() : 'N/A',
                            contact.priority || 'N/A',
                            contact.notes || 'N/A'
                        ]);
                    }
                }
            }
        }
        const contactSheet = XLSX.utils.aoa_to_sheet([contactHeaders, ...contactRows]);
        XLSX.utils.book_append_sheet(workbook, contactSheet, 'Visit Contacts');

        // Sheet 5: Equipment (Existing & Requested)
        const equipmentHeaders = [
            'Employee ID', 'Employee Name', 'Visit ID', 'Visit Date', 'Type',
            'Equipment Name', 'Model', 'Brand', 'Quantity', 'Condition',
            'Estimated Budget', 'Urgency', 'Expected Purchase Period'
        ];
        const equipmentRows = [];
        for (const userData of usersData) {
            for (const visit of userData.visits) {
                // Existing Equipment
                if (visit.existingEquipment && visit.existingEquipment.length > 0) {
                    for (const equipment of visit.existingEquipment) {
                        equipmentRows.push([
                            userData.user.employeeId || 'N/A',
                            `${userData.user.firstName} ${userData.user.lastName}`,
                            visit.visitId || visit._id?.toString() || 'N/A',
                            visit.date ? new Date(visit.date).toLocaleDateString() : 'N/A',
                            'Existing',
                            equipment.name || 'N/A',
                            equipment.model || 'N/A',
                            equipment.brand || 'N/A',
                            equipment.quantity || 'N/A',
                            equipment.condition || 'N/A',
                            'N/A',
                            'N/A',
                            'N/A'
                        ]);
                    }
                }
                // Requested Equipment
                if (visit.requestedEquipment && visit.requestedEquipment.length > 0) {
                    for (const equipment of visit.requestedEquipment) {
                        equipmentRows.push([
                            userData.user.employeeId || 'N/A',
                            `${userData.user.firstName} ${userData.user.lastName}`,
                            visit.visitId || visit._id?.toString() || 'N/A',
                            visit.date ? new Date(visit.date).toLocaleDateString() : 'N/A',
                            'Requested',
                            equipment.name || 'N/A',
                            equipment.model || 'N/A',
                            'N/A',
                            equipment.quantity || 'N/A',
                            'N/A',
                            equipment.estimatedBudget || 'N/A',
                            equipment.urgency || 'N/A',
                            equipment.expectedPurchasePeriod || 'N/A'
                        ]);
                    }
                }
            }
        }
        const equipmentSheet = XLSX.utils.aoa_to_sheet([equipmentHeaders, ...equipmentRows]);
        XLSX.utils.book_append_sheet(workbook, equipmentSheet, 'Equipment');

        // Sheet 6: Weekly Reports
        const reportHeaders = [
            'Employee ID', 'Employee Name', 'Report ID', 'Week Start', 'Week End',
            'Status', 'Is Draft', 'Submitted At', 'Admin Notes'
        ];
        const reportRows = [];
        for (const userData of usersData) {
            for (const report of userData.reports) {
                reportRows.push([
                    userData.user.employeeId || 'N/A',
                    `${userData.user.firstName} ${userData.user.lastName}`,
                    report._id?.toString() || 'N/A',
                    report.weekStart ? new Date(report.weekStart).toLocaleDateString() : 'N/A',
                    report.weekEnd ? new Date(report.weekEnd).toLocaleDateString() : 'N/A',
                    report.status || 'N/A',
                    report.isDraft ? 'Yes' : 'No',
                    report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A',
                    report.adminNotes || 'N/A'
                ]);
            }
        }
        const reportSheet = XLSX.utils.aoa_to_sheet([reportHeaders, ...reportRows]);
        XLSX.utils.book_append_sheet(workbook, reportSheet, 'Weekly Reports');

        // Sheet 7: Report Sections
        const sectionHeaders = [
            'Employee ID', 'Employee Name', 'Report ID', 'Section ID', 'Section Title', 'Content'
        ];
        const sectionRows = [];
        for (const userData of usersData) {
            for (const report of userData.reports) {
                if (report.content && report.content.sections) {
                    for (const section of report.content.sections) {
                        sectionRows.push([
                            userData.user.employeeId || 'N/A',
                            `${userData.user.firstName} ${userData.user.lastName}`,
                            report._id?.toString() || 'N/A',
                            section.id || 'N/A',
                            section.title || 'N/A',
                            section.content || 'N/A'
                        ]);
                    }
                }
            }
        }
        const sectionSheet = XLSX.utils.aoa_to_sheet([sectionHeaders, ...sectionRows]);
        XLSX.utils.book_append_sheet(workbook, sectionSheet, 'Report Sections');

        // Sheet 8: Leads
        const leadHeaders = [
            'Employee ID', 'Employee Name', 'Lead ID', 'Facility Name', 'Facility Type', 'Location',
            'Lead Status', 'Lead Source', 'Contact Name', 'Contact Role', 'Contact Phone', 'Contact Email',
            'Equipment Name', 'Equipment Category', 'Quantity',
            'Budget Amount', 'Currency', 'Expected Purchase Date', 'Urgency',
            'Competitor Analysis', 'Pain Points', 'Notes', 'Created At'
        ];
        const leadRows = [];
        for (const userData of usersData) {
            for (const lead of userData.leads) {
                leadRows.push([
                    userData.user.employeeId || 'N/A',
                    `${userData.user.firstName} ${userData.user.lastName}`,
                    lead._id?.toString() || 'N/A',
                    lead.facilityName || 'N/A',
                    lead.facilityType || 'N/A',
                    lead.location || 'N/A',
                    lead.leadStatus || 'N/A',
                    lead.leadSource || 'N/A',
                    lead.contactPerson?.name || 'N/A',
                    lead.contactPerson?.role || 'N/A',
                    lead.contactPerson?.phone || 'N/A',
                    lead.contactPerson?.email || 'N/A',
                    lead.equipmentOfInterest?.name || 'N/A',
                    lead.equipmentOfInterest?.category || 'N/A',
                    lead.equipmentOfInterest?.quantity || 'N/A',
                    lead.budget?.amount || 'N/A',
                    lead.budget?.currency || 'KES',
                    lead.timeline?.expectedPurchaseDate ? new Date(lead.timeline.expectedPurchaseDate).toLocaleDateString() : 'N/A',
                    lead.timeline?.urgency || 'N/A',
                    lead.competitorAnalysis || 'N/A',
                    lead.additionalInfo?.painPoints || 'N/A',
                    lead.additionalInfo?.notes || 'N/A',
                    lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'N/A'
                ]);
            }
        }
        const leadSheet = XLSX.utils.aoa_to_sheet([leadHeaders, ...leadRows]);
        XLSX.utils.book_append_sheet(workbook, leadSheet, 'Leads');

        return workbook;
    } catch (error) {
        logger.error('Excel generation error:', error);
        throw error;
    }
};

/**
 * Write workbook to file
 * @param {Object} workbook - XLSX workbook object
 * @param {string} filepath - Path to save the file
 */
export const writeExcelFile = (workbook, filepath) => {
    XLSX.writeFile(workbook, filepath);
};

/**
 * Generate monthly sales Excel for a single user
 * @param {Object} params
 * @param {Date} params.monthStart
 * @param {Date} params.monthEnd
 * @param {Object} params.userData - { user: {...}, visits: [...], leads: [...] }
 * @returns {Object} workbook
 */
export const generateMonthlySalesExcel = ({ monthStart, monthEnd, userData }) => {
    try {
        const workbook = XLSX.utils.book_new();

        const user = userData.user || {};
        const visits = userData.visits || [];
        const leads = userData.leads || [];

        const monthRange = `${new Date(monthStart).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - ${new Date(monthEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;

        // Summary sheet
        const summaryData = [
            ['Monthly Activity Report'],
            [''],
            ['User', `${user.firstName || ''} ${user.lastName || ''}`],
            ['Email', user.email || 'N/A'],
            ['Month Range', monthRange],
            ['Generated At', new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }) + ' EAT'],
            ['Total Visits', visits.length],
            ['Total Leads', leads.length],
            ['Unique Clients Met', Array.from(new Set(visits.map(v => v.client?.name).filter(Boolean))).length],
            ['Total Contacts Met', visits.reduce((s, v) => s + (v.contacts ? v.contacts.length : 0), 0)]
        ];
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

        // Visits sheet (exclude start/end times and duration per request)
        const visitHeaders = ['Date', 'Client Name', 'Client Type', 'Location', 'Visit Purpose', 'Visit Outcome', 'Contacts Count', 'Contact Phones', 'Products Of Interest'];
        const visitRows = visits.map(visit => {
            const contactPhones = (visit.contacts || []).map(c => c.phone).filter(Boolean).join(', ');
            const products = (visit.productsOfInterest || []).map(p => (p.name || p)).join(', ');
            return [
                visit.date ? new Date(visit.date).toLocaleDateString() : 'N/A',
                visit.client?.name || 'N/A',
                visit.client?.type || 'N/A',
                visit.client?.location || 'N/A',
                visit.visitPurpose || 'N/A',
                visit.visitOutcome || 'N/A',
                (visit.contacts || []).length,
                contactPhones || 'N/A',
                products || 'N/A'
            ];
        });
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([visitHeaders, ...visitRows]), 'Visits');

        // Leads sheet
        const leadHeaders = ['Created At', 'Facility Name', 'Location', 'Lead Status', 'Contact Name', 'Contact Phone', 'Equipment Of Interest', 'Budget', 'Expected Purchase Date', 'Urgency', 'Notes'];
        const leadRows = leads.map(lead => {
            const equipment = lead.equipmentOfInterest ? (lead.equipmentOfInterest.name || lead.equipmentOfInterest) : 'N/A';
            const budget = lead.budget ? (lead.budget.amount ? `${lead.budget.amount}` : 'N/A') : 'N/A';
            const expected = lead.timeline?.expectedPurchaseDate ? new Date(lead.timeline.expectedPurchaseDate).toLocaleDateString() : 'N/A';
            return [
                lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'N/A',
                lead.facilityName || 'N/A',
                lead.location || 'N/A',
                lead.leadStatus || 'N/A',
                lead.contactPerson?.name || 'N/A',
                lead.contactPerson?.phone || 'N/A',
                equipment,
                budget,
                expected,
                lead.timeline?.urgency || 'N/A',
                lead.additionalInfo?.notes || lead.notes || 'N/A'
            ];
        });
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([leadHeaders, ...leadRows]), 'Leads');

        // Unique Clients sheet
        const uniqueClients = Array.from(new Set(visits.map(v => v.client?.name).filter(Boolean)));
        const clientRows = uniqueClients.map(name => [name]);
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Client Name'], ...clientRows]), 'Clients');

        return workbook;
    } catch (error) {
        logger.error('Monthly Excel generation error:', error);
        throw error;
    }
};
