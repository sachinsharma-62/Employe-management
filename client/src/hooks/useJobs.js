import { useCallback, useEffect, useMemo, useState } from 'react';
import jobApi from '../api/job.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/constants';

const EMPTY_FILTERS = { q: '', status: '', department: '', jobType: '' };

export default function useJobs() {
  const toast = useToast();
  const { user } = useAuth();
  const canManage = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(user?.role);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ departments: [], locations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) params[key] = value;
      });
      const res = await jobApi.list(params);
      setJobs(res.data.jobs || []);
    } catch (err) {
      setError(err.message || 'Could not load jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMeta = useCallback(async () => {
    try {
      const res = await jobApi.meta();
      setMeta(res.data || { departments: [], locations: [] });
    } catch {
      // Meta only powers filter options; fail silently.
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const saveJob = useCallback(
    async (payload, id) => {
      setBusy('job');
      try {
        if (id) await jobApi.update(id, payload);
        else await jobApi.create(payload);
        toast.success(id ? 'Job updated' : 'Job posted');
        await loadJobs();
        await loadMeta();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not save the job');
        return false;
      } finally {
        setBusy('');
      }
    },
    [loadJobs, loadMeta, toast]
  );

  const removeJob = useCallback(
    async (id) => {
      setBusy(`job-${id}`);
      try {
        await jobApi.remove(id);
        toast.success('Job closed');
        await loadJobs();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not close the job');
        return false;
      } finally {
        setBusy('');
      }
    },
    [loadJobs, toast]
  );

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const stats = useMemo(() => {
    const open = jobs.filter((job) => job.status === 'OPEN').length;
    const interviewing = jobs.filter((job) => job.status === 'INTERVIEWING').length;
    const openings = jobs
      .filter((job) => job.status === 'OPEN' || job.status === 'INTERVIEWING')
      .reduce((sum, job) => sum + (job.openings || 0), 0);
    return { total: jobs.length, open, interviewing, openings };
  }, [jobs]);

  return {
    canManage,
    jobs,
    meta,
    filters,
    setFilter,
    resetFilters: () => setFilters(EMPTY_FILTERS),
    loading,
    error,
    busy,
    stats,
    refresh: loadJobs,
    saveJob,
    removeJob,
  };
}