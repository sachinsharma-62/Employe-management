import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  BarChart3,
  Wallet,
  Wallet2,
  Layers,
} from 'lucide-react';
import usePayroll from '../../hooks/usePayroll';
import { addMonths, currentMonthKey } from '../../utils/constants';
import PayrollStats, { WorkflowLegend } from '../../components/payroll/PayrollStats';
import PayrollFilters from '../../components/payroll/PayrollFilters';
import PayrollTable from '../../components/payroll/PayrollTable';
import PayslipModal from '../../components/payroll/PayslipModal';
import PayslipHistoryModal from '../../components/payroll/PayslipHistoryModal';
import PayrollFormModal from '../../components/payroll/PayrollFormModal';
import GeneratePayrollModal from '../../components/payroll/GeneratePayrollModal';
import DepartmentPayroll from '../../components/payroll/DepartmentPayroll';
import SalaryStructurePanel from '../../components/payroll/SalaryStructurePanel';
import PayrollReports from '../../components/payroll/PayrollReports';

const TABS = [
  { id: 'payslips', label: 'Monthly payroll', icon: Wallet },
  { id: 'structures', label: 'Salary structures', icon: Layers },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

const BULK_ACTIONS = [
  { value: 'process', label: 'Process' },
  { value: 'review', label: 'Send to review' },
  { value: 'approve', label: 'Approve' },
  { value: 'pay', label: 'Mark as paid' },
  { value: 'send', label: 'Send payslips' },
  { value: 'revert', label: 'Revert to draft' },
];

export default function PayrollPage() {
  const [searchParams] = useSearchParams();
  const payroll = usePayroll({ initialMonth: searchParams.get('month') });
  const [tab, setTab] = useState('payslips');
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('process');
  const [view, setView] = useState(null);
  const [edit, setEdit] = useState(null);
  const [history, setHistory] = useState(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  const monthOptions = useMemo(() => {
    const current = currentMonthKey();
    return Array.from({ length: 12 }, (_, i) => addMonths(current, -i));
  }, []);

  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) =>
      prev.length === payroll.records.length ? [] : payroll.records.map((r) => r._id)
    );

  const runBulk = async () => {
    if (selected.length === 0) return;
    if (bulkAction === 'send') {
      const ok = await payroll.sendBulk({ ids: selected });
      if (ok) setSelected([]);
      return;
    }
    const ok = await payroll.bulk({ action: bulkAction, ids: selected });
    if (ok) setSelected([]);
  };

  const openHistory = (record) => {
    setHistory(record);
    if (record.employee?._id) payroll.loadHistory(record.employee._id);
  };

  const confirmDelete = (record) => {
    const name = record.employee
      ? `${record.employee.firstName} ${record.employee.lastName}`
      : 'this employee';
    if (window.confirm(`Delete the draft payslip for ${name}?`)) {
      payroll.deleteRecord(record._id);
    }
  };

  return (
    <div className="hub stack-lg payroll-page">
      <header className="hub__pagehead">
        <span className="hub__pagehead-icon">
          <Wallet2 size={18} />
        </span>
        <div>
          <h1>Payroll</h1>
          <p>Run monthly payroll, manage salary structures, approvals and reports</p>
        </div>
      </header>

      {payroll.error && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {payroll.error}
        </div>
      )}

      <PayrollStats summary={payroll.summary} month={payroll.filters.month} />
      <WorkflowLegend counts={payroll.summary?.counts} />

      <div className="payroll-tabs" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`payroll-tabs__tab ${tab === id ? 'is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'payslips' && (
        <>
          <PayrollFilters
            filters={payroll.filters}
            onChange={payroll.setFilter}
            onReset={payroll.resetFilters}
            monthOptions={monthOptions}
            canManage={payroll.canManage}
            generating={payroll.busy === 'generate'}
            onGenerate={() => setGenerateOpen(true)}
            onDownload={payroll.downloadReport}
          />

          {payroll.canManage && selected.length > 0 && (
            <div className="payroll-bulkbar">
              <span>{selected.length} selected</span>
              <select
                className="form-select form-select-sm"
                value={bulkAction}
                onChange={(event) => setBulkAction(event.target.value)}
              >
                {BULK_ACTIONS.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={runBulk}
                disabled={payroll.busy === `bulk-${bulkAction}`}
              >
                Apply to selected
              </button>
              <button type="button" className="btn btn-light btn-sm" onClick={() => setSelected([])}>
                Clear
              </button>
            </div>
          )}

          <section className="panel">
            <div className="panel__header">
              <h3>Payroll records</h3>
              <span className="panel__hint">{payroll.pagination.total} record(s)</span>
            </div>

            <PayrollTable
              records={payroll.records}
              loading={payroll.loading}
              busy={payroll.busy}
              canManage={payroll.canManage}
              selected={new Set(selected)}
              onToggle={toggleSelect}
              onToggleAll={toggleAll}
              onView={setView}
              onEdit={setEdit}
              onAdvance={payroll.advance}
              onRevert={payroll.revert}
              onDelete={confirmDelete}
              onDownload={payroll.downloadPayslip}
              onSend={payroll.sendPayslip}
              onHistory={openHistory}
            />

            {payroll.pagination.pages > 1 && (
              <div className="users-pagination">
                <span className="text-muted small">
                  Page {payroll.pagination.page} of {payroll.pagination.pages}
                </span>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-light btn-sm"
                    disabled={payroll.page <= 1}
                    onClick={() => payroll.setPage(payroll.page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-light btn-sm"
                    disabled={payroll.page >= payroll.pagination.pages}
                    onClick={() => payroll.setPage(payroll.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'structures' && <SalaryStructurePanel canManage={payroll.canManage} />}

      {tab === 'departments' && (
        <DepartmentPayroll
          departments={payroll.departments}
          month={payroll.filters.month}
          loading={payroll.loading}
        />
      )}

      {tab === 'reports' && (
        <PayrollReports
          report={payroll.report}
          loading={payroll.loadingReport}
          month={payroll.filters.month}
          onDownload={payroll.downloadReport}
        />
      )}

      <PayslipModal
        open={Boolean(view)}
        record={view}
        onClose={() => setView(null)}
        onDownload={() => view && payroll.downloadPayslip(view)}
      />

      <PayslipHistoryModal
        open={Boolean(history)}
        data={payroll.history}
        loading={payroll.loadingHistory}
        canManage={payroll.canManage}
        onClose={() => setHistory(null)}
        onView={setView}
        onDownload={payroll.downloadPayslip}
        onSend={payroll.sendPayslip}
      />

      <PayrollFormModal
        open={Boolean(edit)}
        record={edit}
        saving={payroll.busy === 'save'}
        onClose={() => setEdit(null)}
        onSubmit={async (payload, id) => {
          const ok = await payroll.saveRecord(id, payload);
          if (ok) setEdit(null);
        }}
      />

      <GeneratePayrollModal
        open={generateOpen}
        defaultMonth={payroll.filters.month}
        saving={payroll.busy === 'generate'}
        onClose={() => setGenerateOpen(false)}
        onSubmit={async (payload) => {
          const ok = await payroll.generate(payload);
          if (ok) setGenerateOpen(false);
        }}
      />
    </div>
  );
}
