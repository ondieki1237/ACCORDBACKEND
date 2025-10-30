import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendQuotationResponseEmail({ to, hospital, equipment, isAvailable, price, availableDate, notes }) {
  const subject = `Quotation Response for ${equipment} - ${hospital}`;
  const html = `
    <p>Dear ${hospital},</p>
    <p>Your quotation request for <strong>${equipment}</strong> has been reviewed.</p>
    <ul>
      <li><strong>Available:</strong> ${isAvailable ? 'Yes' : 'No'}</li>
      ${isAvailable ? `<li><strong>Price:</strong> ${price}</li>
      <li><strong>Available Date:</strong> ${availableDate ? new Date(availableDate).toLocaleDateString() : 'N/A'}</li>` : ''}
      ${notes ? `<li><strong>Notes:</strong> ${notes}</li>` : ''}
    </ul>
    <p>Thank you for your interest.</p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });
}