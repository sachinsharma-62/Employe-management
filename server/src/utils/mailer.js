import nodemailer from 'nodemailer';
import env from '../config/env.js';

export const isSmtpConfigured = () => Boolean(env.smtp.host && env.smtp.user);

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
};

export const sendMail = async ({ to, subject, html, text, attachments }) => {
  if (!isSmtpConfigured()) {
    console.log(`[mail:skipped] SMTP not configured. To: ${to} | Subject: ${subject}`);
    if (text) console.log(`[mail:body]\n${text}`);
    return { skipped: true };
  }
  await getTransporter().sendMail({ from: env.smtp.from, to, subject, html, text, attachments });
  return { skipped: false };
};

const monthLabel = (value) => {
  if (!value) return '';
  const [year, month] = String(value).split('-').map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const money = (value) => `INR ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const sendPayslipMail = async ({ to, name, payroll, pdf }) => {
  const period = monthLabel(payroll.month);
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#4f46e5;margin-top:0">Office EMS</h2>
      <p>Hi ${name},</p>
      <p>Your payslip for <b>${period}</b> is attached to this email.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
        <tr><td style="padding:6px 0;color:#6b7280">Gross salary</td><td style="text-align:right">${money(payroll.grossSalary)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Total deductions</td><td style="text-align:right">${money(payroll.totalDeductions)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-weight:700">Net pay</td><td style="text-align:right;font-weight:700;color:#16a34a">${money(payroll.netSalary)}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:13px">If you did not expect this email, please contact HR.</p>
    </div>`;

  return sendMail({
    to,
    subject: `Your payslip for ${period}`,
    html,
    text: `Payslip for ${period}: Gross ${money(payroll.grossSalary)}, Deductions ${money(
      payroll.totalDeductions
    )}, Net pay ${money(payroll.netSalary)}.`,
    attachments: [
      {
        filename: `payslip-${payroll.month}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      },
    ],
  });
};

export const sendPasswordResetMail = async ({ to, name, resetUrl }) => {
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#4f46e5;margin-top:0">Office EMS</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. This link is valid for <b>15 minutes</b>.</p>
      <p style="margin:24px 0">
        <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Reset Password</a>
      </p>
      <p style="color:#6b7280;font-size:13px">If you did not request this, you can safely ignore this email.</p>
      <p style="color:#6b7280;font-size:13px">${resetUrl}</p>
    </div>`;

  return sendMail({
    to,
    subject: 'Reset your Office EMS password',
    html,
    text: `Reset your password: ${resetUrl} (valid for 15 minutes)`,
  });
};
