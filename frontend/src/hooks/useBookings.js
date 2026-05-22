import { useState, useEffect } from 'react';
import { bookingsAPI } from '../api/bookings';

export function useBookings(params = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await bookingsAPI.list(params);
        setBookings(data.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [JSON.stringify(params)]);

  return { bookings, loading, error };
}
