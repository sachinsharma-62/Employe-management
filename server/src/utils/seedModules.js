import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Payroll from '../models/Payroll.js';
import SalaryStructure from '../models/SalaryStructure.js';
import PerformanceReview from '../models/PerformanceReview.js';
import Goal from '../models/Goal.js';
import Asset from '../models/Asset.js';
import EmployeeDocument from '../models/EmployeeDocument.js';
import EmployeeNote from '../models/EmployeeNote.js';
import ActivityLog from '../models/ActivityLog.js';
import { computeAttendance } from './attendance.js';
import { computeTotals, countWorkingDays } from './payroll.js';

const rng = (seed) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const weekdaysBack = (count) => {
  const days = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);
  while (days.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return days;
};

const buildAttendance = (employee) => {
  const records = [];
  const days = weekdaysBack(40);
  days.forEach((date, index) => {
    let status = 'PRESENT';
    if (index % 11 === 3) status = 'ABSENT';
    else if (index % 7 === 2) status = 'WFH';
    else if (index % 17 === 5) status = 'HALF_DAY';
    else if (index % 23 === 9) status = 'LEAVE';
    else if (index % 9 === 4) status = 'LATE';

    const absent = status === 'ABSENT' || status === 'LEAVE';
    const late = status === 'LATE';
    const half = status === 'HALF_DAY';
    const checkIn = absent ? '' : late ? '10:05' : half ? '09:30' : '09:15';
    const checkOut = absent ? '' : half ? '13:30' : index % 5 === 0 ? '19:15' : '18:30';

    records.push({
      employee: employee._id,
      date,
      status,
      workMode: status === 'WFH' ? 'WFH' : 'OFFICE',
      checkIn,
      checkOut,
      note: status === 'WFH' ? 'Worked from home' : late ? 'Reached office late' : '',
      ...computeAttendance({ checkIn, checkOut, status }),
    });
  });
  return records;
};

const buildLeaves = (employee, rand, index) => {
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const start = new Date();
  start.setDate(start.getDate() - 20 + index * 3);

  const make = (offsetDays, lengthDays, type, status, attachment) => {
    const from = new Date(start);
    from.setDate(from.getDate() - offsetDays);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + lengthDays - 1);
    return {
      employee: employee._id,
      type,
      fromDate: from,
      toDate: to,
      days: lengthDays,
      leaveYear: from.getFullYear(),
      reason:
        type === 'SICK'
          ? 'Fever and rest advised'
          : type === 'WFH'
          ? 'Working remotely this week'
          : 'Personal commitments',
      attachment: attachment || {},
      status,
      appliedAt: new Date(from.getTime() - 3 * 86400000),
      decidedBy: status === 'PENDING' ? null : employee._id,
      decidedAt: status === 'PENDING' ? null : new Date(from.getTime() - 2 * 86400000),
      decisionNote:
        status === 'APPROVED' ? 'Approved, enjoy your time off' : status === 'REJECTED' ? 'Team bandwidth low' : '',
    };
  };

  return [
    make(40, 2, 'CASUAL', 'APPROVED'),
    make(18, 1, 'SICK', 'APPROVED', {
      url: DUMMY_PDF,
      name: 'medical-certificate.pdf',
      mimeType: 'application/pdf',
      size: 145000,
    }),
    make(5, 3, pick(['EARNED', 'CASUAL', 'UNPAID', 'WFH']), 'PENDING'),
    make(70, 2, 'CASUAL', 'REJECTED'),
  ];
};

const WORKFLOW_CYCLE = ['DRAFT', 'PROCESSED', 'IN_REVIEW', 'APPROVED', 'PAID'];

const buildSalaryStructure = (employee, index) => {
  const basic = 42000 + index * 1800;
  return {
    employee: employee._id,
    currency: 'INR',
    effectiveFrom: employee.joiningDate || new Date(),
    basic,
    hra: Math.round(basic * 0.4),
    conveyance: 1600,
    specialAllowance: 6000 + (index % 3) * 500,
    bonus: 0,
    incentives: 0,
    overtime: 0,
    pf: Math.round(basic * 0.12),
    esi: Math.round(basic * 0.0075),
    professionalTax: 200,
    tds: Math.round(basic * 0.11),
    loanDeduction: 0,
    otherDeduction: 0,
  };
};

