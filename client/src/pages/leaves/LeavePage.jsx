import { useState } from 'react';
import { CalendarDays, Settings2, CheckSquare, UserCircle2 } from 'lucide-react';
import useLeave from '../../hooks/useLeave';
import ApplyLeaveModal from '../../components/leaves/ApplyLeaveModal';
import LeaveCancelModal from '../../components/leaves/LeaveCancelModal';
import LeaveDecisionModal from '../../components/leaves/LeaveDecisionModal';
import LeaveRequestsPanel from '../../components/leaves/LeaveRequestsPanel';
import LeaveStats from '../../components/leaves/LeaveStats';
import LeaveTypeModal from '../../components/leaves/LeaveTypeModal';
import LeaveTypePanel from '../../components/leaves/LeaveTypePanel';
import MyLeavePanel from '../../components/leaves/MyLeavePanel';

export default function LeavePage() {
  const leave = useLeave();
  const [tab, setTab] = useState('mine');

  const [applyOpen, setApplyOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [decision, setDecision] = useState({ open: false, mode: 'approve', request: null });
  const [typeModal, setTypeModal] = useState({ open: false, initial: null });

  const tabs = [
    { key: 'mine', label: 'My Leave', icon: UserCircle2 },
    leave.canApprove && { key: 'approvals', label: 'Approvals', icon: CheckSquare },
    leave.canConfigure && { key: 'config', label: 'Configuration', icon: Settings2 },
  ].filter(Boolean);

  const handleDecision = async (note) => {
    const { mode, request } = decision;
    const ok =
      mode === 'approve'
        ? await leave.approveLeave(request._id, note)
        : await leave.rejectLeave(request._id, note);
    if (ok) setDecision({ open: false, mode: 'approve', request: null });
  };

  const handleDeleteType = (type) => {
    if (window.confirm(`Remove or deactivate the "${type.name}" leave type?`)) {
      leave.removeLeaveType(type._id);
    }
  };

  return (
    <div className="hub stack-lg leave-page">
      <header className="hub__pagehead">
        <span className="hub__pagehead-icon">
          <CalendarDays size={18} />
        </span>
        <div>
          <h1>Leave</h1>
          <p>Balances, applications, approvals and leave configuration</p>
        </div>
        <div className="ms-auto">
          <select
            className="form-select form-select-sm"
            value={leave.year}
            onChange={(event) => leave.setYear(Number(event.target.value))}
          >
            {leave.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </header>

      {leave.error && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {leave.error}
        </div>
      )}

      <div className="leave-tabs">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            type="button"
            key={key}
            className={`leave-tab ${tab === key ? 'is-active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'mine' && (
        <>
          <LeaveStats totals={leave.totals} />
          {leave.loading ? (
            <div className="leave-empty">
              <span className="spinner-border spinner-border-sm" />{' '}
              <span className="ms-2">Loading your leave…</span>
            </div>
          ) : (
            <MyLeavePanel
              balances={leave.balances}
              requests={leave.myRequests}
              busy={leave.busy}
              onApply={() => setApplyOpen(true)}
              onCancel={(request) => setCancelTarget(request)}
            />
          )}
        </>
      )}

      {tab === 'approvals' && (
        <LeaveRequestsPanel
          requests={leave.requests}
          summary={leave.requestSummary}
          pagination={leave.pagination}
          filters={leave.filters}
          setFilters={leave.setFilters}
          loading={leave.loadingRequests}
          busy={leave.busy}
          onApprove={(request) => setDecision({ open: true, mode: 'approve', request })}
          onReject={(request) => setDecision({ open: true, mode: 'reject', request })}
        />
      )}

      {tab === 'config' && (
        <LeaveTypePanel
          types={leave.allTypes}
          loading={leave.loadingTypes}
          busy={leave.busy}
          onNew={() => setTypeModal({ open: true, initial: null })}
          onEdit={(type) => setTypeModal({ open: true, initial: type })}
          onDelete={handleDeleteType}
        />
      )}

      <ApplyLeaveModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSubmit={leave.applyLeave}
        types={leave.applyTypes}
        balances={leave.balances}
      />

      <LeaveCancelModal
        open={Boolean(cancelTarget)}
        request={cancelTarget}
        saving={leave.busy === `cancel-${cancelTarget?._id}`}
        onClose={() => setCancelTarget(null)}
        onSubmit={async (reason) => {
          const ok = await leave.cancelLeave(cancelTarget._id, reason);
          if (ok) setCancelTarget(null);
        }}
      />

      <LeaveDecisionModal
        open={decision.open}
        mode={decision.mode}
        request={decision.request}
        saving={leave.busy === `decide-${decision.request?._id}`}
        onClose={() => setDecision({ open: false, mode: 'approve', request: null })}
        onSubmit={handleDecision}
      />

      <LeaveTypeModal
        open={typeModal.open}
        initial={typeModal.initial}
        saving={leave.busy === 'type'}
        onClose={() => setTypeModal({ open: false, initial: null })}
        onSubmit={async (payload, id) => {
          const ok = await leave.saveLeaveType(payload, id);
          if (ok) setTypeModal({ open: false, initial: null });
        }}
      />
    </div>
  );
}
