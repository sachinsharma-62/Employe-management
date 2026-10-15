import { useCallback, useEffect, useState } from 'react';
import payrollApi from '../api/payroll.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { NEXT_PAYROLL_ACTION, ROLES, currentMonthKey } from '../utils/constants';

const buildEmptyFilters = (initialMonth = '') => ({
  month: /^\d{4}-\d{2}$/.test(initialMonth) ? initialMonth : currentMonthKey(),
  department: '',
  status: '',
  search: '',
});

const cleanParams = (filters, extra = {}) => {
  const params = { ...extra };
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params[key] = value;
  });
  return params;
};

export default function usePayroll({ initialMonth = null } = {}) {
  const toast = useToast();
  const { user } = useAuth();
  const canManage = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(user?.role);

  const [filters, setFilters] = useState(() => buildEmptyFilters(initialMonth));
  const [page, setPage] = useState(1);

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [departments, setDepartments] = useState([]);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const loadPayroll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await payrollApi.list(cleanParams(filters, { page }));
      setRecords(res.data.records || []);
      setSummary(res.data.summary || null);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Could not load payroll records');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const loadDepartments = useCallback(async () => {
    try {
      const res = await payrollApi.departments(cleanParams({ month: filters.month }));
      setDepartments(res.data.departments || []);
    } catch {
      setDepartments([]);
    }
  }, [filters.month]);

  const loadReport = useCallback(async () => {
    setLoadingReport(true);
    try {
      const res = await payrollApi.report({ month: filters.month, months: 6 });
      setReport(res.data);
    } catch (err) {
      toast.error(err.message || 'Could not load salary report');
    } finally {
      setLoadingReport(false);
    }
  }, [filters.month, toast]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const refresh = useCallback(async () => {
    await Promise.all([loadPayroll(), loadDepartments(), loadReport()]);
  }, [loadPayroll, loadDepartments, loadReport]);

  const setFilter = useCallback((key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setPage(1);
    setFilters(buildEmptyFilters());
  }, []);

  const generate = useCallback(
    async (payload) => {
      setBusy('generate');
      try {
        const res = await payrollApi.generate(payload);
        toast.success(res.data.message || 'Payroll generated');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not generate payroll');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const saveRecord = useCallback(
    async (id, payload) => {
      setBusy('save');
      try {
        await payrollApi.update(id, payload);
        toast.success('Payslip updated');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not update payslip');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const deleteRecord = useCallback(
    async (id) => {
      setBusy(`delete-${id}`);
      try {
        await payrollApi.remove(id);
        toast.success('Payslip deleted');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not delete payslip');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const advance = useCallback(
    async (record) => {
      const next = NEXT_PAYROLL_ACTION[record.status];
      if (!next) return false;
      setBusy(`action-${record._id}`);
      try {
        await payrollApi[next.action](record._id);
        toast.success(`Payslip marked as ${next.label.toLowerCase()}`);
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not update payroll status');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const revert = useCallback(
    async (record) => {
      setBusy(`revert-${record._id}`);
      try {
        await payrollApi.revert(record._id);
        toast.success('Payslip moved back to draft');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not revert payroll');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const bulk = useCallback(
    async (payload) => {
      setBusy(`bulk-${payload.action}`);
      try {
        const res = await payrollApi.bulk(payload);
        toast.success(res.data.message || 'Payroll updated');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not update payroll');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const downloadPayslip = useCallback(
    async (record) => {
      setBusy(`download-${record._id}`);
      try {
        const res = await payrollApi.downloadPayslipPdf(record._id);
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        const id = record.employee?.employeeId || 'employee';
        link.href = url;
        link.download = `payslip-${record.month}-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast.success('Payslip downloaded');
      } catch (err) {
        toast.error(err.message || 'Could not download payslip');
      } finally {
        setBusy('');
      }
    },
    [toast]
  );

  const sendPayslip = useCallback(
    async (record) => {
      setBusy(`send-${record._id}`);
      try {
        const res = await payrollApi.sendPayslip(record._id);
        toast.success(res.data.message || 'Payslip sent');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not send payslip');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const sendBulk = useCallback(
    async (payload) => {
      setBusy('send-bulk');
      try {
        const res = await payrollApi.sendPayslips(payload);
        toast.success(res.data.message || 'Payslips sent');
        await refresh();
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not send payslips');
        return false;
      } finally {
        setBusy('');
      }
    },
    [refresh, toast]
  );

  const loadHistory = useCallback(
    async (employeeId) => {
      setLoadingHistory(true);
      try {
        const res = await payrollApi.history(employeeId);
        setHistory(res.data);
        return res.data;
      } catch (err) {
        toast.error(err.message || 'Could not load payslip history');
        setHistory(null);
        return null;
      } finally {
        setLoadingHistory(false);
      }
    },
    [toast]
  );

  const downloadReport = useCallback(async () => {
    try {
      const res = await payrollApi.downloadReport({ month: filters.month });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `salary-report-${filters.month}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Salary report downloaded');
    } catch (err) {
      toast.error(err.message || 'Could not download report');
    }
  }, [filters.month, toast]);

  return {
    user,
    canManage,
    filters,
    setFilter,
    resetFilters,
    page,
    setPage,
    pagination,
    records,
    summary,
    departments,
    report,
    history,
    loading,
    loadingReport,
    loadingHistory,
    error,
    busy,
    refresh,
    generate,
    saveRecord,
    deleteRecord,
    advance,
    revert,
    bulk,
    downloadPayslip,
    downloadReport,
    sendPayslip,
    sendBulk,
    loadHistory,
  };
}