const buildPayroll = (employee, index) => {
  const records = [];
  const now = new Date();
  const structure = buildSalaryStructure(employee, index);
  for (let m = 0; m < 6; m += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const incentive = m % 4 === 1 ? 2500 : 0;
    const bonus = m === 2 ? 8000 : 0;
    const overtime = 0;
    const workingDays = countWorkingDays(monthKey(date));
    const record = {
      employee: employee._id,
      month: monthKey(date),
      department: employee.department || '',
      currency: 'INR',
      basic: structure.basic,
      hra: structure.hra,
      conveyance: structure.conveyance,
      specialAllowance: structure.specialAllowance,
      bonus,
      incentives: incentive,
      overtime,
      pf: structure.pf,
      esi: structure.esi,
      professionalTax: structure.professionalTax,
      tds: structure.tds,
      loanDeduction: structure.loanDeduction,
      otherDeduction: structure.otherDeduction,
      workingDays,
      paidDays: workingDays,
      status: m === 0 ? 'DRAFT' : WORKFLOW_CYCLE[m % WORKFLOW_CYCLE.length],
      payDate: m === 0 ? null : new Date(date.getFullYear(), date.getMonth(), 28),
    };
    records.push({ ...record, ...computeTotals(record) });
  }
  return records;
};

const buildPerformance = (employee, rand) => {
  const cycles = ['FY 2024-25', 'FY 2025-26'];
  return cycles.map((cycle, i) => {
    const rating = Math.round((3.2 + rand() * 1.8) * 10) / 10;
    const start = new Date(`${2024 + i}-04-01`);
    const end = new Date(`${2025 + i}-03-31`);
    return {
      employee: employee._id,
      cycle,
      periodStart: start,
      periodEnd: end,
      reviewer: employee.manager || null,
      rating,
      summary:
        rating >= 4
          ? 'Consistently exceeds expectations and mentors peers effectively.'
          : 'Meets expectations with steady delivery across assigned initiatives.',
      strengths: 'Ownership, collaboration, and attention to detail.',
      improvements: rating >= 4 ? 'Continue building cross-team leadership.' : 'Increase proactive communication.',
      status: i === 1 ? 'IN_REVIEW' : 'COMPLETED',
      reviewedAt: i === 1 ? null : end,
    };
  });
};

const buildGoals = (employee, rand) => {
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const due = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  };
  const templates = [
    { title: 'Ship quarterly product milestone', category: 'BUSINESS', status: 'IN_PROGRESS', progress: 65 },
    { title: 'Complete cloud certification', category: 'TECHNICAL', status: 'COMPLETED', progress: 100 },
    { title: 'Mentor two junior teammates', category: 'LEADERSHIP', status: 'AT_RISK', progress: 30 },
    { title: 'Improve system test coverage', category: 'TECHNICAL', status: 'IN_PROGRESS', progress: 50 },
    { title: 'Healthy work-life balance', category: 'PERSONAL', status: 'NOT_STARTED', progress: 0 },
  ];
  return templates
    .map((tpl, i) => ({
      ...tpl,
      employee: employee._id,
      description: `${tpl.title} for the current appraisal cycle.`,
      weight: 20,
      startDate: due(-60 + i * 5),
      dueDate: due(30 + i * 20),
      status: i === 4 ? pick(['NOT_STARTED', 'IN_PROGRESS']) : tpl.status,
    }))
    .slice(0, 4);
};

const buildAssets = (employee, index) => {
  const records = [
    {
      employee: employee._id,
      name: 'MacBook Pro 14"',
      type: 'LAPTOP',
      serialNumber: `MBP-${1200 + index}`,
      condition: 'GOOD',
      status: 'ASSIGNED',
      assignedDate: employee.joiningDate || new Date(),
    },
  ];
  if (index % 2 === 0) {
    records.push({
      employee: employee._id,
      name: 'Dell UltraSharp 27"',
      type: 'MONITOR',
      serialNumber: `MON-${3300 + index}`,
      condition: 'NEW',
      status: 'ASSIGNED',
      assignedDate: employee.joiningDate || new Date(),
    });
  }
  if (index % 3 === 0) {
    records.push({
      employee: employee._id,
      name: 'iPhone 15',
      type: 'PHONE',
      serialNumber: `PH-${8800 + index}`,
      condition: 'GOOD',
      status: 'RETURNED',
      assignedDate: new Date(Date.now() - 300 * 86400000),
      returnedDate: new Date(Date.now() - 30 * 86400000),
    });
  }
  return records;
};

