import logger from './logger.js';

/**
 * Generate XML for weekly reports
 * @param {Object} data - Data containing users, visits, reports, and leads
 * @returns {string} XML string
 */
export const generateWeeklyReportXML = (data) => {
    try {
        const { weekStart, weekEnd, usersData } = data;

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<WeeklyReport>\n';
        xml += `  <ReportMetadata>\n`;
        xml += `    <WeekStart>${weekStart}</WeekStart>\n`;
        xml += `    <WeekEnd>${weekEnd}</WeekEnd>\n`;
        xml += `    <GeneratedAt>${new Date().toISOString()}</GeneratedAt>\n`;
        xml += `    <TotalUsers>${usersData.length}</TotalUsers>\n`;
        xml += `  </ReportMetadata>\n`;
        xml += `  <Users>\n`;

        for (const userData of usersData) {
            xml += `    <User>\n`;
            xml += `      <UserInfo>\n`;
            xml += `        <EmployeeID>${escapeXML(userData.user.employeeId)}</EmployeeID>\n`;
            xml += `        <Name>${escapeXML(userData.user.firstName + ' ' + userData.user.lastName)}</Name>\n`;
            xml += `        <Email>${escapeXML(userData.user.email)}</Email>\n`;
            xml += `        <Role>${escapeXML(userData.user.role)}</Role>\n`;
            xml += `        <Region>${escapeXML(userData.user.region || 'N/A')}</Region>\n`;
            xml += `        <Territory>${escapeXML(userData.user.territory || 'N/A')}</Territory>\n`;
            xml += `      </UserInfo>\n`;

            // Daily Visits
            xml += `      <DailyVisits>\n`;
            xml += `        <TotalVisits>${userData.visits.length}</TotalVisits>\n`;

            for (const visit of userData.visits) {
                xml += `        <Visit>\n`;
                xml += `          <VisitID>${escapeXML(visit.visitId || visit._id.toString())}</VisitID>\n`;
                xml += `          <Date>${visit.date ? new Date(visit.date).toISOString() : 'N/A'}</Date>\n`;
                xml += `          <StartTime>${visit.startTime ? new Date(visit.startTime).toISOString() : 'N/A'}</StartTime>\n`;
                xml += `          <EndTime>${visit.endTime ? new Date(visit.endTime).toISOString() : 'N/A'}</EndTime>\n`;
                xml += `          <Duration>${visit.duration || 'N/A'}</Duration>\n`;

                xml += `          <Client>\n`;
                xml += `            <Name>${escapeXML(visit.client?.name || 'N/A')}</Name>\n`;
                xml += `            <Type>${escapeXML(visit.client?.type || 'N/A')}</Type>\n`;
                xml += `            <Level>${escapeXML(visit.client?.level || 'N/A')}</Level>\n`;
                xml += `            <Location>${escapeXML(visit.client?.location || 'N/A')}</Location>\n`;
                xml += `          </Client>\n`;

                xml += `          <VisitPurpose>${escapeXML(visit.visitPurpose || 'N/A')}</VisitPurpose>\n`;
                xml += `          <VisitOutcome>${escapeXML(visit.visitOutcome || 'N/A')}</VisitOutcome>\n`;

                // Contacts
                xml += `          <Contacts>\n`;
                if (visit.contacts && visit.contacts.length > 0) {
                    for (const contact of visit.contacts) {
                        xml += `            <Contact>\n`;
                        xml += `              <Name>${escapeXML(contact.name || 'N/A')}</Name>\n`;
                        xml += `              <Role>${escapeXML(contact.role || 'N/A')}</Role>\n`;
                        xml += `              <Phone>${escapeXML(contact.phone || 'N/A')}</Phone>\n`;
                        xml += `              <Email>${escapeXML(contact.email || 'N/A')}</Email>\n`;
                        xml += `              <Department>${escapeXML(contact.department || 'N/A')}</Department>\n`;
                        xml += `            </Contact>\n`;
                    }
                }
                xml += `          </Contacts>\n`;

                // Products of Interest
                xml += `          <ProductsOfInterest>\n`;
                if (visit.productsOfInterest && visit.productsOfInterest.length > 0) {
                    for (const product of visit.productsOfInterest) {
                        xml += `            <Product>\n`;
                        xml += `              <Name>${escapeXML(product.name || 'N/A')}</Name>\n`;
                        xml += `              <Notes>${escapeXML(product.notes || 'N/A')}</Notes>\n`;
                        xml += `            </Product>\n`;
                    }
                }
                xml += `          </ProductsOfInterest>\n`;

                // Existing Equipment
                xml += `          <ExistingEquipment>\n`;
                if (visit.existingEquipment && visit.existingEquipment.length > 0) {
                    for (const equipment of visit.existingEquipment) {
                        xml += `            <Equipment>\n`;
                        xml += `              <Name>${escapeXML(equipment.name || 'N/A')}</Name>\n`;
                        xml += `              <Model>${escapeXML(equipment.model || 'N/A')}</Model>\n`;
                        xml += `              <Brand>${escapeXML(equipment.brand || 'N/A')}</Brand>\n`;
                        xml += `              <Quantity>${equipment.quantity || 0}</Quantity>\n`;
                        xml += `              <Condition>${escapeXML(equipment.condition || 'N/A')}</Condition>\n`;
                        xml += `            </Equipment>\n`;
                    }
                }
                xml += `          </ExistingEquipment>\n`;

                // Requested Equipment
                xml += `          <RequestedEquipment>\n`;
                if (visit.requestedEquipment && visit.requestedEquipment.length > 0) {
                    for (const equipment of visit.requestedEquipment) {
                        xml += `            <Equipment>\n`;
                        xml += `              <Name>${escapeXML(equipment.name || 'N/A')}</Name>\n`;
                        xml += `              <Model>${escapeXML(equipment.model || 'N/A')}</Model>\n`;
                        xml += `              <Quantity>${equipment.quantity || 0}</Quantity>\n`;
                        xml += `              <EstimatedBudget>${equipment.estimatedBudget || 0}</EstimatedBudget>\n`;
                        xml += `              <Urgency>${escapeXML(equipment.urgency || 'N/A')}</Urgency>\n`;
                        xml += `              <ExpectedPurchasePeriod>${escapeXML(equipment.expectedPurchasePeriod || 'N/A')}</ExpectedPurchasePeriod>\n`;
                        xml += `            </Equipment>\n`;
                    }
                }
                xml += `          </RequestedEquipment>\n`;

                xml += `          <CompetitorActivity>${escapeXML(visit.competitorActivity || 'N/A')}</CompetitorActivity>\n`;
                xml += `          <MarketInsights>${escapeXML(visit.marketInsights || 'N/A')}</MarketInsights>\n`;
                xml += `          <Notes>${escapeXML(visit.notes || 'N/A')}</Notes>\n`;
                xml += `          <IsFollowUpRequired>${visit.isFollowUpRequired || false}</IsFollowUpRequired>\n`;

                xml += `        </Visit>\n`;
            }
            xml += `      </DailyVisits>\n`;

            // Weekly Report
            xml += `      <WeeklyReports>\n`;
            xml += `        <TotalReports>${userData.reports.length}</TotalReports>\n`;

            for (const report of userData.reports) {
                xml += `        <Report>\n`;
                xml += `          <ReportID>${report._id.toString()}</ReportID>\n`;
                xml += `          <WeekStart>${report.weekStart ? new Date(report.weekStart).toISOString() : 'N/A'}</WeekStart>\n`;
                xml += `          <WeekEnd>${report.weekEnd ? new Date(report.weekEnd).toISOString() : 'N/A'}</WeekEnd>\n`;
                xml += `          <Status>${escapeXML(report.status || 'N/A')}</Status>\n`;
                xml += `          <IsDraft>${report.isDraft || false}</IsDraft>\n`;
                xml += `          <SubmittedAt>${report.createdAt ? new Date(report.createdAt).toISOString() : 'N/A'}</SubmittedAt>\n`;

                if (report.content && report.content.sections) {
                    xml += `          <Sections>\n`;
                    for (const section of report.content.sections) {
                        xml += `            <Section>\n`;
                        xml += `              <ID>${escapeXML(section.id || 'N/A')}</ID>\n`;
                        xml += `              <Title>${escapeXML(section.title || 'N/A')}</Title>\n`;
                        xml += `              <Content><![CDATA[${section.content || 'N/A'}]]></Content>\n`;
                        xml += `            </Section>\n`;
                    }
                    xml += `          </Sections>\n`;
                }

                xml += `          <AdminNotes>${escapeXML(report.adminNotes || 'N/A')}</AdminNotes>\n`;
                xml += `        </Report>\n`;
            }
            xml += `      </WeeklyReports>\n`;

            // Leads Generated
            xml += `      <LeadsGenerated>\n`;
            xml += `        <TotalLeads>${userData.leads.length}</TotalLeads>\n`;

            for (const lead of userData.leads) {
                xml += `        <Lead>\n`;
                xml += `          <LeadID>${lead._id.toString()}</LeadID>\n`;
                xml += `          <FacilityName>${escapeXML(lead.facilityName || 'N/A')}</FacilityName>\n`;
                xml += `          <FacilityType>${escapeXML(lead.facilityType || 'N/A')}</FacilityType>\n`;
                xml += `          <Location>${escapeXML(lead.location || 'N/A')}</Location>\n`;
                xml += `          <LeadStatus>${escapeXML(lead.leadStatus || 'N/A')}</LeadStatus>\n`;
                xml += `          <LeadSource>${escapeXML(lead.leadSource || 'N/A')}</LeadSource>\n`;

                xml += `          <ContactPerson>\n`;
                xml += `            <Name>${escapeXML(lead.contactPerson?.name || 'N/A')}</Name>\n`;
                xml += `            <Role>${escapeXML(lead.contactPerson?.role || 'N/A')}</Role>\n`;
                xml += `            <Phone>${escapeXML(lead.contactPerson?.phone || 'N/A')}</Phone>\n`;
                xml += `            <Email>${escapeXML(lead.contactPerson?.email || 'N/A')}</Email>\n`;
                xml += `          </ContactPerson>\n`;

                xml += `          <EquipmentOfInterest>\n`;
                xml += `            <Name>${escapeXML(lead.equipmentOfInterest?.name || 'N/A')}</Name>\n`;
                xml += `            <Category>${escapeXML(lead.equipmentOfInterest?.category || 'N/A')}</Category>\n`;
                xml += `            <Quantity>${lead.equipmentOfInterest?.quantity || 0}</Quantity>\n`;
                xml += `          </EquipmentOfInterest>\n`;

                xml += `          <Budget>\n`;
                xml += `            <Amount>${escapeXML(lead.budget?.amount || 'N/A')}</Amount>\n`;
                xml += `            <Currency>${escapeXML(lead.budget?.currency || 'KES')}</Currency>\n`;
                xml += `          </Budget>\n`;

                xml += `          <Timeline>\n`;
                xml += `            <ExpectedPurchaseDate>${lead.timeline?.expectedPurchaseDate ? new Date(lead.timeline.expectedPurchaseDate).toISOString() : 'N/A'}</ExpectedPurchaseDate>\n`;
                xml += `            <Urgency>${escapeXML(lead.timeline?.urgency || 'N/A')}</Urgency>\n`;
                xml += `          </Timeline>\n`;

                xml += `          <CompetitorAnalysis>${escapeXML(lead.competitorAnalysis || 'N/A')}</CompetitorAnalysis>\n`;
                xml += `          <PainPoints>${escapeXML(lead.additionalInfo?.painPoints || 'N/A')}</PainPoints>\n`;
                xml += `          <Notes>${escapeXML(lead.additionalInfo?.notes || 'N/A')}</Notes>\n`;
                xml += `          <CreatedAt>${lead.createdAt ? new Date(lead.createdAt).toISOString() : 'N/A'}</CreatedAt>\n`;

                xml += `        </Lead>\n`;
            }
            xml += `      </LeadsGenerated>\n`;

            xml += `    </User>\n`;
        }

        xml += `  </Users>\n`;
        xml += '</WeeklyReport>\n';

        return xml;
    } catch (error) {
        logger.error('XML generation error:', error);
        throw error;
    }
};

/**
 * Escape special XML characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
const escapeXML = (str) => {
    if (str === null || str === undefined) {
        return 'N/A';
    }

    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};
