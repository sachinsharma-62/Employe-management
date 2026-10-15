const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Operations',
  'Finance',
  'Human Resources',
  'Customer Success',
  'Design',
];

const DEPT_WEIGHTS = [30, 16, 12, 12, 10, 8, 7, 5];

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Ananya', 'Diya', 'Ishaan', 'Kavya', 'Rohan',
  'Saanvi', 'Vihaan', 'Anika', 'Arjun', 'Meera', 'Karthik', 'Priya', 'Rahul',
  'Sneha', 'Yash', 'Neha', 'Varun', 'Alex', 'Jordan', 'Taylor', 'Morgan',
  'Casey', 'Riley', 'Sam', 'Jamie', 'Avery', 'Quinn', 'Nisha', 'Dev',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Iyer', 'Nair', 'Reddy', 'Patel', 'Gupta', 'Mehta',
  'Kapoor', 'Singh', 'Rao', 'Das', 'Bose', 'Joshi', 'Menon', 'Chopra',
  'Malhotra', 'Bhat', 'Pillai', 'Sinha', 'Khan', 'Dutta', 'Roy', 'Saxena',
];

const DESIGNATIONS = {
  Engineering: ['Software Engineer', 'Senior Engineer', 'Tech Lead', 'QA Engineer', 'DevOps Engineer', 'Engineering Manager'],
  Sales: ['Sales Executive', 'Account Manager', 'Sales Lead', 'Business Development'],
  Marketing: ['Marketing Executive', 'Content Strategist', 'SEO Analyst', 'Brand Manager'],
  Operations: ['Operations Executive', 'Operations Manager', 'Facilities Lead'],
  Finance: ['Accountant', 'Financial Analyst', 'Payroll Executive', 'Finance Manager'],
  'Human Resources': ['HR Executive', 'HR Manager', 'Recruiter', 'People Partner'],
  'Customer Success': ['CS Executive', 'CS Manager', 'Support Engineer'],
  Design: ['UI Designer', 'UX Designer', 'Product Designer', 'Design Lead'],
};

const STATUSES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];

export const CHART_COLORS = [
  '#4f46e5', '#16a34a', '#f59e0b', '#0891b2',
  '#7c3aed', '#e11d48', '#db2777', '#0d9488',
];

export const STATUS_LABELS = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
};

const DEPT_TONES = {
  Engineering: 'indigo',
  Sales: 'green',
  Marketing: 'amber',
  Operations: 'cyan',
  Finance: 'purple',
  'Human Resources': 'rose',
  'Customer Success': 'teal',
  Design: 'orange',
};

const rand01 = (n) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const intBetween = (seed, min, max) =>
  Math.floor(min + rand01(seed) * (max - min + 1));

const pick = (arr, seed) => arr[Math.floor(rand01(seed) * arr.length) % arr.length];

const weightedDepartment = (seed) => {
  const roll = rand01(seed) * 100;
  let acc = 0;
  for (let i = 0; i < DEPARTMENTS.length; i += 1) {
    acc += DEPT_WEIGHTS[i];
    if (roll <= acc) return DEPARTMENTS[i];
  }
  return DEPARTMENTS[0];
};

const NOW = new Date();

const buildEmployees = () => {
  const list = [];
  for (let i = 0; i < 128; i += 1) {
    const department = weightedDepartment(i + 1);
    const gender = rand01(i + 13) < 0.58 ? 'male' : 'female';
    const statusRoll = rand01(i + 29);
    const status =
      statusRoll < 0.68
        ? STATUSES[0]
        : statusRoll < 0.78
          ? STATUSES[1]
          : statusRoll < 0.9
            ? STATUSES[2]
            : STATUSES[3];

    let joinDate;
    if (i < 11) {
      joinDate = new Date(NOW.getFullYear(), NOW.getMonth(), intBetween(i + 101, 1, 27));
    } else {
      const year = NOW.getFullYear() - intBetween(i + 53, 0, 4);
      const month = intBetween(i + 61, 0, 11);
      const day = intBetween(i + 67, 1, 28);
      joinDate = new Date(year, month, day);
    }

    const first = pick(FIRST_NAMES, i + 89);
    const last = pick(LAST_NAMES, i + 97);

    list.push({
      id: `emp-${i + 1}`,
      firstName: first,
      lastName: last,
      fullName: `${first} ${last}`,
      email: `${first}.${last}${i + 1}@office.com`.toLowerCase(),
      avatar: '',
      department,
      gender,
      status,
      isActive: rand01(i + 41) < 0.9,
      joinDate,
      dobMonth: intBetween(i + 71, 0, 11),
      dobDay: intBetween(i + 79, 1, 28),
      designation: pick(DESIGNATIONS[department], i + 83),
    });
  }
  return list;
};

const EMPLOYEES = buildEmployees();

