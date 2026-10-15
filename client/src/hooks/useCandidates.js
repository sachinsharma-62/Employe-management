import { useCallback, useEffect, useMemo, useState } from 'react';
import candidateApi from '../api/candidate.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/constants';

const EMPTY_FILTERS = { q: '', stage: '', source: '', job: '' };

export default function useCandidates() {
  const toast = useToast();
  const { user } = useAuth();
  const canManage = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(user?.role);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [candidates, setCandidates] = useState([]);
  const [meta, setMeta] = useState({ jobs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) params[key] = value;
      });
      const res = await candidateApi.list(params);
      setCandidates(res.data.candidates || []);
    } catch (err) {
      setError(err.message || 'Could not load candidates');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMeta = useCallback(async () => {
    try {
      const res = await candidateApi.meta();
      setMeta(res.data || { jobs: [] });
    } catch {
      // Meta only powers filter options; fail silently.
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const saveCandidate = useCallback(
    async (payload, id) => {
      setBusy('candidate');
      try {
        if (id) await candidateApi.update(id, payload);
        else await candidateApi.create(payload);
        toast.success(id ? 'Candidate updated' : 'Candidate added');
        await loadCandidates();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not save the candidate');
        return false;
      } finally {
        setBusy('');
      }
    },
    [loadCandidates, toast]
  );

  const removeCandidate = useCallback(
    async (id) => {
      setBusy(`candidate-${id}`);
      try {
        await candidateApi.remove(id);
        toast.success('Candidate removed');
        await loadCandidates();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not remove the candidate');
        return false;
      } finally {
        setBusy('');
      }
    },
    [loadCandidates, toast]
  );

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const stats = useMemo(() => {
    const inPipeline = candidates.filter((c) =>
      ['APPLIED', 'SCREENED', 'INTERVIEW', 'OFFER'].includes(c.stage)
    ).length;
    const hired = candidates.filter((c) => c.stage === 'HIRED').length;
    const interviews = candidates.filter((c) => c.stage === 'INTERVIEW').length;
    return { total: candidates.length, inPipeline, hired, interviews };
  }, [candidates]);

  return {
    canManage,
    candidates,
    meta,
    filters,
    setFilter,
    resetFilters: () => setFilters(EMPTY_FILTERS),
    loading,
    error,
    busy,
    stats,
    refresh: loadCandidates,
    saveCandidate,
    removeCandidate,
  };
}