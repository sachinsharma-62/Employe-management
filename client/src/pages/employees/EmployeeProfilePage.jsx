import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  FileText,
  Laptop,
  LayoutDashboard,
  Target,
  TrendingUp,
  UserRound,
  Wallet,
} from 'lucide-react';
import profileApi from '../../api/profile.api';
import employeeApi from '../../api/employee.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../utils/constants';
import PageLoader from '../../components/PageLoader';
import ProfileHeader from '../../components/employees/profile/ProfileHeader';
import ProfileTabs from '../../components/employees/profile/ProfileTabs';
import EmployeeFormModal from '../../components/employees/EmployeeFormModal';
import UploadDocumentModal from '../../components/employees/profile/UploadDocumentModal';
import AddNoteModal from '../../components/employees/profile/AddNoteModal';
import OverviewTab from '../../components/employees/profile/tabs/OverviewTab';
import PersonalTab from '../../components/employees/profile/tabs/PersonalTab';
import EmploymentTab from '../../components/employees/profile/tabs/EmploymentTab';
import AttendanceTab from '../../components/employees/profile/tabs/AttendanceTab';
import LeaveTab from '../../components/employees/profile/tabs/LeaveTab';
import PayrollTab from '../../components/employees/profile/tabs/PayrollTab';
import DocumentsTab from '../../components/employees/profile/tabs/DocumentsTab';
import PerformanceTab from '../../components/employees/profile/tabs/PerformanceTab';
import GoalsTab from '../../components/employees/profile/tabs/GoalsTab';
import AssetsTab from '../../components/employees/profile/tabs/AssetsTab';
import ActivityTab from '../../components/employees/profile/tabs/ActivityTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'personal', label: 'Personal Information', icon: UserRound },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'leave', label: 'Leave', icon: CalendarDays },
  { id: 'payroll', label: 'Payroll', icon: Wallet },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'assets', label: 'Assets', icon: Laptop },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const canManage = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(currentUser?.role);
  const canAssignRole = currentUser?.role === ROLES.SUPER_ADMIN;

  const [employee, setEmployee] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [notes, setNotes] = useState([]);
  const [meta, setMeta] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, notesRes] = await Promise.all([
        profileApi.get(id),
        profileApi.notes(id),
      ]);
      setEmployee(profileRes.data.employee);
      setSummary(profileRes.data.summary);
      setRecentActivity(profileRes.data.recentActivity || []);
      setNotes(notesRes.data.records || []);
    } catch (err) {
      setError(err.message || 'Could not load employee profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setActiveTab('overview');
    setRefreshKey(0);
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!canManage) return undefined;
    let active = true;
    employeeApi
      .meta()
      .then((res) => {
        if (active) setMeta(res.data.meta);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [canManage]);

  const refetchNotes = async () => {
    try {
      const res = await profileApi.notes(id);
      setNotes(res.data.records || []);
    } catch {
      /* ignore */
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await profileApi.download(id);
      triggerDownload(new Blob([res.data], { type: 'text/html' }), `profile-${employee?.employeeId || id}.html`);
      toast.success('Profile downloaded');
    } catch {
      toast.error('Could not download profile');
    } finally {
      setDownloading(false);
    }
  };

  const handleSaved = () => {
    setEditOpen(false);
    fetchProfile();
  };

  const handleUploaded = () => {
    setActiveTab('documents');
    setRefreshKey((k) => k + 1);
  };

  const handleNoteAdded = () => {
    refetchNotes();
    setRefreshKey((k) => k + 1);
  };

  if (loading) return <PageLoader label="Loading employee profile..." />;

  if (error || !employee) {
    return (
      <div className="stack-lg">
        <button type="button" className="profile-link" onClick={() => navigate('/employees')}>
          <ArrowLeft size={15} /> Back to employees
        </button>
        <div className="alert alert-danger">{error || 'Employee not found'}</div>
      </div>
    );
  }

  const isSelf = employee._id === currentUser?._id;

  const renderTab = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalTab employee={employee} />;
      case 'employment':
        return <EmploymentTab employee={employee} />;
      case 'attendance':
        return <AttendanceTab employeeId={id} />;
      case 'leave':
        return <LeaveTab employeeId={id} />;
      case 'payroll':
        return <PayrollTab employeeId={id} />;
      case 'documents':
        return (
          <DocumentsTab
            employeeId={id}
            canManage={canManage}
            onRequestUpload={() => setUploadOpen(true)}
          />
        );
      case 'performance':
        return <PerformanceTab employeeId={id} />;
      case 'goals':
        return <GoalsTab employeeId={id} />;
      case 'assets':
        return <AssetsTab employeeId={id} />;
      case 'activity':
        return <ActivityTab employeeId={id} />;
      case 'overview':
      default:
        return (
          <OverviewTab
            employee={employee}
            summary={summary}
            recentActivity={recentActivity}
            notes={notes}
            onAddNote={() => setNoteOpen(true)}
            onGoTo={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="stack-lg">
      <button type="button" className="profile-link" onClick={() => navigate('/employees')}>
        <ArrowLeft size={15} /> Back to employees
      </button>

      <ProfileHeader
        employee={employee}
        isSelf={isSelf}
        canManage={canManage}
        onEdit={() => setEditOpen(true)}
        onDownload={handleDownload}
        onUpload={() => setUploadOpen(true)}
        onAddNote={() => setNoteOpen(true)}
        downloading={downloading}
      />

      <div className="emp-profile__body">
        <ProfileTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        <div key={`${activeTab}-${refreshKey}`}>{renderTab()}</div>
      </div>

      {canManage && (
        <EmployeeFormModal
          open={editOpen}
          employee={employee}
          meta={meta}
          canAssignRole={canAssignRole}
          selfId={currentUser?._id}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <UploadDocumentModal
        open={uploadOpen}
        employeeId={id}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />

      <AddNoteModal
        open={noteOpen}
        employeeId={id}
        onClose={() => setNoteOpen(false)}
        onAdded={handleNoteAdded}
      />
    </div>
  );
}
