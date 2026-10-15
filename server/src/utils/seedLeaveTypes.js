import LeaveType from '../models/LeaveType.js';

const LEAVE_TYPE_SEED = [
  {
    code: 'CASUAL',
    name: 'Casual Leave',
    description: 'Short personal leave for unplanned time off.',
    totalDays: 12,
    carryForward: true,
    carryForwardLimit: 5,
    encashable: false,
    color: 'indigo',
  },
  {
    code: 'SICK',
    name: 'Sick Leave',
    description: 'Leave for illness, medical appointments and recovery.',
    totalDays: 8,
    carryForward: false,
    encashable: false,
    color: 'amber',
  },
  {
    code: 'EARNED',
    name: 'Earned Leave',
    description: 'Accrued privilege leave that can be carried forward.',
    totalDays: 15,
    carryForward: true,
    carryForwardLimit: 10,
    encashable: true,
    color: 'green',
  },
  {
    code: 'PAID',
    name: 'Paid Leave',
    description: 'Fully paid time off for planned vacations.',
    totalDays: 6,
    carryForward: false,
    encashable: true,
    color: 'cyan',
  },
  {
    code: 'UNPAID',
    name: 'Unpaid Leave',
    description: 'Leave without pay — no yearly limit.',
    totalDays: 0,
    carryForward: false,
    encashable: false,
    color: 'secondary',
  },
  {
    code: 'WFH',
    name: 'Work From Home',
    description: 'Remote working day — no yearly limit.',
    totalDays: 0,
    carryForward: false,
    encashable: false,
    color: 'purple',
  },
];

const seedLeaveTypes = async () => {
  let created = 0;
  let updated = 0;

  for (const data of LEAVE_TYPE_SEED) {
    const existing = await LeaveType.findOne({ code: data.code });
    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      updated += 1;
      continue;
    }
    await LeaveType.create(data);
    created += 1;
  }

  return { created, updated, total: LEAVE_TYPE_SEED.length };
};

export default seedLeaveTypes;
