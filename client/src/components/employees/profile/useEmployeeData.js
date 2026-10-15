import { useCallback, useEffect, useState } from 'react';

export default function useEmployeeData(employeeId, load) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const run = useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    load(employeeId)
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [employeeId, load]);

  useEffect(() => run(), [run]);

  return { data, loading, error, reload: run };
}
