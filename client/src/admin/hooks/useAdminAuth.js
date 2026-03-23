import { useEffect, useState } from 'react';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsAdmin(true);
    setLoading(false);
  }, []);

  return { isAdmin, loading };
}