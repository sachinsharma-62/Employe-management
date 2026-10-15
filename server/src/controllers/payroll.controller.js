import User from '../models/User.js';
import Payroll from '../models/Payroll.js';
import SalaryStructure from '../models/SalaryStructure.js';
import Holiday from '../models/Holiday.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getAttendanceSettings } from '../utils/attendanceSettings.js';
import { getSetting } from '../utils/settingsStore.js';
import { buildPayslipPdf } from '../utils/payslipPdf.js';
import { sendPayslipMail } from '../utils/mailer.js';
import {
  PAYROLL_STATUSES,
  PAYROLL_STATUS_LABELS,
  PAYROLL_EARNING_FIELDS,
  PAYROLL_DEDUCTION_FIELDS,
  PAYROLL_EARNING_LABELS,
  PAYROLL_DEDUCTION_LABELS,
} from '../utils/enums.js';
import {
  buildDefaultStructure,
  computeTotals,
  countWorkingDays,
  currentMonthKey,
  getStructureComponents,
  isValidMonth,
  monthBounds,
  round2,
  toISODate,
} from '../utils/payroll.js';

const EMPLOYEE_FIELDS =
  'firstName lastName employeeId email designation department avatar role employmentType';
const ACTOR_FIELDS = 'firstName lastName avatar designation';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const TRANSITIONS = {
  process: { from: 'DRAFT', to: 'PROCESSED', by: 'processedBy', at: 'processedAt' },
  review: { from: 'PROCESSED', to: 'IN_REVIEW', by: 'reviewedBy', at: 'reviewedAt' },
  approve: { from: 'IN_REVIEW', to: 'APPROVED', by: 'approvedBy', at: 'approvedAt' },
  pay: { from: 'APPROVED', to: 'PAID', by: 'paidBy', at: 'paidAt' },
};

const PAYSLIP_VIEWERS = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'];

const resolveMonth = (value) => {
  const month = value || currentMonthKey();
  if (!isValidMonth(month)) throw ApiError.badRequest('Month must be in YYYY-MM format');
  return month;
};

const assertPayslipAccess = (payroll, user) => {
  const ownerId = String(payroll.employee?._id || payroll.employee || '');
  const isOwner = ownerId === String(user._id);
  if (!isOwner && !PAYSLIP_VIEWERS.includes(user.role)) {
    throw ApiError.forbidden('You can only access your own payslip');
  }
};

// Working days = weekdays (per org settings) minus active public holidays.
const resolveWorkingDays = async (month) => {
  const { weekendDays } = await getAttendanceSettings();
  const { start, end } = monthBounds(month);
  const holidays = await Holiday.find({ isActive: true, date: { $gte: start, $lte: end } }).select('date');
  const holidayDates = holidays.map((holiday) => toISODate(holiday.date));
  return countWorkingDays(month, { weekendDays, holidayDates });
};

const buildFilter = async ({ month, department, status, search, employeeId }) => {
  const filter = {};
  if (month) filter.month = month;
  if (status) filter.status = status;
  if (department) filter.department = department;

  if (employeeId) {
    filter.employee = employeeId;
  } else if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    const ids = await User.find({
      $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { employeeId: rx }],
    }).select('_id');
    filter.employee = { $in: ids.map((u) => u._id) };
  }

  return filter;
};

const aggregateSummary = (rows) => {
  const counts = {};
  PAYROLL_STATUSES.forEach((status) => {
    counts[status] = 0;
  });
  let totalGross = 0;
  let totalEarnings = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  let total = 0;

  rows.forEach((row) => {
    counts[row._id] = row.count;
    total += row.count;
    totalGross += row.gross || 0;
    totalEarnings += row.earnings || 0;
    totalDeductions += row.deductions || 0;
    totalNet += row.net || 0;
  });

  return {
    counts,
    total,
    totalGross: round2(totalGross),
    totalEarnings: round2(totalEarnings),
    totalDeductions: round2(totalDeductions),
    totalNet: round2(totalNet),
  };
};

