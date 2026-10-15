import { useCallback, useEffect, useMemo, useState } from 'react';
import holidayApi from '../api/holiday.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/constants';

const EMPTY_FILTERS = {
  type: '',
  location: '',
  department: '',
  search: '',
  optional: '',
  includeInactive: false,
};

export default function useHolidays() {
  const toast = useToast();
  const { user } = useAuth();
  const canManage = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(user?.role);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [holidays, setHolidays] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [meta, setMeta] = useState({ locations: [], departments: [] });
  const [loading, setLoading] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { year };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined && value !== false) {
          params[key] = value;
        }
      });
      const res = await holidayApi.list(params);
      setHolidays(res.data.holidays || []);
    } catch (err) {
      setError(err.message || 'Could not load the holiday calendar');
    } finally {
      setLoading(false);
    }
  }, [year, filters]);

  const loadUpcoming = useCallback(async () => {
    setLoadingUpcoming(true);
    try {
      const res = await holidayApi.upcoming(6);
      setUpcoming(res.data.holidays || []);
    } catch (err) {
      toast.error(err.message || 'Could not load upcoming holidays');
    } finally {
      setLoadingUpcoming(false);
    }
  }, [toast]);

  const loadMeta = useCallback(async () => {
    try {
      const res = await holidayApi.meta();
      setMeta(res.data || { locations: [], departments: [] });
    } catch {
      // Meta is only used for filters and configuration; fail silently.
    }
  }, []);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const refresh = useCallback(async () => {
    await Promise.all([loadHolidays(), loadUpcoming()]);
  }, [loadHolidays, loadUpcoming]);

  const saveHoliday = useCallback(
    async (payload, id) => {
      setBusy('holiday');
      try {
        if (id) await holidayApi.update(id, payload);
        else await holidayApi.create(payload);
        toast.success(id ? 'Holiday updated' : 'Holiday added');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not save holiday');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const removeHoliday = useCallback(
    async (id) => {
      setBusy(`holiday-${id}`);
      try {
        await holidayApi.remove(id);
        toast.success('Holiday deleted');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not delete holiday');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const monthKey = useMemo(
    () => `${year}-${String(month + 1).padStart(2, '0')}`,
    [year, month]
  );

  const monthHolidays = useMemo(
    () =>
      holidays
        .filter((holiday) => holiday.dateISO.startsWith(monthKey))
        .sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1)),
    [holidays, monthKey]
  );

  const holidaysByDate = useMemo(() => {
    const map = {};
    holidays.forEach((holiday) => {
      map[holiday.dateISO] = holiday;
    });
    return map;
  }, [holidays]);

  const grouped = useMemo(() => {
    const map = {};
    holidays.forEach((holiday) => {
      const key = holiday.dateISO.slice(0, 7);
      if (!map[key]) map[key] = [];
      map[key].push(holiday);
    });
    return map;
  }, [holidays]);

  const counts = useMemo(() => {
    const national = holidays.filter((holiday) => holiday.type === 'NATIONAL').length;
    const company = holidays.filter((holiday) => holiday.type === 'COMPANY').length;
    const optional = holidays.filter((holiday) => holiday.optional).length;
    return { total: holidays.length, national, company, optional };
  }, [holidays]);

  const changeMonth = useCallback(
    (delta) => {
      setMonth((prev) => {
        const next = prev + delta;
        if (next < 0) {
          setYear((yearValue) => yearValue - 1);
          return 11;
        }
        if (next > 11) {
          setYear((yearValue) => yearValue + 1);
          return 0;
        }
        return next;
      });
    },
    []
  );

  const goToToday = useCallback(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }, []);

  return {
    user,
    canManage,
    year,
    setYear,
    month,
    monthKey,
    changeMonth,
    goToToday,
    holidays,
    monthHolidays,
    holidaysByDate,
    grouped,
    counts,
    upcoming,
    loading,
    loadingUpcoming,
    error,
    busy,
    meta,
    filters,
    setFilter,
    resetFilters: () => setFilters(EMPTY_FILTERS),
    refresh,
    saveHoliday,
    removeHoliday,
  };
}