import Planner from '../models/Planner.js';
import User from '../models/User.js';
import PlannerApproval from '../models/PlannerApproval.js';
import XLSX from 'xlsx';

// Helper: parse allowance as number
function parseAllowance(val) {
  if (!val) return 0;
  const n = Number(String(val).replace(/[^\d.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

// GET /api/planner-summary/summary
export const plannersSummary = async (req, res, next) => {
  try {
    // Get all approved planners
    const approvals = await PlannerApproval.find({ status: 'approved' }).lean();
    const plannerIds = approvals.map(a => a.plannerId);
    const planners = await Planner.find({ _id: { $in: plannerIds } }).populate('userId', 'employeeId firstName lastName email').lean();

    // Aggregate by user and by month
    const userAgg = {};
    const monthAgg = {};
    let totalExpenditure = 0;
    let totalDays = 0;
    const rawDays = [];
    const personnelSet = new Set();

    planners.forEach(planner => {
      const user = planner.userId;
      if (!user) return;
      personnelSet.add(user._id.toString());
      planner.days.forEach(day => {
        if (!day || !day.date) return;
        const allowance = parseAllowance(day.allowance);
        totalExpenditure += allowance;
        totalDays++;
        // User aggregation
        if (!userAgg[user._id]) {
          userAgg[user._id] = {
            employeeId: user.employeeId,
            fullName: user.firstName + ' ' + user.lastName,
            email: user.email,
            totalExpenditure: 0,
            totalDays: 0
          };
        }
        userAgg[user._id].totalExpenditure += allowance;
        userAgg[user._id].totalDays++;
        // Month aggregation
        const month = new Date(day.date).toISOString().slice(0, 7); // YYYY-MM
        if (!monthAgg[month]) monthAgg[month] = { month, totalExpenditure: 0, totalDays: 0 };
        monthAgg[month].totalExpenditure += allowance;
        monthAgg[month].totalDays++;
        // Raw days
        rawDays.push({
          employeeId: user.employeeId,
          fullName: user.firstName + ' ' + user.lastName,
          email: user.email,
          date: day.date,
          place: day.place,
          means: day.means,
          allowance,
          prospects: day.prospects
        });
      });
    });

    res.json({
      success: true,
      data: {
        lifetimeExpenditure: totalExpenditure,
        totalDaysPlanned: totalDays,
        activePersonnel: personnelSet.size,
        userUtilization: Object.values(userAgg),
        monthlyExpenditure: Object.values(monthAgg),
        rawPlannerDays: rawDays
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/planner-summary/summary/excel
export const plannersSummaryExcel = async (req, res, next) => {
  try {
    // Get all approved planners
    const approvals = await PlannerApproval.find({ status: 'approved' }).lean();
    const plannerIds = approvals.map(a => a.plannerId);
    const planners = await Planner.find({ _id: { $in: plannerIds } }).populate('userId', 'employeeId firstName lastName email').lean();

    // Aggregate as above
    const userAgg = {};
    const monthAgg = {};
    const rawDays = [];

    planners.forEach(planner => {
      const user = planner.userId;
      if (!user) return;
      planner.days.forEach(day => {
        if (!day || !day.date) return;
        const allowance = parseAllowance(day.allowance);
        // User aggregation
        if (!userAgg[user._id]) {
          userAgg[user._id] = {
            'Employee ID': user.employeeId,
            'Full Name': user.firstName + ' ' + user.lastName,
            'Email': user.email,
            'Total Expenditure': 0,
            'Total Days': 0
          };
        }
        userAgg[user._id]['Total Expenditure'] += allowance;
        userAgg[user._id]['Total Days']++;
        // Month aggregation
        const month = new Date(day.date).toISOString().slice(0, 7); // YYYY-MM
        if (!monthAgg[month]) monthAgg[month] = { 'Month': month, 'Total Expenditure': 0, 'Total Days': 0 };
        monthAgg[month]['Total Expenditure'] += allowance;
        monthAgg[month]['Total Days']++;
        // Raw days
        rawDays.push({
          'Employee ID': user.employeeId,
          'Full Name': user.firstName + ' ' + user.lastName,
          'Email': user.email,
          'Date': new Date(day.date).toISOString().slice(0, 10),
          'Place': day.place,
          'Means': day.means,
          'Allowance': allowance,
          'Prospects': day.prospects
        });
      });
    });

    // Prepare workbook
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(Object.values(userAgg));
    const ws2 = XLSX.utils.json_to_sheet(Object.values(monthAgg));
    const ws3 = XLSX.utils.json_to_sheet(rawDays);
    XLSX.utils.book_append_sheet(wb, ws1, 'User Utilization');
    XLSX.utils.book_append_sheet(wb, ws2, 'Monthly Expenditure');
    XLSX.utils.book_append_sheet(wb, ws3, 'Raw Planner Days');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="planner-summary.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};
