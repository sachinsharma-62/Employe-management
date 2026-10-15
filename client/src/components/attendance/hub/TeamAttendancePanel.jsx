import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Pencil,
  Search,
  Users,
} from 'lucide-react';
import attendanceApi from '../../../api/attendance.api';
import Avatar from '../../Avatar';
import ReviewCorrectionModal from '../ReviewCorrectionModal';
import EditAttendanceModal from '../EditAttendanceModal';
import AttendanceSessionsModal from './AttendanceSessionsModal';
import StatusBadge from './StatusBadge';
import { useToast } from '../../../context/ToastContext';
import {
  ATTENDANCE_STATUSES,
  DEPARTMENTS,
  attendanceStatusLabel,
  attendanceStatusTone,
  currentMonthKey,
  formatDate,
  formatDuration,
} from '../../../utils/constants';

const TONE_MAP = {
  success: 'success',
  danger: 'danger',
  warning: 'warning',
  info: 'teal',
  secondary: 'muted',
  primary: 'muted',
};

const NON_WORKING = ['ABSENT', 'LEAVE', 'HOLIDAY', 'NOT_CLOCKED_IN'];
const PAGE_SIZE = 15;

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const statusLabel = (value) =>
  value === 'WEEKLY_OFF' ? 'Weekly off' : attendanceStatusLabel(value);

const statusTone = (value) =>
  value === 'WEEKLY_OFF' ? 'muted' : TONE_MAP[attendanceStatusTone(value)] || 'muted';