const summaryPipeline = (filter) => [
  { $match: filter },
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 },
      gross: { $sum: '$grossSalary' },
      earnings: { $sum: '$totalEarnings' },
      deductions: { $sum: '$totalDeductions' },
      net: { $sum: '$netSalary' },
    },
  },
];

const applyTransition = async (payroll, action, user) => {
  const rule = TRANSITIONS[action];
  if (!rule) throw ApiError.badRequest('Unknown payroll action');
  if (payroll.status !== rule.from) {
    throw ApiError.conflict(
      `Cannot ${action} a payroll in ${PAYROLL_STATUS_LABELS[payroll.status] || payroll.status} state`
    );
  }

  payroll.status = rule.to;
  payroll[rule.by] = user._id;
  payroll[rule.at] = new Date();
  if (action === 'pay') payroll.payDate = payroll.payDate || new Date();
  await payroll.save();
  return payroll;
};

const applyRevert = async (payroll) => {
  if (payroll.status === 'PAID') throw ApiError.conflict('A paid payroll cannot be reverted');
  if (payroll.status === 'DRAFT') return payroll;

  payroll.status = 'DRAFT';
  payroll.processedBy = null;
  payroll.reviewedBy = null;
  payroll.approvedBy = null;
  payroll.processedAt = null;
  payroll.reviewedAt = null;
  payroll.approvedAt = null;
  payroll.payDate = null;
  await payroll.save();
  return payroll;
};

