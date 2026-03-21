import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      setLoading(false);
      return;
    }
    const parsedUser = JSON.parse(user);
    if (parsedUser.role === 'administratif') {
      setIsAdmin(true);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  }, [navigate]);

  return { isAdmin, loading };
}