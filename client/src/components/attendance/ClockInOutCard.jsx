import { useCallback, useEffect, useState } from 'react';
import attendanceApi from '../../api/attendance.api';
import { useToast } from '../../context/ToastContext';
import { SectionLoading } from '../employees/profile/ui';
import CheckInCard from './CheckInCard';

export default function ClockInOutCard() {
  const toast = useToast();
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await attendanceApi.myMonth();
      setToday(res.data.today);
    } catch (err) {
      toast.error(err.message || 'Could not load your attendance');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCheckIn = async (mode) => {
    setBusy('checkin');
    try {
      await attendanceApi.checkIn({ mode });
      toast.success('Clocked in — you are marked Present and Working');
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not clock in');
    } finally {
      setBusy('');
    }
  };

  const handleCheckOut = async (note) => {
    setBusy('checkout');
    try {
      await attendanceApi.checkOut({ note });
      toast.success('Clocked out — working hours saved');
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not clock out');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <SectionLoading label="Loading today's attendance..." />;

  return <CheckInCard today={today} busy={busy} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} />;
}