// GET /api/payroll
export const listPayroll = asyncHandler(async (req, res) => {
  const month = req.query.month || '';
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
  const filter = await buildFilter({ ...req.query, month });

  const [total, records, summaryRows] = await Promise.all([
    Payroll.countDocuments(filter),
    Payroll.find(filter)
      .sort({ month: -1, netSalary: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('employee', EMPLOYEE_FIELDS),
    Payroll.aggregate(summaryPipeline(filter)),
  ]);

  res.status(200).json({
    success: true,
    records,
    summary: aggregateSummary(summaryRows),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/payroll/me
export const getMyPayslips = asyncHandler(async (req, res) => {
  const records = await Payroll.find({ employee: req.user._id })
    .sort({ month: -1 })
    .populate('employee', EMPLOYEE_FIELDS);
  const paid = records.filter((r) => r.status === 'PAID');
  res.status(200).json({
    success: true,
    records,
    summary: {
      latest: records[0] || null,
      totalPaidMonths: paid.length,
      totalNetPaid: round2(paid.reduce((sum, r) => sum + (r.netSalary || 0), 0)),
      currency: records[0]?.currency || 'INR',
    },
  });
});

// GET /api/payroll/stats?month=&department=
export const getPayrollStats = asyncHandler(async (req, res) => {
  const month = resolveMonth(req.query.month);
  const filter = await buildFilter({ month, department: req.query.department });
  const rows = await Payroll.aggregate(summaryPipeline(filter));
  res.status(200).json({ success: true, month, summary: aggregateSummary(rows) });
});

// GET /api/payroll/departments?month=
export const getDepartmentPayroll = asyncHandler(async (req, res) => {
  const month = resolveMonth(req.query.month);
  const rows = await Payroll.aggregate([
    { $match: { month } },
    {
      $group: {
        _id: '$department',
        employees: { $sum: 1 },
        gross: { $sum: '$grossSalary' },
        earnings: { $sum: '$totalEarnings' },
        deductions: { $sum: '$totalDeductions' },
        net: { $sum: '$netSalary' },
        paid: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] } },
      },
    },
    { $sort: { net: -1 } },
  ]);

  const departments = rows
    .map((row) => ({
      department: row._id || 'Unassigned',
      employees: row.employees,
      gross: round2(row.gross),
      earnings: round2(row.earnings),
      deductions: round2(row.deductions),
      net: round2(row.net),
      paid: row.paid,
    }))
    .filter((row) => row.employees > 0);

  res.status(200).json({ success: true, month, departments });
});

// GET /api/payroll/report?month=&months=
export const getSalaryReport = asyncHandler(async (req, res) => {
  const month = resolveMonth(req.query.month);
  const monthsBack = Math.min(Math.max(Number(req.query.months) || 6, 1), 12);

  const [year, m] = month.split('-').map(Number);
  const trend = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const date = new Date(year, m - 1 - i, 1);
    const key = currentMonthKey(date);
    trend.push(key);
  }

  const [summaryRows, trendRows, deptRows] = await Promise.all([
    Payroll.aggregate(summaryPipeline({ month })),
    Payroll.aggregate([
      { $match: { month: { $in: trend } } },
      {
        $group: {
          _id: '$month',
          gross: { $sum: '$grossSalary' },
          deductions: { $sum: '$totalDeductions' },
          net: { $sum: '$netSalary' },
          employees: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Payroll.aggregate([
      { $match: { month } },
      {
        $group: {
          _id: '$department',
          employees: { $sum: 1 },
          gross: { $sum: '$grossSalary' },
          net: { $sum: '$netSalary' },
        },
      },
      { $sort: { net: -1 } },
    ]),
  ]);

  const trendMap = new Map(trendRows.map((row) => [row._id, row]));
  const trendSeries = trend.map((key) => {
    const row = trendMap.get(key) || {};
    return {
      month: key,
      gross: round2(row.gross || 0),
      deductions: round2(row.deductions || 0),
      net: round2(row.net || 0),
      employees: row.employees || 0,
    };
  });

  const departments = deptRows.map((row) => ({
    department: row._id || 'Unassigned',
    employees: row.employees,
    gross: round2(row.gross),
    net: round2(row.net),
  }));

  res.status(200).json({
    success: true,
    month,
    summary: aggregateSummary(summaryRows),
    trend: trendSeries,
    departments,
  });
});

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const money = (value) => `INR ${(Number(value) || 0).toLocaleString('en-IN')}`;

// GET /api/payroll/report/download?month=
export const downloadSalaryReport = asyncHandler(async (req, res) => {
  const month = resolveMonth(req.query.month);
  const records = await Payroll.find({ month }).sort({ department: 1 }).populate('employee', EMPLOYEE_FIELDS);
  const summary = aggregateSummary(
    await Payroll.aggregate(summaryPipeline({ month }))
  );

  const rows = records
    .map(
      (p) => `<tr>
        <td>${escapeHtml(p.employee?.employeeId || '')}</td>
        <td>${escapeHtml(p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'Unknown')}</td>
        <td>${escapeHtml(p.department || p.employee?.department || '—')}</td>
        <td class="num">${money(p.totalEarnings)}</td>
        <td class="num">${money(p.totalDeductions)}</td>
        <td class="num">${money(p.netSalary)}</td>
        <td>${escapeHtml(PAYROLL_STATUS_LABELS[p.status] || p.status)}</td>
      </tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Salary Report ${escapeHtml(month)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #2b2f3a; margin: 32px; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .muted { color: #6b7280; margin: 0 0 18px; font-size: 13px; }
  .stats { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 22px; }
  .stat { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; min-width: 130px; }
  .stat span { display: block; font-size: 11px; text-transform: uppercase; color: #6b7280; }
  .stat strong { font-size: 17px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #eef0f4; }
  th { background: #fafbfe; color: #6b7280; font-size: 11px; text-transform: uppercase; }
  td.num, th.num { text-align: right; }
</style>
</head>
<body>
  <h1>Salary Report</h1>
  <p class="muted">Payroll period ${escapeHtml(month)} · generated ${new Date().toUTCString()}</p>
  <div class="stats">
    <div class="stat"><span>Payslips</span><strong>${summary.total}</strong></div>
    <div class="stat"><span>Total earnings</span><strong>${money(summary.totalEarnings)}</strong></div>
    <div class="stat"><span>Total deductions</span><strong>${money(summary.totalDeductions)}</strong></div>
    <div class="stat"><span>Net payout</span><strong>${money(summary.totalNet)}</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Employee ID</th><th>Name</th><th>Department</th>
        <th class="num">Earnings</th><th class="num">Deductions</th><th class="num">Net pay</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="7">No payroll records for this period.</td></tr>'}</tbody>
  </table>
  <p class="muted" style="margin-top:24px;font-size:12px;">Office EMS · Confidential payroll document</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="salary-report-${month}.html"`);
  res.status(200).send(html);
});

const monthLabel = (value) => {
  if (!value) return '';
  const [year, month] = String(value).split('-').map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const payslipRows = (fields, labels, record) =>
  fields
    .map(
      (field) =>
        `<tr><td>${escapeHtml(labels[field] || field)}</td><td class="num">${money(record[field])}</td></tr>`
    )
    .join('');

const renderPayslipHtml = (payroll) => {
  const employee = payroll.employee || {};
  const name = [employee.firstName, employee.lastName].filter(Boolean).join(' ') || 'Employee';
  const status = PAYROLL_STATUS_LABELS[payroll.status] || payroll.status;
  const currency = payroll.currency || 'INR';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Payslip ${escapeHtml(payroll.month)} · ${escapeHtml(name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #2b2f3a; margin: 0; padding: 32px; background: #fff; }
  .sheet { max-width: 760px; margin: 0 auto; }
  .top { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 14px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 40px; height: 40px; border-radius: 10px; background: #4f46e5; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .brand h1 { margin: 0; font-size: 20px; }
  .brand span { font-size: 12px; color: #6b7280; }
  .top .period { text-align: right; }
  .top .period small { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; }
  .top .period strong { font-size: 16px; }
  .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 24px; margin: 20px 0; font-size: 13px; }
  .meta div { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f2f7; padding: 6px 0; }
  .meta span { color: #6b7280; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
  .cols h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #4f46e5; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td { padding: 6px 8px; border-bottom: 1px solid #f1f2f7; }
  td.num { text-align: right; }
  tr.total td { font-weight: 700; border-top: 1px solid #d1d5db; border-bottom: none; }
  .net { margin-top: 22px; display: flex; align-items: center; justify-content: space-between; background: #f4f5ff; border: 1px solid #e0e1ff; border-radius: 12px; padding: 16px 20px; }
  .net span { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #4b5164; }
  .net strong { font-size: 22px; color: #16a34a; }
  .foot { margin-top: 22px; display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
  .chip { display: inline-block; padding: 3px 10px; border-radius: 20px; background: #eef0f4; font-weight: 600; color: #4b5164; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div class="brand">
        <span class="logo">EM</span>
        <div>
          <h1>Office EMS</h1>
          <span>Salary Payslip</span>
        </div>
      </div>
      <div class="period">
        <small>Pay period</small>
        <strong>${escapeHtml(monthLabel(payroll.month))}</strong>
      </div>
    </div>

    <div class="meta">
      <div><span>Employee</span><strong>${escapeHtml(name)}</strong></div>
      <div><span>Employee ID</span><strong>${escapeHtml(employee.employeeId || '—')}</strong></div>
      <div><span>Department</span><strong>${escapeHtml(payroll.department || employee.department || '—')}</strong></div>
      <div><span>Designation</span><strong>${escapeHtml(employee.designation || '—')}</strong></div>
      <div><span>Pay date</span><strong>${payroll.payDate ? escapeHtml(new Date(payroll.payDate).toLocaleDateString('en-IN')) : 'Pending'}</strong></div>
      <div><span>Status</span><strong>${escapeHtml(status)}</strong></div>
    </div>

    <div class="cols">
      <div>
        <h3>Earnings</h3>
        <table>
          <tbody>
            ${payslipRows(PAYROLL_EARNING_FIELDS, PAYROLL_EARNING_LABELS, payroll)}
            <tr class="total"><td>Total earnings</td><td class="num">${money(payroll.totalEarnings)}</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3>Deductions</h3>
        <table>
          <tbody>
            ${payslipRows(PAYROLL_DEDUCTION_FIELDS, PAYROLL_DEDUCTION_LABELS, payroll)}
            <tr class="total"><td>Total deductions</td><td class="num">${money(payroll.totalDeductions)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="net">
      <span>Net pay (${escapeHtml(currency)})</span>
      <strong>${money(payroll.netSalary)}</strong>
    </div>

    <div class="foot">
      <span>Gross salary: ${money(payroll.grossSalary)}</span>
      <span class="chip">${escapeHtml(status)}</span>
    </div>
    ${payroll.note ? `<p style="font-size:12px;color:#6b7280;margin-top:14px;">Note: ${escapeHtml(payroll.note)}</p>` : ''}
    <p style="font-size:11px;color:#9aa1b0;margin-top:20px;">Office EMS · Computer-generated payslip · Confidential</p>
  </div>
</body>
</html>`;
};

// GET /api/payroll/:id/payslip/download  (printable HTML)
export const downloadPayslip = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id).populate('employee', EMPLOYEE_FIELDS);
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  assertPayslipAccess(payroll, req.user);

  const safeId = payroll.employee?.employeeId || payroll.employee?._id || 'employee';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="payslip-${payroll.month}-${safeId}.html"`
  );
  res.status(200).send(renderPayslipHtml(payroll));
});

// GET /api/payroll/:id/payslip.pdf  (generated PDF)
export const downloadPayslipPdf = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id).populate('employee', EMPLOYEE_FIELDS);
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  assertPayslipAccess(payroll, req.user);

  const pdf = await buildPayslipPdf(payroll);
  const safeId = payroll.employee?.employeeId || payroll.employee?._id || 'employee';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="payslip-${payroll.month}-${safeId}.pdf"`
  );
  res.status(200).send(pdf);
});

const deliverPayslip = async (payroll, user) => {
  const employee = payroll.employee;
  if (!employee?.email) return { status: 'skipped', reason: 'no-email' };
  const name = [employee.firstName, employee.lastName].filter(Boolean).join(' ') || 'Employee';
  const pdf = await buildPayslipPdf(payroll);
  const result = await sendPayslipMail({ to: employee.email, name, payroll, pdf });
  payroll.sentAt = new Date();
  payroll.sentBy = user._id;
  payroll.lastSentTo = employee.email;
  await payroll.save();
  return { status: result.skipped ? 'queued' : 'sent', email: employee.email, sentAt: payroll.sentAt };
};

// POST /api/payroll/:id/send
export const sendPayslip = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id).populate('employee', EMPLOYEE_FIELDS);
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  assertPayslipAccess(payroll, req.user);

  if (!payroll.employee?.email) throw ApiError.badRequest('Employee has no email address on record');
  const result = await deliverPayslip(payroll, req.user);

  res.status(200).json({
    success: true,
    message:
      result.status === 'sent'
        ? `Payslip emailed to ${result.email}`
        : `Payslip queued for ${result.email} (SMTP not configured)`,
    status: result.status,
    sentTo: result.email,
    sentAt: result.sentAt,
  });
});

// POST /api/payroll/send  { ids? , month?, department?, status? }
export const sendPayslips = asyncHandler(async (req, res) => {
  const filter = {};
  if (Array.isArray(req.body.ids) && req.body.ids.length) filter._id = { $in: req.body.ids };
  else {
    if (req.body.month) filter.month = req.body.month;
    if (req.body.department) filter.department = req.body.department;
    if (req.body.status) filter.status = req.body.status;
  }

  const records = await Payroll.find(filter).populate('employee', EMPLOYEE_FIELDS);
  let sent = 0;
  let queued = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const result = await deliverPayslip(record, req.user);
      if (result.status === 'sent') sent += 1;
      else if (result.status === 'queued') queued += 1;
      else skipped += 1;
    } catch {
      skipped += 1;
    }
  }

  res.status(200).json({
    success: true,
    message: `Payslips processed — ${sent + queued} delivered, ${skipped} skipped`,
    sent,
    queued,
    skipped,
    total: records.length,
  });
});

// GET /api/payroll/history/:employeeId
export const getPayslipHistory = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.employeeId).select(EMPLOYEE_FIELDS);
  if (!employee) throw ApiError.notFound('Employee not found');

  const records = await Payroll.find({ employee: employee._id }).sort({ month: -1 });
  const paid = records.filter((r) => r.status === 'PAID');
  const lastSent = records
    .map((r) => r.sentAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0] || null;

  res.status(200).json({
    success: true,
    employee,
    records,
    summary: {
      total: records.length,
      paidMonths: paid.length,
      totalNetPaid: round2(paid.reduce((sum, r) => sum + (r.netSalary || 0), 0)),
      lastSentAt: lastSent,
      currency: records[0]?.currency || 'INR',
    },
  });
});

// POST /api/payroll/generate
export const generatePayroll = asyncHandler(async (req, res) => {
  const month = resolveMonth(req.body.month);
  const { department, employeeIds } = req.body;

  const userFilter = { isActive: true };
  if (department) userFilter.department = department;
  if (Array.isArray(employeeIds) && employeeIds.length) userFilter._id = { $in: employeeIds };

  const employees = await User.find(userFilter).select(`${EMPLOYEE_FIELDS} manager`);
  if (employees.length === 0) throw ApiError.badRequest('No active employees matched the selection');

  const employeeIdList = employees.map((e) => e._id);
  const [structures, existing] = await Promise.all([
    SalaryStructure.find({ employee: { $in: employeeIdList } }),
    Payroll.find({ month, employee: { $in: employeeIdList } }).select('employee'),
  ]);

  const structureMap = new Map(structures.map((s) => [String(s.employee), s]));
  const existingSet = new Set(existing.map((p) => String(p.employee)));

  const workingDays = await resolveWorkingDays(month);
  const payrollCfg = await getSetting('payroll');

  const toCreate = [];
  for (const employee of employees) {
    if (existingSet.has(String(employee._id))) continue;
    const structure = structureMap.get(String(employee._id));
    const components = structure
      ? getStructureComponents(structure)
      : buildDefaultStructure(null, payrollCfg);

    toCreate.push({
      employee: employee._id,
      month,
      department: employee.department || '',
      currency: structure?.currency || 'INR',
      ...components,
      workingDays,
      paidDays: workingDays,
      status: 'DRAFT',
    });
  }

  if (toCreate.length) await Payroll.insertMany(toCreate);

  res.status(201).json({
    success: true,
    message: `Generated ${toCreate.length} payslip(s) for ${month}`,
    month,
    created: toCreate.length,
    skipped: employees.length - toCreate.length,
    total: employees.length,
  });
});

// POST /api/payroll/bulk  { action, month?, department?, ids? }
export const bulkTransition = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const filter = {};
  if (Array.isArray(req.body.ids) && req.body.ids.length) filter._id = { $in: req.body.ids };
  else {
    if (req.body.month) filter.month = req.body.month;
    if (req.body.department) filter.department = req.body.department;
    if (req.body.status) filter.status = req.body.status;
  }

  const records = await Payroll.find(filter);
  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      if (action === 'revert') await applyRevert(record);
      else await applyTransition(record, action, req.user);
      updated += 1;
    } catch {
      skipped += 1;
    }
  }

  res.status(200).json({ success: true, message: `Updated ${updated} payroll record(s)`, updated, skipped });
});

// ---------------- Salary structures ----------------

// GET /api/payroll/salary-structures?department=&search=
export const listSalaryStructures = asyncHandler(async (req, res) => {
  const { department, search } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { employeeId: rx }];
  }
  filter.isActive = true;

  const employees = await User.find(filter).select(EMPLOYEE_FIELDS).sort({ firstName: 1, lastName: 1 });
  const structures = await SalaryStructure.find({ employee: { $in: employees.map((e) => e._id) } });
  const map = new Map(structures.map((s) => [String(s.employee), s]));

  res.status(200).json({
    success: true,
    employees: employees.map((employee) => {
      const structure = map.get(String(employee._id));
      return {
        employee,
        structure: structure ? structure.toJSON() : null,
        defaults: !structure,
      };
    }),
  });
});

// GET /api/payroll/salary-structures/:employeeId
export const getSalaryStructure = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.employeeId).select(EMPLOYEE_FIELDS);
  if (!employee) throw ApiError.notFound('Employee not found');
  const structure = await SalaryStructure.findOne({ employee: employee._id });
  res.status(200).json({ success: true, employee, structure: structure ? structure.toJSON() : null });
});

// PUT /api/payroll/salary-structures/:employeeId
export const upsertSalaryStructure = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.employeeId).select(EMPLOYEE_FIELDS);
  if (!employee) throw ApiError.notFound('Employee not found');

  const payload = { employee: employee._id, updatedBy: req.user._id };
  [...PAYROLL_EARNING_FIELDS, ...PAYROLL_DEDUCTION_FIELDS].forEach((field) => {
    if (req.body[field] !== undefined) payload[field] = Number(req.body[field]) || 0;
  });
  if (req.body.currency) payload.currency = req.body.currency;
  if (req.body.effectiveFrom) payload.effectiveFrom = req.body.effectiveFrom;
  if (req.body.isActive !== undefined) payload.isActive = Boolean(req.body.isActive);

  const structure = await SalaryStructure.findOneAndUpdate(
    { employee: employee._id },
    { $set: payload },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ success: true, message: 'Salary structure saved', structure: structure.toJSON() });
});

// DELETE /api/payroll/salary-structures/:employeeId
export const deleteSalaryStructure = asyncHandler(async (req, res) => {
  const structure = await SalaryStructure.findOne({ employee: req.params.employeeId });
  if (!structure) throw ApiError.notFound('Salary structure not found');
  await structure.deleteOne();
  res.status(200).json({ success: true, message: 'Salary structure removed' });
});

// GET /api/payroll/:id
export const getPayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id)
    .populate('employee', EMPLOYEE_FIELDS)
    .populate('processedBy', ACTOR_FIELDS)
    .populate('reviewedBy', ACTOR_FIELDS)
    .populate('approvedBy', ACTOR_FIELDS)
    .populate('paidBy', ACTOR_FIELDS);
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  res.status(200).json({ success: true, record: payroll });
});

// PATCH /api/payroll/:id
export const updatePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  if (payroll.status === 'PAID') throw ApiError.conflict('A paid payroll cannot be edited');

  const components = [...PAYROLL_EARNING_FIELDS, ...PAYROLL_DEDUCTION_FIELDS];
  components.forEach((field) => {
    if (req.body[field] !== undefined) payroll[field] = Number(req.body[field]) || 0;
  });
  if (req.body.workingDays !== undefined) payroll.workingDays = Math.max(0, Number(req.body.workingDays) || 0);
  if (req.body.paidDays !== undefined) payroll.paidDays = Math.max(0, Number(req.body.paidDays) || 0);
  if (req.body.note !== undefined) payroll.note = req.body.note;
  if (req.body.payDate !== undefined) payroll.payDate = req.body.payDate || null;

  Object.assign(payroll, computeTotals(payroll));
  await payroll.save();
  await payroll.populate('employee', EMPLOYEE_FIELDS);

  res.status(200).json({ success: true, message: 'Payroll updated', record: payroll });
});

// DELETE /api/payroll/:id
export const deletePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  if (payroll.status !== 'DRAFT') throw ApiError.conflict('Only draft payroll records can be deleted');
  await payroll.deleteOne();
  res.status(200).json({ success: true, message: 'Payroll record deleted' });
});

// POST /api/payroll/:id/process|review|approve|pay
export const transitionPayroll = (action) =>
  asyncHandler(async (req, res) => {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) throw ApiError.notFound('Payroll record not found');
    if (req.body.note !== undefined) payroll.note = req.body.note;
    await applyTransition(payroll, action, req.user);
    await payroll.populate('employee', EMPLOYEE_FIELDS);
    res.status(200).json({
      success: true,
      message: `Payroll marked as ${PAYROLL_STATUS_LABELS[payroll.status]}`,
      record: payroll,
    });
  });

// POST /api/payroll/:id/revert
export const revertPayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  await applyRevert(payroll);
  await payroll.populate('employee', EMPLOYEE_FIELDS);
  res.status(200).json({ success: true, message: 'Payroll moved back to draft', record: payroll });
});
