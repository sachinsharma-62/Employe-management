import ActionsCard from './ActionsCard';
import AttendanceSessionsCard from './AttendanceSessionsCard';
import AttendanceStatsCard from './AttendanceStatsCard';
import TimingsCard from './TimingsCard';

export default function AttendanceDashboard({ hub, onShortcut }) {
  return (
    <div className="hub-dashboard">
      <AttendanceStatsCard hub={hub} />
      <TimingsCard hub={hub} />
      <ActionsCard hub={hub} onShortcut={onShortcut} />
      <AttendanceSessionsCard hub={hub} />
    </div>
  );
}
