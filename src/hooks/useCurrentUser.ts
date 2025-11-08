import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  avatar?: string | null;
  phone?: string | null;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const canAddData = user?.role === 'USER' || user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canEditData = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canDeleteData = user?.role === 'ADMIN';
  const canManageUsers = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canAddUsers = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canDeleteUsers = user?.role === 'ADMIN';

  return {
    user,
    loading,
    canAddData,
    canEditData,
    canDeleteData,
    canManageUsers,
    canAddUsers,
    canDeleteUsers,
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'MANAGER',
    isUser: user?.role === 'USER',
  };
}