const HOLIDAYS = [
  { name: "New Year's Day", month: 0, day: 1, type: 'Public' },
  { name: 'Republic Day', month: 0, day: 26, type: 'National' },
  { name: 'Holi', month: 2, day: 14, type: 'Festival' },
  { name: 'Labour Day', month: 4, day: 1, type: 'Public' },
  { name: 'Independence Day', month: 7, day: 15, type: 'National' },
  { name: 'Gandhi Jayanti', month: 9, day: 2, type: 'National' },
  { name: 'Diwali', month: 10, day: 12, type: 'Festival' },
  { name: 'Christmas', month: 11, day: 25, type: 'Festival' },
];

const startOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const nextOccurrence = (month, day, from) => {
  const base = startOfDay(from);
  let next = new Date(base.getFullYear(), month, day);
  if (next < base) next = new Date(base.getFullYear() + 1, month, day);
  return next;
};

const daysBetween = (from, to) =>
  Math.round((startOfDay(to) - startOfDay(from)) / 86400000);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const hash = (key, min, max) => {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const v = ((h >>> 0) % 1000) / 1000;
  return Math.round(min + v * (max - min));
};

const ACTIVITY_TEMPLATES = [
  { type: 'join', message: 'Dev Malhotra accepted the offer for Senior Engineer', minutes: 14 },
  { type: 'leave', message: 'Priya Nair applied for 2 days of casual leave', minutes: 52 },
  { type: 'attendance', message: 'Attendance regularisation requested by Karthik Rao', minutes: 96 },
  { type: 'promotion', message: 'Meera Joshi was promoted to Tech Lead', minutes: 180 },
  { type: 'payroll', message: 'March payroll was processed for 128 employees', minutes: 320 },
  { type: 'birthday', message: 'Today is Ananya Mehta\u2019s birthday \u2014 wish her well!', minutes: 420 },
  { type: 'leave', message: 'Rohan Singh\u2019s sick leave was approved', minutes: 610 },
  { type: 'join', message: 'Nisha Verma joined the Design team', minutes: 900 },
];

const NOTIFICATIONS = [
  { title: '5 leave requests need approval', message: 'Pending since yesterday', tone: 'amber', minutes: 8, unread: true },
  { title: 'Attendance anomalies detected', message: '3 employees with missed punch-out', tone: 'rose', minutes: 35, unread: true },
  { title: 'Payroll cycle closes in 2 days', message: 'Review and approve salary changes', tone: 'indigo', minutes: 140, unread: true },
  { title: 'New policy document published', message: 'Updated leave policy effective next month', tone: 'cyan', minutes: 300, unread: false },
  { title: 'Q1 performance reviews', message: '12 reviews pending your feedback', tone: 'purple', minutes: 560, unread: false },
];

const buildActivities = (department) =>
  ACTIVITY_TEMPLATES.filter(
    (a) => !department || department === 'all' || !a.message.match(/Dev|Priya|Karthik|Nisha/)
  ).map((a, i) => ({
    id: `act-${i + 1}`,
    type: a.type,
    message: a.message,
    at: new Date(Date.now() - a.minutes * 60000).toISOString(),
  }));

const buildNotifications = () =>
  NOTIFICATIONS.map((n, i) => ({
    id: `notif-${i + 1}`,
    title: n.title,
    message: n.message,
    tone: n.tone,
    unread: n.unread,
    at: new Date(Date.now() - n.minutes * 60000).toISOString(),
  }));

export const getDepartmentNames = () => [...DEPARTMENTS];

