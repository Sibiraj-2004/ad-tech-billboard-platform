import { useState, useEffect } from 'react';
import { favoritesAPI } from '../api/favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data } = await favoritesAPI.list();
      setFavorites(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return { favorites, loading, refetch: fetchFavorites };
}
