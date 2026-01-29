import 'dotenv/config';
import connectDB from '../config/database.js';
import { sendEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

const run = async () => {
  // No DB required; just test email
  try {
    const to = process.env.ADMIN_EMAIL || process.env.NOTIFICATION_EMAILS || process.env.EMAIL_USER;
    const res = await sendEmail({ to, subject: 'Test Email from ACCORD Backend', template: 'default', data: { rawHtml: '<p>This is a test email from the backend.</p>' } });
    logger.info('sendEmail result: ' + JSON.stringify(res));
    process.exit(0);
  } catch (err) {
    logger.error('send-test-email error:', err);
    process.exit(1);
  }
};

run();