export default function TeamAttendancePanel({ canManage }) {
  const toast = useToast();
  const [mode, setMode] = useState('roster');
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    status: '',
    month: currentMonthKey(),
    date: todayKey(),
  });
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [corrections, setCorrections] = useState([]);
  const [reviewing, setReviewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'roster') {
        const res = await attendanceApi.roster({
          date: filters.date || undefined,
          search: filters.search,
          department: filters.department,
          status: filters.status,
          page,
          limit: PAGE_SIZE,
        });
        setData(res.data);
      } else {
        const params = {
          search: filters.search,
          department: filters.department,
          status: filters.status,
          page,
          limit: PAGE_SIZE,
        };
        if (filters.date) {
          params.from = filters.date;
          params.to = filters.date;
        } else if (filters.month) {
          params.month = filters.month;
        }
        const res = await attendanceApi.list(params);
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Could not load attendance records');
    } finally {
      setLoading(false);
    }
  }, [filters, page, mode]);

  const loadCorrections = useCallback(async () => {
    try {
      const res = await attendanceApi.corrections({ status: 'PENDING', limit: 20 });
      setCorrections(res.data.corrections || []);
    } catch {
      /* non-blocking */
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadCorrections();
  }, [loadCorrections]);

  const updateFilter = (name, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [name]: value }));
  };

  const applySearch = () => {
    setPage(1);
    setFilters((f) => ({ ...f, search: searchInput.trim() }));
  };

  const reset = () => {
    setSearchInput('');
    setPage(1);
    setFilters({
      search: '',
      department: '',
      status: '',
      month: currentMonthKey(),
      date: todayKey(),
    });
  };

  const switchMode = (next) => {
    setPage(1);
    setMode(next);
  };

  const handleDecided = async () => {
    setReviewing(null);
    toast.success('Correction updated');
    await Promise.all([loadCorrections(), loadData()]);
  };

  const handleEdited = async () => {
    setEditing(null);
    await loadData();
  };

  const summary = data?.summary || {};
  const counts = summary.counts || {};
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };
  const rangeLabel =
    mode === 'roster' ? filters.date || todayKey() : filters.date || filters.month || 'All dates';

  const rows = (data?.records || []).map((rec) =>
    mode === 'roster'
      ? {
          id: rec.employee?._id,
          employee: rec.employee,
          date: rec.date,
          status: rec.status,
          firstCheckIn: rec.firstCheckIn,
          lastCheckOut: rec.lastCheckOut,
          sessionCount: rec.sessionCount,
          openSession: rec.openSession,
          hoursWorked: rec.hoursWorked,
          record: rec.record,
        }
      : { ...rec, id: rec._id, record: rec }
  );

  return (
    <div className="hub-team">
      <div className="hub-toolbar">
        <div className="hub-team__search">
          <Search size={15} />
          <input
            className="hub-input"
            placeholder="Search employee name or ID…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
          />
          <button type="button" className="hub-btn hub-btn--ghost" onClick={applySearch}>
            Search
          </button>
        </div>
        <label className="hub-team__field">
          <span className="hub-muted">Month</span>
          <input
            type="month"
            className="hub-input"
            value={filters.month}
            disabled={mode === 'roster' || Boolean(filters.date)}
            onChange={(e) => updateFilter('month', e.target.value)}
          />
        </label>
        <label className="hub-team__field">
          <span className="hub-muted">Date</span>
          <input
            type="date"
            className="hub-input"
            value={filters.date}
            onChange={(e) => updateFilter('date', e.target.value)}
          />
        </label>
        <select
          className="hub-select"
          value={filters.department}
          onChange={(e) => updateFilter('department', e.target.value)}
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="hub-select"
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
        >
          <option value="">All statuses</option>
          {ATTENDANCE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="button" className="hub-btn hub-btn--ghost" onClick={reset}>
          Reset
        </button>
        <div className="hub-toolbar__views">
          <button
            type="button"
            className={`hub-chip ${mode === 'roster' ? 'is-active' : ''}`}
            onClick={() => switchMode('roster')}
          >
            Daily roster
          </button>
          <button
            type="button"
            className={`hub-chip ${mode === 'records' ? 'is-active' : ''}`}
            onClick={() => switchMode('records')}
          >
            Monthly records
          </button>
        </div>
      </div>

      <div className="hub-team__chips">
        <span className="hub-muted">{rangeLabel}</span>
        {mode === 'roster' ? (
          <>
            <span className="hub-muted">
              Clocked in {summary.clockedIn || 0} / {summary.totalEmployees || 0}
            </span>
            <span className="hub-team__notclocked">
              Not clock in {summary.notClockedIn || 0}
            </span>
          </>
        ) : (
          <>
            <span className="hub-muted">Present {counts.PRESENT || 0}</span>
            <span className="hub-muted">Late {counts.LATE || 0}</span>
            <span className="hub-muted">WFH {counts.WFH || 0}</span>
            <span className="hub-muted">Absent {counts.ABSENT || 0}</span>
            <span className="hub-muted">Leave {counts.LEAVE || 0}</span>
            <span className="hub-team__hours">
              Total working hours {summary.totalHours ?? 0}h
            </span>
          </>
        )}
      </div>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="hub-empty">
          <p>{mode === 'roster' ? 'Loading employee roster…' : 'Loading attendance records…'}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="hub-empty">
          <p>
            {mode === 'roster'
              ? 'No employees match your filters.'
              : 'No attendance records match your filters.'}
          </p>
        </div>
      ) : (
        <>
          <div className="hub-table-wrap">
            <table className="hub-table">
              <thead>
                <tr>
                  <th scope="col">EMPLOYEE</th>
                  <th scope="col">DATE</th>
                  <th scope="col">STATUS</th>
                  <th scope="col">IN / OUT</th>
                  <th scope="col">SESSIONS</th>
                  <th scope="col">HOURS</th>
                  <th scope="col" className="hub-table__logcol">VIEW</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <div className="hub-team__emp">
                        <Avatar user={rec.employee} size={30} />
                        <div>
                          <strong>{`${rec.employee?.firstName || ''} ${rec.employee?.lastName || ''}`.trim()}</strong>
                          <small className="hub-muted">{rec.employee?.employeeId}</small>
                        </div>
                      </div>
                    </td>
                    <td className="text-nowrap">{formatDate(rec.date)}</td>
                    <td>
                      <StatusBadge tone={statusTone(rec.status)}>
                        {statusLabel(rec.status)}
                      </StatusBadge>
                    </td>
                    <td className="text-nowrap hub-muted">
                      {NON_WORKING.includes(rec.status)
                        ? '—'
                        : `${rec.firstCheckIn || '—'} → ${rec.lastCheckOut || '—'}`}
                    </td>
                    <td>
                      <span className="hub-muted">{rec.sessionCount || 0}</span>
                    </td>
                    <td>
                      {rec.openSession ? (
                        <span className="hub-badge hub-badge--warning">Clocked in</span>
                      ) : rec.hoursWorked ? (
                        `${rec.hoursWorked}h`
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="hub-table__logcol">
                      {rec.record ? (
                        <div className="d-flex gap-1 justify-content-end">
                          <button
                            type="button"
                            className="hub-icon-btn"
                            aria-label="View sessions"
                            onClick={() => setViewRecord(rec.record)}
                          >
                            <Clock3 size={14} />
                          </button>
                          {canManage && (
                            <button
                              type="button"
                              className="hub-icon-btn"
                              aria-label="Edit record"
                              onClick={() => setEditing(rec.record)}
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="hub-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="hub-loadmore">
            <span className="hub-muted">
              Page {pagination.page} of {pagination.pages} · {pagination.total}{' '}
              {mode === 'roster' ? 'employees' : 'records'}
            </span>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="hub-btn hub-btn--ghost"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={15} /> Prev
              </button>
              <button
                type="button"
                className="hub-btn hub-btn--ghost"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </>
      )}

      <div className="hub-requests">
        <div className="hub-requests__head">
          <h4>
            <CheckCircle2 size={16} className="me-2" /> Pending regularization requests
          </h4>
          <span className="hub-muted">{corrections.length} pending</span>
        </div>

        {corrections.length === 0 ? (
          <div className="hub-empty">
            <p>No pending correction requests.</p>
          </div>
        ) : (
          <div className="hub-table-wrap">
            <table className="hub-table">
              <thead>
                <tr>
                  <th scope="col">EMPLOYEE</th>
                  <th scope="col">DATE</th>
                  <th scope="col">CHANGE</th>
                  <th scope="col">REASON</th>
                  {canManage && <th scope="col" className="hub-table__logcol">REVIEW</th>}
                </tr>
              </thead>
              <tbody>
                {corrections.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="hub-team__emp">
                        <Avatar user={c.employee} size={30} />
                        <div>
                          <strong>{`${c.employee?.firstName || ''} ${c.employee?.lastName || ''}`.trim()}</strong>
                          <small className="hub-muted">{c.employee?.employeeId}</small>
                        </div>
                      </div>
                    </td>
                    <td className="text-nowrap">{formatDate(c.date)}</td>
                    <td className="text-nowrap">
                      {attendanceStatusLabel(c.currentStatus)} → {attendanceStatusLabel(c.requestedStatus)}
                    </td>
                    <td className="hub-reason" title={c.reason}>
                      {c.reason}
                    </td>
                    {canManage && (
                      <td className="hub-table__logcol">
                        <button
                          type="button"
                          className="hub-btn hub-btn--ghost"
                          onClick={() => setReviewing(c)}
                        >
                          Review
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditAttendanceModal
        open={Boolean(editing)}
        record={editing}
        onClose={() => setEditing(null)}
        onSaved={handleEdited}
      />
      <ReviewCorrectionModal
        open={Boolean(reviewing)}
        correction={reviewing}
        onClose={() => setReviewing(null)}
        onDecided={handleDecided}
      />
      <AttendanceSessionsModal
        open={Boolean(viewRecord)}
        record={viewRecord}
        onClose={() => setViewRecord(null)}
      />

      <p className="hub-attribution">
        <Users size={13} /> Managers, HR admins and super admins can view and correct employee
        attendance.{' '}
        {summary.lateMinutes ? `Total late time ${formatDuration(summary.lateMinutes)}.` : ''}
      </p>
    </div>
  );
}
