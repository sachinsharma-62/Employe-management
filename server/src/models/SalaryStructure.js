import mongoose from 'mongoose';
import { computeTotals, DEFAULT_CURRENCY } from '../utils/payroll.js';

const amount = { type: Number, default: 0, min: 0 };

const salaryStructureSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    currency: { type: String, trim: true, default: DEFAULT_CURRENCY },
    effectiveFrom: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },

    // ---- Earning components (monthly) ----
    basic: amount,
    hra: amount,
    conveyance: amount,
    specialAllowance: amount,
    bonus: amount,
    incentives: amount,
    overtime: amount,

    // ---- Deduction components (monthly) ----
    pf: amount,
    esi: amount,
    professionalTax: amount,
    tds: amount,
    loanDeduction: amount,
    otherDeduction: amount,

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

salaryStructureSchema.virtual('monthlyGross').get(function monthlyGross() {
  return computeTotals(this).grossSalary;
});

salaryStructureSchema.virtual('monthlyNet').get(function monthlyNet() {
  return computeTotals(this).netSalary;
});

salaryStructureSchema.virtual('annualCtc').get(function annualCtc() {
  return Math.round(computeTotals(this).grossSalary * 12 * 100) / 100;
});

export default mongoose.model('SalaryStructure', salaryStructureSchema);
