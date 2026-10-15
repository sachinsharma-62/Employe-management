import { useCallback, useEffect, useState } from 'react';
import settingsApi from '../api/settings.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/constants';

export default function useSettings() {
  const toast = useToast();
  const { user } = useAuth();
  const canManage = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(user?.role);

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await settingsApi.get();
      setSettings(res.data.settings);
    } catch (err) {
      setError(err.message || 'Could not load the settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (request, sectionName, successMessage) => {
      setBusy(sectionName);
      try {
        const res = await request();
        const saved = res.data.settings;
        setSettings((prev) => ({ ...prev, ...{ [sectionName]: saved } }));
        toast.success(successMessage || 'Settings updated');
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not save settings');
        return false;
      } finally {
        setBusy('');
      }
    },
    [toast]
  );

  const saveCompany = useCallback(
    (formData) => save(() => settingsApi.updateCompany(formData), 'company', 'Company information updated'),
    [save]
  );
  const savePayroll = useCallback(
    (payload) => save(() => settingsApi.updatePayroll(payload), 'payroll', 'Payroll settings updated'),
    [save]
  );
  const saveLeave = useCallback(
    (payload) => save(() => settingsApi.updateLeave(payload), 'leave', 'Leave policy updated'),
    [save]
  );
  const saveHoliday = useCallback(
    (payload) => save(() => settingsApi.updateHoliday(payload), 'holiday', 'Holiday settings updated'),
    [save]
  );
  const saveNotifications = useCallback(
    (payload) =>
      save(() => settingsApi.updateNotifications(payload), 'notifications', 'Notification settings updated'),
    [save]
  );
  const saveEmail = useCallback(
    (payload) => save(() => settingsApi.updateEmail(payload), 'email', 'Email settings updated'),
    [save]
  );

  const testEmail = useCallback(
    async (payload) => {
      setBusy('email-test');
      try {
        const res = await settingsApi.testEmail(payload);
        return { ok: true, message: res.data.message || 'SMTP connection verified' };
      } catch (err) {
        return { ok: false, message: err.message || 'Connection could not be verified' };
      } finally {
        setBusy('');
      }
    },
    []
  );

  return {
    settings,
    loading,
    error,
    busy,
    canManage,
    refresh: load,
    saveCompany,
    savePayroll,
    saveLeave,
    saveHoliday,
    saveNotifications,
    saveEmail,
    testEmail,
  };
}