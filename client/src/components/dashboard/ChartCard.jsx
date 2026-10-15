import DashboardPanel from './DashboardPanel';

export default function ChartCard({ title, hint, icon, actions, height = 260, children }) {
  return (
    <DashboardPanel title={title} hint={hint} icon={icon} actions={actions} className="h-100">
      <div className="chart-box" style={{ height }}>
        {children}
      </div>
    </DashboardPanel>
  );
}
