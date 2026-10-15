import { useCallback, useEffect, useMemo, useState } from 'react';
import attendanceApi from '../api/attendance.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/constants';
import { currentMonthKey, monthOptions } from '../utils/attendanceHub';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (n) => String(n).padStart(2, '0');

const dateKeyOf = (value) => {
  if (typeof value === 'string' && DATE_RE.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const toMinutes = (value) => {
  if (!value) return null;
  const [h, m] = String(value).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

// Convert a backend day/record into the shape the hub UI renders.
const normalizeDay = (day) => {
  const weekend = day.isWeekend || day.status === 'WEEKLY_OFF';
  const sessions = (day.sessions || []).map((session) => {
    const checkIn = toMinutes(session.checkIn);
    const checkOut = toMinutes(session.checkOut);
    const minutes =
      session.minutes != null
        ? session.minutes
        : checkIn != null && checkOut != null
        ? Math.max(0, checkOut - checkIn)
        : null;
    return {
      checkIn: session.checkIn || '',
      checkOut: session.checkOut || '',
      checkInMin: checkIn,
      checkOutMin: checkOut,
      minutes,
    };
  });
  const completedMinutes = sessions.reduce((sum, session) => sum + (session.minutes || 0), 0);
  const firstCheckIn =
    day.firstCheckIn || sessions.find((session) => session.checkIn)?.checkIn || day.checkIn || '';
  const lastCheckOut =
    day.lastCheckOut ||
    [...sessions].reverse().find((session) => session.checkOut)?.checkOut ||
    day.checkOut ||
    '';
  const checkIn = toMinutes(firstCheckIn);
  const checkOut = toMinutes(lastCheckOut);
  const effectiveMinutes = Math.round((day.hoursWorked || 0) * 60);
  const breakMinutes = day.breakMinutes || 0;
  const grossMinutes =
    checkIn != null && checkOut != null
      ? Math.max(0, checkOut - checkIn)
      : effectiveMinutes + breakMinutes;

  return {
    id: dateKeyOf(day.date),
    date: dateKeyOf(day.date),
    status: weekend ? 'WEEKLY_OFF' : day.status || 'NOT_CLOCKED_IN',
    checkIn,
    checkOut,
    checkInStr: firstCheckIn,
    checkOutStr: lastCheckOut,
    sessions,
    sessionCount: day.sessionCount ?? sessions.length,
    completedMinutes,
    openSession: sessions.find((session) => session.checkIn && !session.checkOut) || null,
    breakMinutes,
    grossMinutes,
    effectiveMinutes,
    lateMinutes: day.lateMinutes || 0,
    location: day.workMode === 'WFH' ? 'Remote' : day.checkIn ? 'Head Office' : null,
    workMode: day.workMode || 'OFFICE',
    holiday: day.holiday || '',
    pendingCorrection: day.pendingCorrection || '',
    isToday: day.isToday || false,
    note: day.note || '',
  };
};

const normalizeDays = (days) =>
  (days || [])
    .map(normalizeDay)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

export default function useAttendanceHub({ initialMonth = null } = {}) {
  const toast = useToast();
  const { user } = useAuth();
  const canView = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN, ROLES.MANAGER].includes(user?.role);
  const canManage = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(user?.role);

  const startsWithMonth = /^\d{4}-\d{2}$/.test(initialMonth || '');
  const [month, setMonth] = useState(() =>
    startsWithMonth ? initialMonth : currentMonthKey()
  );
  const [data, setData] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [teamLogs, setTeamLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [format24, setFormat24] = useState(true);
  const [statsRange, setStatsRange] = useState('this-month');

  const months = useMemo(() => monthOptions(6), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await attendanceApi.myMonth(month);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Could not load your attendance');
    } finally {
      setLoading(false);
    }
  }, [month]);

  const loadCorrections = useCallback(async () => {
    try {
      const res = await attendanceApi.myCorrections();
      setCorrections(res.data.corrections || []);
    } catch {
      /* non-blocking */
    }
  }, []);

  const loadTeam = useCallback(async () => {
    if (!canView) {
      setTeamLogs([]);
      return;
    }
    try {
      const res = await attendanceApi.list({ month, limit: 100 });
      const records = (res.data.records || []).map((rec) => ({
        date: dateKeyOf(rec.date),
        isWeekend: false,
        status: rec.status,
        checkIn: rec.checkIn,
        checkOut: rec.checkOut,
        hoursWorked: rec.hoursWorked,
        breakMinutes: rec.breakMinutes,
        lateMinutes: rec.lateMinutes,
        workMode: rec.workMode,
      }));
      setTeamLogs(normalizeDays(records));
    } catch {
      setTeamLogs([]);
    }
  }, [canView, month]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadCorrections();
  }, [loadCorrections]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const refetch = useCallback(async () => {
    await Promise.all([load(), loadCorrections(), loadTeam()]);
  }, [load, loadCorrections, loadTeam]);

  const clockIn = useCallback(
    async (mode = 'OFFICE') => {
      setBusy('checkin');
      try {
        await attendanceApi.checkIn({ mode });
        toast.success('Checked in successfully');
        await refetch();
      } catch (err) {
        toast.error(err.message || 'Could not check in');
      } finally {
        setBusy('');
      }
    },
    [refetch, toast]
  );

  const clockOut = useCallback(
    async (note = '') => {
      setBusy('checkout');
      try {
        await attendanceApi.checkOut({ note });
        toast.success('Checked out successfully');
        await refetch();
      } catch (err) {
        toast.error(err.message || 'Could not check out');
      } finally {
        setBusy('');
      }
    },
    [refetch, toast]
  );

  const addRequest = useCallback(
    async (payload) => {
      try {
        await attendanceApi.requestCorrection(payload);
        toast.success('Regularization request submitted');
        await Promise.all([loadCorrections(), load()]);
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not submit the request');
        return false;
      }
    },
    [load, loadCorrections, toast]
  );

  const logs = useMemo(() => normalizeDays(data?.days), [data]);

  const today = data?.today || null;
  const record = today?.record || null;
  const clockedIn = Boolean(today?.canCheckOut);
  const completedToday = Boolean(record?.checkOut);

  const requests = useMemo(
    () =>
      corrections.map((c) => ({
        id: c._id,
        type: c.requestedStatus === 'WFH' ? 'Work From Home' : 'Regularization',
        date: dateKeyOf(c.date),
        reason: c.reason,
        submittedAt: c.createdAt,
        status: c.status,
        currentStatus: c.currentStatus,
        requestedStatus: c.requestedStatus,
        requestedCheckIn: c.requestedCheckIn,
        requestedCheckOut: c.requestedCheckOut,
      })),
    [corrections]
  );

  return {
    user,
    canView,
    canManage,
    loading,
    error,
    refetch,
    month,
    setMonth,
    months,
    settings: data?.settings || null,
    stats: data?.stats || null,
    today,
    record,
    clockedIn,
    completedToday,
    busy,
    clockIn,
    clockOut,
    logs,
    teamLogs,
    requests,
    addRequest,
    format24,
    setFormat24,
    statsRange,
    setStatsRange,
  };
}