export const buildDashboard = (params = {}) => {
  const selectedDate = params.date ? new Date(params.date) : new Date(NOW);
  const safeDate = Number.isNaN(selectedDate.getTime()) ? new Date(NOW) : selectedDate;

  const monthValue =
    params.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, '0')}`;
  const [yearStr, monthStr] = monthValue.split('-');
  const periodYear = Number(yearStr);
  const periodMonth = Number(monthStr) - 1;

  const department = params.department && params.department !== 'all' ? params.department : null;
  const filtered = department
    ? EMPLOYEES.filter((e) => e.department === department)
    : EMPLOYEES;

  const total = filtered.length;
  const active = filtered.filter((e) => e.isActive).length;
  const newEmployees = filtered.filter((e) => {
    const d = new Date(e.joinDate);
    return d.getFullYear() === periodYear && d.getMonth() === periodMonth;
  }).length;

  const onLeave = Math.max(Math.round(total * 0.06), 1);
  const absent = Math.max(Math.round(total * 0.04), 1);
  const present = Math.max(total - onLeave - absent, 0);
  const late = Math.round(present * 0.09);
  const pendingLeaveRequests = Math.min(Math.round(total * 0.05) + 2, 24);
  const pendingAttendanceRequests = Math.min(Math.round(total * 0.03) + 1, 14);

  const baseCount = filtered.filter((e) => new Date(e.joinDate) < new Date(periodYear, 0, 1)).length;
  let running = baseCount;
  const growth = MONTHS.map((month, idx) => {
    const hires = filtered.filter((e) => {
      const d = new Date(e.joinDate);
      return d.getFullYear() === periodYear && d.getMonth() === idx;
    }).length;
    running += hires;
    return { month, employees: running, hires };
  });

  const attendance = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(safeDate);
    d.setDate(d.getDate() - i);
    const key = `${d.toISOString().slice(0, 10)}-${department || 'all'}`;
    const leave = total ? hash(`${key}-leave`, Math.round(total * 0.03), Math.round(total * 0.09)) : 0;
    const away = total ? hash(`${key}-absent`, Math.round(total * 0.02), Math.round(total * 0.05)) : 0;
    const presentCount = Math.max(total - leave - away, 0);
    const lateCount = Math.round(presentCount * (0.05 + rand01(d.getDate() + 3) * 0.08));
    attendance.push({
      day: WEEKDAYS[d.getDay()],
      date: d.toISOString().slice(0, 10),
      present: presentCount,
      absent: away,
      late: lateCount,
      leave,
    });
  }

  const leaveTypeDefs = [
    { name: 'Casual Leave', weight: 0.36, tone: 'indigo' },
    { name: 'Sick Leave', weight: 0.24, tone: 'rose' },
    { name: 'Earned Leave', weight: 0.2, tone: 'green' },
    { name: 'Unpaid Leave', weight: 0.12, tone: 'amber' },
    { name: 'Others', weight: 0.08, tone: 'cyan' },
  ];
  const leaveBase = Math.max(Math.round(total * 0.45), 8);
  const leaveStats = leaveTypeDefs.map((t) => ({
    name: t.name,
    value: Math.max(Math.round(leaveBase * t.weight), 1),
  }));

  const departments = DEPARTMENTS.map((name) => ({
    name,
    value: EMPLOYEES.filter((e) => e.department === name).length,
    tone: DEPT_TONES[name],
    highlight: name === department,
  }));

  const male = filtered.filter((e) => e.gender === 'male').length;
  const gender = [
    { name: 'Male', value: male },
    { name: 'Female', value: total - male },
  ];

  const employmentStatus = STATUSES.map((status) => ({
    name: STATUS_LABELS[status],
    value: filtered.filter((e) => e.status === status).length,
  })).filter((s) => s.value > 0);

  const upcomingFrom = (month, day) => nextOccurrence(month, day, safeDate);

  const birthdays = [...filtered]
    .map((e) => {
      const next = upcomingFrom(e.dobMonth, e.dobDay);
      return { employee: e, daysLeft: daysBetween(safeDate, next), date: next };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  const anniversaries = [...filtered]
    .map((e) => {
      const joined = new Date(e.joinDate);
      const next = upcomingFrom(joined.getMonth(), joined.getDate());
      const years = next.getFullYear() - joined.getFullYear();
      return { employee: e, daysLeft: daysBetween(safeDate, next), date: next, years };
    })
    .filter((a) => a.years >= 1)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  const holidays = HOLIDAYS.map((h) => {
    const next = upcomingFrom(h.month, h.day);
    return { ...h, date: next, daysLeft: daysBetween(safeDate, next) };
  })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4);

  return {
    generatedAt: new Date().toISOString(),
    period: { year: periodYear, month: periodMonth, department: department || 'all', date: safeDate.toISOString() },
    stats: {
      totalEmployees: total,
      activeEmployees: active,
      newEmployees,
      presentToday: present,
      absentToday: absent,
      onLeave,
      lateEmployees: late,
      pendingLeaveRequests,
      pendingAttendanceRequests,
    },
    trends: {
      totalEmployees: { value: 4.2, dir: 'up', hint: 'vs last month' },
      activeEmployees: { value: 2.1, dir: 'up', hint: 'vs last month' },
      newEmployees: { value: 8.5, dir: 'up', hint: 'this month' },
      presentToday: { value: 1.4, dir: 'up', hint: 'vs yesterday' },
      absentToday: { value: 0.8, dir: 'down', hint: 'vs yesterday' },
      onLeave: { value: 0.3, dir: 'down', hint: 'vs last week' },
      lateEmployees: { value: 1.1, dir: 'up', hint: 'vs yesterday' },
      pendingLeaveRequests: { value: 3, dir: 'down', hint: 'since morning', suffix: '' },
      pendingAttendanceRequests: { value: 2, dir: 'up', hint: 'since morning', suffix: '' },
    },
    growth,
    attendance,
    leaveStats,
    departments,
    gender,
    employmentStatus,
    birthdays,
    anniversaries,
    holidays,
    activities: buildActivities(department),
    notifications: buildNotifications(),
  };
};
