import { useState, useEffect } from 'react';
import { billboardsAPI } from '../api/billboards';

export function useBillboards(params = {}) {
  const [billboards, setBillboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await billboardsAPI.list(params);
        setBillboards(data.data);
        setMeta(data.meta);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [JSON.stringify(params)]);

  return { billboards, loading, error, meta };
}
