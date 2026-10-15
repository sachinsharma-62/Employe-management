import { useCallback, useEffect, useMemo, useState } from 'react';
import eventApi from '../api/event.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES, todayISODate } from '../utils/constants';

const EMPTY_FILTERS = {
  type: '',
  location: '',
  search: '',
  includeInactive: false,
};

const byStartTime = (a, b) => (a.startTime < b.startTime ? -1 : 1);

export default function useEvents() {
  const toast = useToast();
  const { user } = useAuth();
  const canManage = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN, ROLES.MANAGER].includes(user?.role);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [events, setEvents] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { year };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined && value !== false) {
          params[key] = value;
        }
      });
      const res = await eventApi.list(params);
      setEvents(res.data.events || []);
    } catch (err) {
      setError(err.message || 'Could not load the event calendar');
    } finally {
      setLoading(false);
    }
  }, [year, filters]);

  const loadUpcoming = useCallback(async () => {
    setLoadingUpcoming(true);
    try {
      const res = await eventApi.upcoming(6);
      setUpcoming(res.data.events || []);
    } catch (err) {
      toast.error(err.message || 'Could not load upcoming events');
    } finally {
      setLoadingUpcoming(false);
    }
  }, [toast]);

  const loadMeta = useCallback(async () => {
    try {
      const res = await eventApi.meta();
      setEmployees(res.data.employees || []);
    } catch {
      // Meta only powers the create/edit form; fail silently.
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const refresh = useCallback(async () => {
    await Promise.all([loadEvents(), loadUpcoming()]);
  }, [loadEvents, loadUpcoming]);

  const saveEvent = useCallback(
    async (payload, id) => {
      setBusy('event');
      try {
        if (id) await eventApi.update(id, payload);
        else await eventApi.create(payload);
        toast.success(id ? 'Event updated' : 'Event created');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not save event');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const removeEvent = useCallback(
    async (id) => {
      setBusy(`event-${id}`);
      try {
        await eventApi.remove(id);
        toast.success('Event deleted');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not delete event');
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

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((event) => {
      if (!map[event.dateISO]) map[event.dateISO] = [];
      map[event.dateISO].push(event);
    });
    Object.values(map).forEach((list) => list.sort(byStartTime));
    return map;
  }, [events]);

  const monthEvents = useMemo(
    () => events.filter((event) => event.dateISO.startsWith(monthKey)),
    [events, monthKey]
  );

  const grouped = useMemo(() => {
    const map = {};
    events.forEach((event) => {
      const key = event.dateISO.slice(0, 7);
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [events]);

  const counts = useMemo(() => {
    const today = todayISODate();
    return {
      total: events.length,
      upcoming: events.filter((event) => event.dateISO >= today).length,
      meetings: events.filter((event) => event.type === 'MEETING').length,
      trainings: events.filter((event) => event.type === 'TRAINING' || event.type === 'WORKSHOP').length,
      celebrations: events.filter((event) =>
        ['CELEBRATION', 'BIRTHDAY', 'ANNIVERSARY'].includes(event.type)
      ).length,
    };
  }, [events]);

  const changeMonth = useCallback((delta) => {
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
  }, []);

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
    events,
    monthEvents,
    eventsByDate,
    grouped,
    counts,
    upcoming,
    employees,
    loading,
    loadingUpcoming,
    error,
    busy,
    filters,
    setFilter,
    resetFilters: () => setFilters(EMPTY_FILTERS),
    refresh,
    saveEvent,
    removeEvent,
  };
}
