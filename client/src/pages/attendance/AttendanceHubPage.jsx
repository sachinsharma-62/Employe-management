import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import AttendanceDashboard from '../../components/attendance/hub/AttendanceDashboard';
import LogsRequests from '../../components/attendance/hub/LogsRequests';
import RequestModal from '../../components/attendance/hub/RequestModal';
import useAttendanceHub from '../../hooks/useAttendanceHub';

export default function AttendanceHubPage() {
  const [searchParams] = useSearchParams();
  const hub = useAttendanceHub({ initialMonth: searchParams.get('month') });
  const [requestModal, setRequestModal] = useState({ open: false, preset: null });

  const openRequest = (preset = null) => setRequestModal({ open: true, preset });

  return (
    <div className="hub stack-lg">
      <header className="hub__pagehead">
        <span className="hub__pagehead-icon">
          <CalendarCheck size={18} />
        </span>
        <div>
          <h1>Attendance</h1>
          <p>Your time, schedules, logs and requests in one place</p>
        </div>
      </header>

      {hub.error && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {hub.error}
        </div>
      )}

      <AttendanceDashboard hub={hub} onShortcut={openRequest} />

      <LogsRequests hub={hub} onNewRequest={openRequest} />

      <RequestModal
        open={requestModal.open}
        presetType={requestModal.preset}
        onClose={() => setRequestModal({ open: false, preset: null })}
        onSubmit={hub.addRequest}
      />
    </div>
  );
}
