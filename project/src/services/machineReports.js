import Machine from '../models/Machine.js';
import { sendEmail } from './emailService.js';
import logger from '../utils/logger.js';

/**
 * Get machines with nextServiceDue in a date range or overdue.
 * @param {Object} opts - options { startDate, endDate, overdue, page, limit }
 */
export const getMachinesDue = async (opts = {}) => {
  const { startDate, endDate, overdue = false, page = 1, limit = 100 } = opts;
  const query = {};

  if (overdue) {
    // nextServiceDue less than today end
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query.nextServiceDue = { $lt: today };
  } else if (startDate || endDate) {
    query.nextServiceDue = {};
    if (startDate) query.nextServiceDue.$gte = new Date(startDate);
    if (endDate) query.nextServiceDue.$lte = new Date(endDate);
  }

  const options = { page: Number(page), limit: Number(limit), sort: { 'facility.name': 1, model: 1, serialNumber: 1 } };

  // Use paginate if available
  if (typeof Machine.paginate === 'function') {
    const results = await Machine.paginate(query, options);
    return results;
  }

  const docs = await Machine.find(query).sort(options.sort).limit(limit).skip((page - 1) * limit).lean();
  return { docs, totalDocs: docs.length, page: Number(page), limit: Number(limit) };
};

export const buildMachinesDueHtml = (machines = [], days = null) => {
  const rows = machines.map(m => {
    const contact = m.contactPerson || {};
    return `
      <tr>
        <td>${m.facility?.name || ''}</td>
        <td>${m.model || ''}</td>
        <td>${m.serialNumber || ''}</td>
        <td>${m.manufacturer || ''}</td>
        <td>${m.installedDate ? new Date(m.installedDate).toLocaleDateString() : ''}</td>
        <td>${m.lastServicedAt ? new Date(m.lastServicedAt).toLocaleDateString() : ''}</td>
        <td>${m.nextServiceDue ? new Date(m.nextServiceDue).toLocaleDateString() : ''}</td>
        <td>${contact.name || ''}</td>
        <td>${contact.phone || ''}</td>
        <td>${contact.email || ''}</td>
        <td>${m.status || ''}</td>
      </tr>
    `;
  }).join('\n');

  const title = days ? `Machines due in next ${days} day(s)` : 'Machines due';

  return `
    <h2>${title}</h2>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; font-family: Arial, sans-serif; font-size:12px;">
      <thead>
        <tr>
          <th>Facility</th><th>Model</th><th>Serial</th><th>Manufacturer</th>
          <th>Installed</th><th>LastServicedAt</th><th>NextServiceDue</th>
          <th>Contact Name</th><th>Contact Phone</th><th>Contact Email</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

export const sendMachinesDueReport = async ({ days = 5, recipients = [], page = 1, limit = 100 } = {}) => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() + Number(days));

    const res = await getMachinesDue({ startDate: now.toISOString(), endDate: end.toISOString(), page, limit });
    const machines = res.docs || res;

    if (!machines || machines.length === 0) {
      logger.info('No machines due in the requested range');
      return { success: true, message: 'No machines due' };
    }

    const html = buildMachinesDueHtml(machines, days);

    const to = Array.isArray(recipients) && recipients.length > 0 ? recipients.join(',') : (process.env.MACHINE_REMINDER_RECIPIENTS || process.env.EMAIL_TO || 'techsupport@accordmedical.co.ke');

    await sendEmail({
      to,
      subject: `Machines due for service - next ${days} day(s)`,
      template: 'machinesDueReport',
      data: { rawHtml: html, days }
    });

    return { success: true, message: 'Report sent', count: machines.length };
  } catch (err) {
    logger.error('sendMachinesDueReport error:', err);
    throw err;
  }
};
