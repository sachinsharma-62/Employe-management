import mongoose from 'mongoose';
import { PAYROLL_STATUSES } from '../utils/enums.js';
import { computeTotals, DEFAULT_CURRENCY } from '../utils/payroll.js';

const amount = { type: Number, default: 0, min: 0 };

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: { type: String, required: [true, 'Payroll month is required'], trim: true },
    currency: { type: String, trim: true, default: DEFAULT_CURRENCY },
    department: { type: String, trim: true, default: '', index: true },

    // ---- Earnings ----
    basic: amount,
    hra: amount,
    conveyance: amount,
    specialAllowance: amount,
    bonus: amount,
    incentives: amount,
    overtime: amount,

    // ---- Deductions ----
    pf: amount,
    esi: amount,
    professionalTax: amount,
    tds: amount,
    loanDeduction: amount,
    otherDeduction: amount,

    // ---- Attendance / days ----
    workingDays: { type: Number, default: 0, min: 0 },
    paidDays: { type: Number, default: 0, min: 0 },

    // ---- Computed ----
    grossSalary: amount,
    totalEarnings: amount,
    totalDeductions: amount,
    netSalary: amount,

    status: {
      type: String,
      enum: {
        values: PAYROLL_STATUSES,
        message: 'Invalid payroll status: {VALUE}',
      },
      default: 'DRAFT',
      index: true,
    },
    payDate: { type: Date, default: null },
    note: { type: String, trim: true, default: '' },

    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },

    // ---- Payslip delivery ----
    sentAt: { type: Date, default: null },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastSentTo: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

payrollSchema.index({ employee: 1, month: -1 }, { unique: true });

// Keep the derived totals in sync whenever components change.
payrollSchema.pre('validate', function syncTotals(next) {
  Object.assign(this, computeTotals(this));
  next();
});

// Backwards-compatible aliases used by the employee profile view/export.
payrollSchema.virtual('netPay').get(function netPay() {
  return this.netSalary;
});
payrollSchema.virtual('allowances').get(function allowances() {
  return (this.conveyance || 0) + (this.specialAllowance || 0);
});
payrollSchema.virtual('deductions').get(function deductions() {
  return (this.pf || 0) + (this.esi || 0) + (this.professionalTax || 0) + (this.loanDeduction || 0) + (this.otherDeduction || 0);
});
payrollSchema.virtual('tax').get(function tax() {
  return this.tds || 0;
});

export default mongoose.model('Payroll', payrollSchema);
