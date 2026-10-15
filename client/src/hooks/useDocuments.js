import { useCallback, useEffect, useState } from 'react';
import documentApi from '../api/document.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/constants';

const EMPTY_FILTERS = {
  employee: '',
  documentType: '',
  verificationStatus: '',
  status: '',
  search: '',
  expiring: false,
};

export default function useDocuments() {
  const toast = useToast();
  const { user } = useAuth();
  const canView = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN, ROLES.MANAGER].includes(user?.role);
  const canManage = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(user?.role);

  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (canView) {
        const params = { page, limit: 15 };
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined && value !== false) {
            params[key] = value;
          }
        });
        const res = await documentApi.list(params);
        setRecords(res.data.records || []);
        setPagination(res.data.pagination || null);
      } else {
        const res = await documentApi.mine();
        setRecords(res.data.records || []);
        setPagination(null);
      }
    } catch (err) {
      setError(err.message || 'Could not load documents');
    } finally {
      setLoading(false);
    }
  }, [canView, filters, page]);

  const loadStats = useCallback(async () => {
    if (!canView) return;
    try {
      const res = await documentApi.stats();
      setStats(res.data.stats || null);
    } catch {
      // Stats are supplementary; fail silently.
    }
  }, [canView]);

  const loadMeta = useCallback(async () => {
    if (!canView) return;
    try {
      const res = await documentApi.meta();
      setEmployees(res.data.employees || []);
    } catch {
      // Meta powers the employee filter; fail silently.
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadStats();
    loadMeta();
  }, [loadStats, loadMeta]);

  const refresh = useCallback(async () => {
    await Promise.all([load(), loadStats()]);
  }, [load, loadStats]);

  const upload = useCallback(
    async (formData) => {
      setBusy('upload');
      try {
        const res = await documentApi.upload(formData);
        toast.success(res.data.message || 'Document uploaded');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not upload document');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const update = useCallback(
    async (id, payload) => {
      setBusy(`update-${id}`);
      try {
        const res = await documentApi.update(id, payload);
        toast.success(res.data.message || 'Document updated');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not update document');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const verify = useCallback(
    async (id, payload) => {
      setBusy(`verify-${id}`);
      try {
        const res = await documentApi.verify(id, payload);
        toast.success(res.data.message || 'Document updated');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not update verification');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const remove = useCallback(
    async (id) => {
      setBusy(`remove-${id}`);
      try {
        await documentApi.remove(id);
        toast.success('Document deleted');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not delete document');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const download = useCallback(
    async (record) => {
      setBusy(`download-${record._id}`);
      try {
        const res = await documentApi.download(record._id);
        const url = URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        const ext = record.fileName?.includes('.') ? record.fileName.split('.').pop() : '';
        link.href = url;
        link.download = `${record.title || 'document'}${ext ? `.${ext}` : ''}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        toast.error(err.message || 'Could not download document');
      } finally {
        setBusy('');
      }
    },
    [toast]
  );

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  return {
    user,
    canView,
    canManage,
    records,
    stats,
    employees,
    filters,
    pagination,
    loading,
    error,
    busy,
    page,
    setPage,
    setFilter,
    resetFilters: () => {
      setFilters(EMPTY_FILTERS);
      setPage(1);
    },
    refresh,
    upload,
    update,
    verify,
    remove,
    download,
  };
}
