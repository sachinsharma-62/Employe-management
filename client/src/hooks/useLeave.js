import { useCallback, useEffect, useMemo, useState } from 'react';
import leaveApi from '../api/leave.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/constants';

const EMPTY_FILTERS = {
  status: '',
  type: '',
  search: '',
  department: '',
  page: 1,
  limit: 20,
};

export default function useLeave() {
  const toast = useToast();
  const { user } = useAuth();
  const canApprove = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN, ROLES.MANAGER].includes(user?.role);
  const canConfigure = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(user?.role);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [requests, setRequests] = useState([]);
  const [requestSummary, setRequestSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [allTypes, setAllTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const loadMine = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await leaveApi.myLeaves(year);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Could not load your leave data');
    } finally {
      setLoading(false);
    }
  }, [year]);

  const loadRequests = useCallback(async () => {
    if (!canApprove) return;
    setLoadingRequests(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value != null)
      );
      const res = await leaveApi.requests(params);
      setRequests(res.data.records || []);
      setRequestSummary(res.data.summary || null);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || 'Could not load leave requests');
    } finally {
      setLoadingRequests(false);
    }
  }, [canApprove, filters, toast]);

  const loadTypes = useCallback(async () => {
    if (!canConfigure) return;
    setLoadingTypes(true);
    try {
      const res = await leaveApi.types(true);
      setAllTypes(res.data.types || []);
    } catch (err) {
      toast.error(err.message || 'Could not load leave types');
    } finally {
      setLoadingTypes(false);
    }
  }, [canConfigure, toast]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const refresh = useCallback(async () => {
    await Promise.all([loadMine(), loadRequests(), loadTypes()]);
  }, [loadMine, loadRequests, loadTypes]);

  const applyLeave = useCallback(
    async (formData) => {
      setBusy('apply');
      try {
        await leaveApi.apply(formData);
        toast.success('Leave request submitted');
        await loadMine();
        if (canApprove) await loadRequests();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not submit leave request');
        return false;
      } finally {
        setBusy('');
      }
    },
    [canApprove, loadMine, loadRequests, toast]
  );

  const cancelLeave = useCallback(
    async (id, reason = '') => {
      setBusy(`cancel-${id}`);
      try {
        await leaveApi.cancel(id, { reason });
        toast.success('Leave request cancelled');
        await loadMine();
        if (canApprove) await loadRequests();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not cancel request');
        return false;
      } finally {
        setBusy('');
      }
    },
    [canApprove, loadMine, loadRequests, toast]
  );

  const decide = useCallback(
    async (kind, id, note) => {
      setBusy(`decide-${id}`);
      try {
        if (kind === 'approve') await leaveApi.approve(id, { note });
        else await leaveApi.reject(id, { note });
        toast.success(kind === 'approve' ? 'Leave approved' : 'Leave rejected');
        await Promise.all([loadRequests(), loadMine()]);
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not update request');
        return false;
      } finally {
        setBusy('');
      }
    },
    [loadMine, loadRequests, toast]
  );

  const approveLeave = useCallback((id, note) => decide('approve', id, note), [decide]);
  const rejectLeave = useCallback((id, note) => decide('reject', id, note), [decide]);

  const saveLeaveType = useCallback(
    async (payload, id) => {
      setBusy('type');
      try {
        if (id) await leaveApi.updateType(id, payload);
        else await leaveApi.createType(payload);
        toast.success(id ? 'Leave type updated' : 'Leave type created');
        await Promise.all([loadTypes(), loadMine()]);
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not save leave type');
        return false;
      } finally {
        setBusy('');
      }
    },
    [loadMine, loadTypes, toast]
  );

  const removeLeaveType = useCallback(
    async (id) => {
      setBusy('type');
      try {
        await leaveApi.removeType(id);
        toast.success('Leave type removed');
        await Promise.all([loadTypes(), loadMine()]);
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not remove leave type');
        return false;
      } finally {
        setBusy('');
      }
    },
    [loadMine, loadTypes, toast]
  );

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return [now, now - 1, now + 1];
  }, []);

  return {
    user,
    canApprove,
    canConfigure,
    year,
    setYear,
    years,
    loading,
    error,
    busy,
    balances: data?.balances || [],
    totals: data?.totals || null,
    myRequests: data?.requests || [],
    applyTypes: data?.types || [],
    refresh,
    applyLeave,
    cancelLeave,
    approveLeave,
    rejectLeave,
    // management
    filters,
    setFilters,
    requests,
    requestSummary,
    pagination,
    loadingRequests,
    // configuration
    allTypes,
    loadingTypes,
    saveLeaveType,
    removeLeaveType,
  };
}
