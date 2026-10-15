import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, List, Settings, Users } from 'lucide-react';
import AttendanceCalendar from './AttendanceCalendar';
import AttendanceFilters from './AttendanceFilters';
import AttendanceLogTable from './AttendanceLogTable';
import AttendanceRequestsTable from './AttendanceRequestsTable';
import AttendanceSessionsModal from './AttendanceSessionsModal';
import AttendanceTabs from './AttendanceTabs';
import TeamAttendancePanel from './TeamAttendancePanel';
import SettingsPanel from '../SettingsPanel';
import { monthLongLabel } from '../../../utils/attendanceHub';

const BASE_TABS = [
  { id: 'log', label: 'Attendance Log', icon: List },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
];

const PAGE_SIZE = 30;

export default function LogsRequests({ hub, onNewRequest }) {
  const [tab, setTab] = useState('log');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [dayRecord, setDayRecord] = useState(null);

  const tabs = useMemo(() => {
    const list = [...BASE_TABS];
    if (hub.canView) list.push({ id: 'team', label: 'Team Attendance', icon: Users });
    list.push({ id: 'requests', label: 'Attendance Requests', icon: ClipboardList });
    if (hub.canManage) list.push({ id: 'rules', label: 'Rules', icon: Settings });
    return list;
  }, [hub.canView, hub.canManage]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [hub.month]);

  const rangeLabel = monthLongLabel(hub.month);

  const handleSelectMonth = (key) => {
    hub.setMonth(key);
    setTab((current) =>
      current === 'team' || current === 'requests' || current === 'rules' ? current : 'log'
    );
  };

  const handleView = (view) => setTab(view === 'calendar' ? 'calendar' : 'log');

  const showFilters = tab === 'log' || tab === 'calendar';

  return (
    <section className="hub-card hub-logs" aria-labelledby="hub-logs-title">
      <div className="hub-logs__head">
        <h3 id="hub-logs-title">Logs &amp; Requests</h3>
        <label className="hub-switch">
          <input
            type="checkbox"
            checked={hub.format24}
            onChange={(event) => hub.setFormat24(event.target.checked)}
          />
          <span className="hub-switch__track" aria-hidden="true">
            <span className="hub-switch__thumb" />
          </span>
          <span className="hub-switch__label">24-hour</span>
        </label>
      </div>

      <div className="hub-logs__bar">
        <AttendanceTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {showFilters && (
        <AttendanceFilters
          rangeLabel={rangeLabel}
          month={hub.month}
          months={hub.months}
          onSelectMonth={handleSelectMonth}
          view={tab === 'calendar' ? 'calendar' : 'list'}
          onViewChange={handleView}
        />
      )}

      <div className="hub-logs__body">
        {tab === 'log' &&
          (hub.loading && hub.logs.length === 0 ? (
            <div className="hub-empty">
              <p>Loading attendance…</p>
            </div>
          ) : (
            <AttendanceLogTable
              records={hub.logs}
              visibleCount={visibleCount}
              onLoadMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
              onViewDay={setDayRecord}
              onRegularise={onNewRequest}
              use24={hub.format24}
            />
          ))}

        {tab === 'calendar' && (
          <AttendanceCalendar
            logs={hub.logs}
            month={hub.month}
            onMonthChange={hub.setMonth}
            use24={hub.format24}
          />
        )}

        {tab === 'team' && hub.canView && <TeamAttendancePanel canManage={hub.canManage} />}

        {tab === 'requests' && (
          <AttendanceRequestsTable requests={hub.requests} onNewRequest={onNewRequest} />
        )}

        {tab === 'rules' && hub.canManage && <SettingsPanel />}
      </div>

      <AttendanceSessionsModal
        open={Boolean(dayRecord)}
        record={dayRecord}
        use24={hub.format24}
        onClose={() => setDayRecord(null)}
      />
    </section>
  );
}
