import { useCallback, useEffect, useState } from 'react';
import payrollApi from '../api/payroll.api';
import { useToast } from '../context/ToastContext';

export default function useMyPayslips() {
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await payrollApi.mine();
      setRecords(res.data.records || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      setError(err.message || 'Could not load your payslips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const downloadPayslip = useCallback(
    async (record) => {
      setDownloading(record._id);
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
        setDownloading('');
      }
    },
    [toast]
  );

  return { records, summary, loading, error, downloading, refresh: load, downloadPayslip };
}
