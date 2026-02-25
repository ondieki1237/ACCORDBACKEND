const fs = require('fs');
let content = fs.readFileSync('src/controllers/plannerController.js', 'utf8');

const target1 = `    // Defensive removal of weekend entries in admin output as well
    const cleanedAdmin = planners.map(p => ({
      ...p,
      days: Array.isArray(p.days) ? p.days.filter(d => {
        if (!d || !d.day) return false;
        const name = String(d.day).trim().toLowerCase();
        return name !== 'saturday' && name !== 'sunday';
      }) : []
    }));

    res.json({ success: true, data: cleanedAdmin, meta: { page: pageNum, limit: lim, totalDocs: total, totalPages: Math.ceil(total / lim) } });`;

const replacement1 = `    // Defensive removal of weekend entries in admin output as well
    const cleanedAdmin = planners.map(p => ({
      ...p,
      days: Array.isArray(p.days) ? p.days.filter(d => {
        if (!d || !d.day) return false;
        const name = String(d.day).trim().toLowerCase();
        return name !== 'saturday' && name !== 'sunday';
      }) : []
    }));

    // Fetch approvals for the retrieved planners
    const plannerIds = cleanedAdmin.map(p => p._id);
    const approvals = await PlannerApproval.find({ plannerId: { $in: plannerIds } }).lean();
    
    // Attach approvals to the cleaned admin planners
    const adminPlannersWithApproval = cleanedAdmin.map(p => {
      const approval = approvals.find(a => String(a.plannerId) === String(p._id));
      return {
        ...p,
        approval: approval || null
      };
    });

    res.json({ success: true, data: adminPlannersWithApproval, meta: { page: pageNum, limit: lim, totalDocs: total, totalPages: Math.ceil(total / lim) } });`;

const target2 = `    // Remove weekend entries
    const cleaned = {
      ...planner,
      days: Array.isArray(planner.days) ? planner.days.filter(d => {
        if (!d || !d.day) return false;
        const name = String(d.day).trim().toLowerCase();
        return name !== 'saturday' && name !== 'sunday';
      }) : []
    };

    res.json({ success: true, data: cleaned });`;

const replacement2 = `    // Remove weekend entries
    const cleaned = {
      ...planner,
      days: Array.isArray(planner.days) ? planner.days.filter(d => {
        if (!d || !d.day) return false;
        const name = String(d.day).trim().toLowerCase();
        return name !== 'saturday' && name !== 'sunday';
      }) : []
    };

    // Attach approval
    const approval = await PlannerApproval.findOne({ plannerId: planner._id }).lean();
    cleaned.approval = approval || null;

    res.json({ success: true, data: cleaned });`;

// normalize newlines for replace to be robust
const normalize = (str) => str.replace(/\r\n/g, '\n');

content = normalize(content).replace(normalize(target1), normalize(replacement1));
content = content.replace(normalize(target2), normalize(replacement2));

fs.writeFileSync('src/controllers/plannerController.js', content);
console.log('Update successful');