const DUMMY_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const buildDocuments = (employee) => {
  const doc = (title, documentType, category, fileName, verificationStatus, expiryDate = null) => ({
    employee: employee._id,
    title,
    documentType,
    category,
    fileName,
    fileUrl: DUMMY_PDF,
    mimeType: 'application/pdf',
    size: 92000,
    uploadedBy: employee._id,
    verificationStatus,
    status: 'ACTIVE',
    expiryDate,
  });

  return [
    doc('Aadhaar Card', 'AADHAAR', 'IDENTITY', 'aadhaar.pdf', 'VERIFIED'),
    doc('PAN Card', 'PAN', 'IDENTITY', 'pan-card.pdf', 'VERIFIED'),
    doc('Updated Resume', 'RESUME', 'OTHER', 'resume.pdf', 'PENDING'),
    doc('Offer Letter', 'OFFER_LETTER', 'CONTRACT', 'offer-letter.pdf', 'VERIFIED'),
    doc(
      'Passport',
      'PASSPORT',
      'IDENTITY',
      'passport.pdf',
      'PENDING',
      new Date(new Date().getFullYear() + 2, 5, 30)
    ),
  ];
};

const buildNotes = (employee, author) => [
  {
    employee: employee._id,
    author: author._id,
    body: `${employee.firstName} has been a dependable team member. Recommended for the upcoming leadership track.`,
    visibility: 'HR',
  },
];

const buildActivity = (employee, author) => {
  const now = Date.now();
  return [
    {
      employee: employee._id,
      actor: author._id,
      type: 'profile',
      action: 'Profile created',
      description: `${employee.fullName} was added to the directory`,
      createdAt: new Date(now - 90 * 86400000),
    },
    {
      employee: employee._id,
      actor: author._id,
      type: 'employment',
      action: 'Department assigned',
      description: `Assigned to ${employee.department || 'the team'}`,
      createdAt: new Date(now - 45 * 86400000),
    },
    {
      employee: employee._id,
      actor: employee._id,
      type: 'document',
      action: 'Document uploaded',
      description: `${employee.fullName} uploaded "Signed Employment Contract"`,
      createdAt: new Date(now - 20 * 86400000),
    },
    {
      employee: employee._id,
      actor: author._id,
      type: 'note',
      action: 'Note added',
      description: `${author.fullName} added a note`,
      createdAt: new Date(now - 5 * 86400000),
    },
    {
      employee: employee._id,
      actor: author._id,
      type: 'goal',
      action: 'Goal updated',
      description: 'Progress on "Ship quarterly product milestone" set to 65%',
      createdAt: new Date(now - 2 * 86400000),
    },
  ];
};

const seedEmployeeModules = async () => {
  const users = await User.find({}).sort('createdAt');
  if (users.length === 0) return { users: 0 };

  await Promise.all([
    Attendance.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Payroll.deleteMany({}),
    SalaryStructure.deleteMany({}),
    PerformanceReview.deleteMany({}),
    Goal.deleteMany({}),
    Asset.deleteMany({}),
    EmployeeDocument.deleteMany({}),
    EmployeeNote.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  const admin = users.find((u) => u.role === 'SUPER_ADMIN') || users[0];

  for (let i = 0; i < users.length; i += 1) {
    const employee = users[i];
    const rand = rng(1000 + i * 7);

    await Attendance.insertMany(buildAttendance(employee));
    await LeaveRequest.insertMany(buildLeaves(employee, rand, i));
    await SalaryStructure.create(buildSalaryStructure(employee, i));
    await Payroll.insertMany(buildPayroll(employee, i));
    await PerformanceReview.insertMany(buildPerformance(employee, rand));
    await Goal.insertMany(buildGoals(employee, rand));
    await Asset.insertMany(buildAssets(employee, i));
    await EmployeeDocument.insertMany(buildDocuments(employee));
    await EmployeeNote.insertMany(buildNotes(employee, admin));
    await ActivityLog.insertMany(buildActivity(employee, admin));
  }

  return { users: users.length };
};

export default seedEmployeeModules;
