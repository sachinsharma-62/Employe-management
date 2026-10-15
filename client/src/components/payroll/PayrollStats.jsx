import { BadgeIndianRupee, CheckCircle2, MinusCircle, Users, Wallet } from 'lucide-react';
import StatCard from '../dashboard/StatCard';
import { formatCurrency, formatMonthLong } from '../../utils/constants';

export default function PayrollStats({ summary, month }) {
  const counts = summary?.counts || {};
  const paid = counts.PAID || 0;
  const awaiting = (counts.DRAFT || 0) + (counts.PROCESSED || 0) + (counts.IN_REVIEW || 0);

  return (
    <div className="row g-3">
      <div className="col-6 col-xl-3">
        <StatCard
          icon={Users}
          tone="indigo"
          label="Employees"
          value={summary?.total ?? 0}
          trend={{ dir: 'up', value: formatMonthLong(month), suffix: '' }}
        />
      </div>
      <div className="col-6 col-xl-3">
        <StatCard
          icon={BadgeIndianRupee}
          tone="cyan"
          label="Total earnings"
          value={formatCurrency(summary?.totalEarnings || 0)}
        />
      </div>
      <div className="col-6 col-xl-3">
        <StatCard
          icon={MinusCircle}
          tone="rose"
          label="Total deductions"
          value={formatCurrency(summary?.totalDeductions || 0)}
        />
      </div>
      <div className="col-6 col-xl-3">
        <StatCard
          icon={Wallet}
          tone="green"
          label="Net payout"
          value={formatCurrency(summary?.totalNet || 0)}
          trend={{
            dir: 'up',
            value: `${paid} paid`,
            suffix: '',
            hint: awaiting ? `· ${awaiting} pending` : '',
          }}
        />
      </div>
    </div>
  );
}

export function WorkflowLegend({ counts = {} }) {
  const steps = ['DRAFT', 'PROCESSED', 'IN_REVIEW', 'APPROVED', 'PAID'];
  return (
    <div className="payroll-workflow">
      {steps.map((step, index) => (
        <div key={step} className="payroll-workflow__step">
          <span className={`payroll-workflow__dot payroll-workflow__dot--${step.toLowerCase()}`}>
            {step === 'PAID' ? <CheckCircle2 size={13} /> : index + 1}
          </span>
          <span className="payroll-workflow__label">{step.replace('_', ' ')}</span>
          <span className="payroll-workflow__count">{counts[step] || 0}</span>
        </div>
      ))}
    </div>
  );
}
