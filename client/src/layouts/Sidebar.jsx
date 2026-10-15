import { NavLink } from 'react-router-dom';
import {
  BadgeIndianRupee,
  BarChart3,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  FolderOpen,
  LayoutDashboard,
  Network,
  PartyPopper,
  Settings,
  SlidersHorizontal,
  Users,
  UserRoundPlus,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'People',
    items: [
      {
        to: '/employees',
        label: 'Employees',
        icon: Users,
        roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'],
      },
      {
        to: '/organization',
        label: 'Organization',
        icon: Network,
        roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'],
      },
      { to: '/attendance-hub', label: 'Attendance Hub', icon: CalendarClock },
      { to: '/leaves', label: 'Leave', icon: CalendarDays },
      { to: '/holidays', label: 'Holidays', icon: PartyPopper },
      { to: '/events', label: 'Events', icon: CalendarRange },
      { to: '/documents', label: 'Documents', icon: FolderOpen },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/my-payslips', label: 'My Payslips', icon: BadgeIndianRupee },
      {
        to: '/payroll',
        label: 'Payroll',
        icon: Wallet,
        roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'],
      },
      {
        to: '/reports',
        label: 'Reports',
        icon: BarChart3,
        comingSoon: true,
        roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    title: 'Admin',
    items: [
      { to: '/account/security', label: 'My Settings', icon: Settings },
      {
        to: '/settings',
        label: 'Company Settings',
        icon: SlidersHorizontal,
        roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    title: 'Recruiting',
    items: [
      { to: '/jobs', label: 'Jobs', icon: Briefcase },
      {
        to: '/candidates',
        label: 'Candidates',
        icon: UserRoundPlus,
        roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'],
      },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const renderSection = (section) => {
    const items = section.items.filter(
      (item) => !item.roles || (user && item.roles.includes(user.role))
    );
    if (items.length === 0) return null;

    return (
      <div className="sidebar__section" key={section.title}>
        <p className="sidebar__section-title">{section.title}</p>
        {items.map(({ to, label, icon: Icon, comingSoon }) =>
          comingSoon ? (
            <span key={label} className="sidebar__link sidebar__link--disabled">
              <Icon size={17} />
              <span className="sidebar__label">{label}</span>
              <span className="sidebar__badge">Soon</span>
            </span>
          ) : (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <Icon size={17} />
              <span className="sidebar__label">{label}</span>
            </NavLink>
          )
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <span className="sidebar__logo">EM</span>
          <div className="sidebar__brand-text">
            <strong>Office EMS</strong>
            <small>Employee Management</small>
          </div>
          <button
            type="button"
            className="sidebar__close d-lg-none"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar__nav">{NAV_SECTIONS.map(renderSection)}</nav>

        <div className="sidebar__footer">
          <span className={`role-chip role-chip--${user?.role?.toLowerCase()}`}>
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
      </aside>
    </>
  );
}
