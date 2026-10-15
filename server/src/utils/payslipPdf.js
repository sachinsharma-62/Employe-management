import PDFDocument from 'pdfkit';
import COMPANY from '../config/company.js';
import {
  PAYROLL_EARNING_FIELDS,
  PAYROLL_DEDUCTION_FIELDS,
  PAYROLL_EARNING_LABELS,
  PAYROLL_DEDUCTION_LABELS,
  PAYROLL_STATUS_LABELS,
} from './enums.js';

const COLORS = {
  primary: '#4f46e5',
  primarySoft: '#f4f5ff',
  ink: '#2b2f3a',
  muted: '#6b7280',
  line: '#e5e7eb',
  green: '#16a34a',
  danger: '#dc2626',
};

const PAGE = { width: 595.28, height: 841.89, margin: 40 };
const CONTENT = PAGE.width - PAGE.margin * 2;

const money = (value) => `INR ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const monthLabel = (value) => {
  if (!value) return '';
  const [year, month] = String(value).split('-').map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const orDash = (value) => (value === null || value === undefined || value === '' ? '—' : String(value));

// Draws a label (muted, small) above a value (bold) inside a fixed cell.
const drawField = (doc, x, y, width, label, value) => {
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(COLORS.muted)
    .text(label.toUpperCase(), x, y, { width, characterSpacing: 0.4 });
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.ink)
    .text(orDash(value), x, y + 11, { width, ellipsis: true });
};

export const buildPayslipPdf = (payroll) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: PAGE.margin, bufferPages: true });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const employee = payroll.employee || {};
      const name = [employee.firstName, employee.lastName].filter(Boolean).join(' ') || 'Employee';
      const period = monthLabel(payroll.month);
      const status = PAYROLL_STATUS_LABELS[payroll.status] || payroll.status;

      // ---------------- Header band ----------------
      doc.rect(0, 0, PAGE.width, 96).fill(COLORS.primary);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(19).text(COMPANY.name, PAGE.margin, 24);
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#e0e1ff')
        .text(COMPANY.address, PAGE.margin, 49, { width: 330 });
      doc.text(
        [COMPANY.email, COMPANY.phone, COMPANY.website].filter(Boolean).join('  |  '),
        PAGE.margin,
        62,
        { width: 360 }
      );
      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(17)
        .text('PAYSLIP', PAGE.margin, 26, { width: CONTENT, align: 'right' });
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor('#e0e1ff')
        .text(`Pay period: ${period || '—'}`, PAGE.margin, 50, { width: CONTENT, align: 'right' });

      // ---------------- Employee details ----------------
      let y = 118;
      doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(9).text('EMPLOYEE DETAILS', PAGE.margin, y);
      y += 16;

      const boxHeight = 96;
      doc.roundedRect(PAGE.margin, y, CONTENT, boxHeight, 8).fillAndStroke(COLORS.primarySoft, COLORS.line);

      const colW = CONTENT / 3;
      const cellX = (i) => PAGE.margin + 16 + i * colW;
      const rowY = (r) => y + 14 + r * 30;

      const details = [
        ['Employee name', name],
        ['Employee ID', orDash(employee.employeeId)],
        ['Designation', orDash(employee.designation)],
        ['Department', orDash(payroll.department || employee.department)],
        ['Pay period', period || '—'],
        ['Pay date', payroll.payDate ? formatDate(payroll.payDate) : 'Pending'],
        ['Working days', String(payroll.workingDays || 0)],
        ['Paid days', String(payroll.paidDays ?? payroll.workingDays ?? 0)],
        ['Status', status],
      ];
      details.forEach(([label, value], index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        drawField(doc, cellX(col), rowY(row), colW - 12, label, value);
      });

      y += boxHeight + 26;

      // ---------------- Earnings / Deductions ----------------
      const colWidth = (CONTENT - 24) / 2;
      const leftX = PAGE.margin;
      const rightX = PAGE.margin + colWidth + 24;

      const drawSection = (x, title, rows, totalLabel, totalValue, valueColor) => {
        const headerH = 24;
        doc.rect(x, y, colWidth, headerH).fill(COLORS.primary);
        doc
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(title, x + 10, y + 7, { width: colWidth - 20 });

        let ry = y + headerH;
        doc.font('Helvetica').fontSize(9.5);
        rows.forEach(([label, value], index) => {
          if (index % 2 === 0) doc.rect(x, ry, colWidth, 22).fill('#fafbfe');
          doc.fillColor(COLORS.muted).text(label, x + 10, ry + 6, { width: colWidth - 120 });
          doc
            .fillColor(valueColor)
            .font('Helvetica')
            .text(money(value), x, ry + 6, { width: colWidth - 10, align: 'right' });
          doc.rect(x, ry + 22, colWidth, 0.5).fill(COLORS.line);
          ry += 22;
        });

        doc.rect(x, ry, colWidth, 26).fillAndStroke(COLORS.primarySoft, COLORS.line);
        doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10).text(totalLabel, x + 10, ry + 8, { width: colWidth - 120 });
        doc.fillColor(valueColor).text(money(totalValue), x, ry + 8, { width: colWidth - 10, align: 'right' });
        return ry + 26;
      };

      const earningsRows = PAYROLL_EARNING_FIELDS.map((f) => [PAYROLL_EARNING_LABELS[f] || f, payroll[f] || 0]);
      const deductionsRows = PAYROLL_DEDUCTION_FIELDS.map((f) => [PAYROLL_DEDUCTION_LABELS[f] || f, payroll[f] || 0]);

      const leftEnd = drawSection(leftX, 'EARNINGS', earningsRows, 'Total earnings', payroll.totalEarnings, COLORS.ink);
      const rightEnd = drawSection(rightX, 'DEDUCTIONS', deductionsRows, 'Total deductions', payroll.totalDeductions, COLORS.danger);
      y = Math.max(leftEnd, rightEnd) + 24;

      // ---------------- Net pay ----------------
      doc.roundedRect(PAGE.margin, y, CONTENT, 54, 8).fillAndStroke(COLORS.primarySoft, COLORS.primary);
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10).text('Gross salary', PAGE.margin + 16, y + 12);
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted).text(money(payroll.grossSalary), PAGE.margin + 16, y + 28);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink).text('NET PAY', PAGE.margin, y + 14, { width: CONTENT - 16, align: 'right' });
      doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.green).text(money(payroll.netSalary), PAGE.margin, y + 26, { width: CONTENT - 16, align: 'right' });
      y += 54 + 20;

      // ---------------- Footer ----------------
      if (payroll.note) {
        doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(8.5).text(`Note: ${payroll.note}`, PAGE.margin, y, { width: CONTENT });
        y += 16;
      }
      doc
        .fillColor(COLORS.muted)
        .font('Helvetica')
        .fontSize(8)
        .text(
          `Generated on ${formatDate(new Date())} · This is a computer-generated payslip and does not require a signature.`,
          PAGE.margin,
          y + 6,
          { width: CONTENT, align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });

export default buildPayslipPdf;
