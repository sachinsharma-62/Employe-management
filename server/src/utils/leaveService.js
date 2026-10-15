import mongoose from 'mongoose';
import LeaveType from '../models/LeaveType.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { LEAVE_STATUSES } from '../utils/enums.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const parseISODate = (iso) => {
  const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const toISODate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const resolveYear = (value) => {
  const year = Number(value);
  if (Number.isInteger(year) && year >= 2000 && year <= 2100) return year;
  return new Date().getFullYear();
};

// Inclusive calendar day count between two dates.
export const countDays = (from, to) => {
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
};

export const isActiveStatus = (status) => status === 'PENDING' || status === 'APPROVED';

export const isTypeApplicable = (type, employee) => {
  if (!type.isActive) return false;
  if (type.applicableScope === 'ALL') return true;
  if (type.applicableScope === 'ROLES') return type.applicableRoles.includes(employee.role);
  if (type.applicableScope === 'DEPARTMENTS') {
    return type.applicableDepartments.includes(employee.department);
  }
  if (type.applicableScope === 'EMPLOYEES') {
    return type.applicableEmployees.some((id) => String(id) === String(employee._id));
  }
  return false;
};

export const serializeLeaveType = (type) => {
  const doc = typeof type.toObject === 'function' ? type.toObject() : type;
  return {
    ...doc,
    id: String(doc._id),
    applicableScope: doc.applicableScope || 'ALL',
    unlimited: (doc.totalDays || 0) === 0,
    employeeCount: doc.applicableEmployees?.length || 0,
  };
};

const sumByType = (rows) => {
  const map = {};
  rows.forEach((row) => {
    map[row._id] = row.days;
  });
  return map;
};

// Compute per-type leave balances for an employee for a given year.
export const buildBalances = async (employee, year) => {
  const [types, yearRows, prevRows] = await Promise.all([
    LeaveType.find({ isActive: true }).sort({ code: 1 }),
    LeaveRequest.aggregate([
      {
        $match: {
          employee: new mongoose.Types.ObjectId(employee._id),
          leaveYear: Number(year),
          status: { $in: ['APPROVED', 'PENDING'] },
        },
      },
      { $group: { _id: { type: '$type', status: '$status' }, days: { $sum: '$days' } } },
    ]),
    LeaveRequest.aggregate([
      {
        $match: {
          employee: new mongoose.Types.ObjectId(employee._id),
          leaveYear: Number(year) - 1,
          status: 'APPROVED',
        },
      },
      { $group: { _id: '$type', days: { $sum: '$days' } } },
    ]),
  ]);

  const approved = {};
  const pending = {};
  yearRows.forEach((row) => {
    if (row._id.status === 'APPROVED') approved[row._id.type] = row.days;
    else pending[row._id.type] = row.days;
  });
  const prevUsed = sumByType(prevRows);

  const balances = types
    .filter((type) => isTypeApplicable(type, employee))
    .map((type) => {
      const entitlement = type.totalDays || 0;
      const unlimited = entitlement === 0;
      const used = approved[type.code] || 0;
      const pendingDays = pending[type.code] || 0;

      let carried = 0;
      if (type.carryForward && !unlimited) {
        const remaining = Math.max(entitlement - (prevUsed[type.code] || 0), 0);
        const limit = type.carryForwardLimit || 0;
        carried = limit > 0 ? Math.min(remaining, limit) : remaining;
      }

      const available = unlimited
        ? null
        : Math.max(entitlement + carried - used - pendingDays, 0);

      return {
        type: type.code,
        name: type.name,
        color: type.color,
        totalDays: entitlement,
        unlimited,
        carryForward: type.carryForward,
        carryForwardLimit: type.carryForwardLimit,
        encashable: type.encashable,
        entitlement: entitlement + carried,
        carried,
        used,
        pending: pendingDays,
        available,
      };
    });

  return balances;
};

export const summarizeBalances = (balances) => {
  const totals = balances.reduce(
    (acc, balance) => {
      acc.entitlement += balance.entitlement;
      acc.used += balance.used;
      acc.pending += balance.pending;
      if (balance.available !== null) acc.available += balance.available;
      acc.unlimited = acc.unlimited || balance.unlimited;
      return acc;
    },
    { entitlement: 0, used: 0, pending: 0, available: 0, unlimited: false }
  );
  return totals;
};

export const serializeRequest = (request) => {
  const doc = typeof request.toObject === 'function' ? request.toObject() : request;
  return {
    ...doc,
    id: String(doc._id),
    fromDateISO: toISODate(doc.fromDate),
    toDateISO: toISODate(doc.toDate),
    attachment: doc.attachment || {},
    hasAttachment: Boolean(doc.attachment?.url),
  };
};

export { LEAVE_STATUSES };
