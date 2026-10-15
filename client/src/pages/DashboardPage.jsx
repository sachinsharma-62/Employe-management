import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Cake,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Megaphone,
  PartyPopper,
  PieChart as PieIcon,
  Timer,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dashboardApi from '../api/dashboard.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CHART_COLORS, getDepartmentNames } from '../utils/dashboardMock';
import { formatDate, roleLabel } from '../utils/constants';
import StatCard from '../components/dashboard/StatCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import ChartCard from '../components/dashboard/ChartCard';
import DashboardFilters from '../components/dashboard/DashboardFilters';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import QuickActions from '../components/dashboard/QuickActions';
import ClockInOutCard from '../components/attendance/ClockInOutCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import InfoList from '../components/dashboard/InfoList';
import NotificationList from '../components/dashboard/NotificationList';

const toISODate = (d) => d.toISOString().slice(0, 10);
const toMonthValue = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  fontSize: 12,
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
};

const initialFilters = () => {
  const now = new Date();
  return { date: toISODate(now), month: toMonthValue(now), department: 'all' };
};

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const departments = useMemo(() => getDepartmentNames(), []);
  const isAdmin = user && ['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.overview(filters);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const statCards = useMemo(() => {
    if (!data) return [];
    const { stats, trends } = data;
    return [
      { key: 'totalEmployees', label: 'Total Employees', icon: Users, tone: 'indigo' },
      { key: 'activeEmployees', label: 'Active Employees', icon: UserCheck, tone: 'green' },
      { key: 'newEmployees', label: 'New Employees', icon: UserPlus, tone: 'cyan' },
      { key: 'presentToday', label: 'Present Today', icon: CheckCircle2, tone: 'teal' },
      { key: 'absentToday', label: 'Absent Today', icon: UserX, tone: 'rose' },
      { key: 'onLeave', label: 'On Leave', icon: CalendarDays, tone: 'amber' },
      { key: 'lateEmployees', label: 'Late Employees', icon: Timer, tone: 'orange' },
      { key: 'pendingLeaveRequests', label: 'Pending Leave', icon: CalendarClock, tone: 'purple' },
      { key: 'pendingAttendanceRequests', label: 'Pending Attendance', icon: ClipboardList, tone: 'blue' },
    ].map((card) => ({
      ...card,
      value: stats[card.key],
      trend: trends[card.key],
    }));
  }, [data]);

  const quickActions = useMemo(() => {
    if (!data) return [];
    return [
      isAdmin && {
        label: 'Add employee',
        description: 'Create a new employee record',
        icon: UserPlus,
        tone: 'indigo',
        to: '/employees',
      },
      {
        label: 'Approve leaves',
        description: `${data.stats.pendingLeaveRequests} requests waiting`,
        icon: CalendarCheck,
        tone: 'green',
        onClick: () => toast.info('Leave approvals are coming soon'),
      },
      {
        label: 'Mark attendance',
        description: 'Regularise attendance records',
        icon: ClipboardCheck,
        tone: 'amber',
        onClick: () => toast.info('Attendance module is coming soon'),
      },
      {
        label: 'Run payroll',
        description: 'Process this month payroll',
        icon: Wallet,
        tone: 'cyan',
        onClick: () => toast.info('Payroll module is coming soon'),
      },
      {
        label: 'Post announcement',
        description: 'Share news with everyone',
        icon: Megaphone,
        tone: 'purple',
        onClick: () => toast.info('Announcements are coming soon'),
      },
      {
        label: 'Generate report',
        description: 'Export HR analytics',
        icon: BarChart3,
        tone: 'rose',
        onClick: () => toast.info('Reports module is coming soon'),
      },
    ].filter(Boolean);
  }, [data, isAdmin, toast]);

  const birthdays = useMemo(
    () =>
      (data?.birthdays || []).map((b) => ({
        id: b.employee.id,
        employee: b.employee,
        title: b.employee.fullName,
        subtitle: `${b.employee.designation} · ${b.employee.department}`,
        meta: b.daysLeft === 0 ? 'Today' : b.daysLeft === 1 ? 'Tomorrow' : `in ${b.daysLeft} days`,
      })),
    [data]
  );

  const anniversaries = useMemo(
    () =>
      (data?.anniversaries || []).map((a) => ({
        id: a.employee.id,
        employee: a.employee,
        title: a.employee.fullName,
        subtitle: `${a.years} ${a.years === 1 ? 'year' : 'years'} · ${a.employee.department}`,
        meta: a.daysLeft === 0 ? 'Today' : `in ${a.daysLeft} days`,
      })),
    [data]
  );

  const holidays = useMemo(
    () =>
      (data?.holidays || []).map((h) => ({
        id: h.name,
        icon: PartyPopper,
        tone: 'amber',
        title: h.name,
        subtitle: `${h.type} holiday`,
        meta: formatDate(h.date),
      })),
    [data]
  );

  if (loading && !data) return <DashboardSkeleton />;

  if (error && !data) {
    return (
      <div className="panel">
        <div className="alert alert-danger mb-3">{error}</div>
        <button type="button" className="btn btn-primary btn-sm" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="stack-lg">
      <section className="welcome-banner">
        <div>
          <h2 className="welcome-banner__title">
            Good{' '}
            {new Date().getHours() < 12
              ? 'morning'
              : new Date().getHours() < 17
                ? 'afternoon'
                : 'evening'}
            , {user?.firstName} 👋
          </h2>
          <p className="welcome-banner__sub mb-0">
            Signed in as <strong>{roleLabel(user?.role)}</strong>
            {user?.designation ? ` · ${user.designation}` : ''}. Here is your workforce overview
            {filters.department !== 'all' ? ` for ${filters.department}` : ''}.
          </p>
        </div>
        {isAdmin && (
          <Link to="/employees" className="btn btn-light btn-sm">
            Manage employees <ArrowRight size={15} className="ms-1" />
          </Link>
        )}
      </section>

      <ClockInOutCard />

      <DashboardFilters
        value={filters}
        onChange={setFilters}
        departments={departments}
        onRefresh={load}
        loading={loading}
      />

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <section className="row g-3">
        {statCards.map((card) => (
          <div className="col-6 col-lg-4 col-xxl-3" key={card.key}>
            <StatCard
              icon={card.icon}
              label={card.label}
              value={card.value}
              tone={card.tone}
              trend={card.trend}
            />
          </div>
        ))}
      </section>

      <section className="row g-3">
        <div className="col-12 col-xl-8">
          <ChartCard
            title="Employee Growth"
            hint={`${data.period.year} · monthly`}
            icon={TrendingUp}
            height={280}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.growth} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="employees"
                  name="Employees"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="url(#growthFill)"
                />
                <Bar
                  dataKey="hires"
                  name="New hires"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={16}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="col-12 col-xl-4">
          <ChartCard title="Leave Statistics" hint="By type" icon={PieIcon} height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.leaveStats}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {data.leaveStats.map((entry, idx) => (
                    <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      <section className="row g-3">
        <div className="col-12 col-xl-8">
          <ChartCard title="Attendance Overview" hint="Last 7 days" icon={Activity} height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.attendance} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f5f6fa' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" name="Present" stackId="a" fill="#16a34a" maxBarSize={40} />
                <Bar dataKey="late" name="Late" stackId="a" fill="#f59e0b" maxBarSize={40} />
                <Bar dataKey="leave" name="On leave" stackId="a" fill="#4f46e5" maxBarSize={40} />
                <Bar
                  dataKey="absent"
                  name="Absent"
                  stackId="a"
                  fill="#e11d48"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="col-12 col-xl-4">
          <DashboardPanel title="Quick actions" icon={Zap} className="h-100">
            <QuickActions items={quickActions} />
          </DashboardPanel>
        </div>
      </section>

      <section className="row g-3">
        <div className="col-12 col-xl-4">
          <ChartCard title="Department-wise Employees" hint="Org-wide" icon={Building2} height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.departments}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef0f4" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={108}
                  fontSize={11}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f5f6fa' }} />
                <Bar dataKey="value" name="Employees" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {data.departments.map((d, idx) => (
                    <Cell
                      key={d.name}
                      fill={d.highlight ? '#4f46e5' : CHART_COLORS[idx % CHART_COLORS.length]}
                      fillOpacity={d.highlight ? 1 : 0.45}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="col-12 col-md-6 col-xl-4">
          <ChartCard title="Gender Distribution" hint="Current workforce" icon={Users} height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.gender}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  <Cell fill="#4f46e5" />
                  <Cell fill="#db2777" />
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="col-12 col-md-6 col-xl-4">
          <ChartCard title="Employment Status" hint="By contract type" icon={Briefcase} height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.employmentStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {data.employmentStatus.map((entry, idx) => (
                    <Cell key={entry.name} fill={CHART_COLORS[(idx + 2) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      <section className="row g-3">
        <div className="col-12 col-xl-4">
          <DashboardPanel title="Upcoming Birthdays" hint="Next 5" icon={Cake} className="h-100">
            <InfoList items={birthdays} emptyLabel="No upcoming birthdays" />
          </DashboardPanel>
        </div>
        <div className="col-12 col-xl-4">
          <DashboardPanel title="Work Anniversaries" hint="Next 5" icon={Award} className="h-100">
            <InfoList items={anniversaries} emptyLabel="No upcoming anniversaries" />
          </DashboardPanel>
        </div>
        <div className="col-12 col-xl-4">
          <DashboardPanel title="Upcoming Holidays" hint="This year" icon={PartyPopper} className="h-100">
            <InfoList items={holidays} emptyLabel="No holidays scheduled" />
          </DashboardPanel>
        </div>
      </section>

      <section className="row g-3">
        <div className="col-12 col-xl-8">
          <DashboardPanel title="Recent Employee Activity" icon={Activity} className="h-100">
            <ActivityFeed items={data.activities} />
          </DashboardPanel>
        </div>
        <div className="col-12 col-xl-4">
          <DashboardPanel title="Notifications" icon={Bell} className="h-100">
            <NotificationList items={data.notifications} />
          </DashboardPanel>
        </div>
      </section>
    </div>
  );
}
