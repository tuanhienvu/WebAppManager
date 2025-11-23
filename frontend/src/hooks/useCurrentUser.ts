import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api-client';
import {
  CRUD_ACTION,
  FEATURES,
  getRolePermissionMatrix,
  hasPermissionInMatrix,
  type PermissionMatrix,
  type RolePermissionAssignment,
} from '../lib/authorization';

type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

interface UserPermissionRecord {
  id: string;
  permission: string;
  resource: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  phone?: string | null;
  permissions?: UserPermissionRecord[];
  rolePermissions?: RolePermissionAssignment[];
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiFetch('/api/auth/me');
        if (!response.ok) {
          setUser(null);
          setPermissionMatrix(null);
          return;
        }
        const data = await response.json();
        if (!data.user) {
          setUser(null);
          setPermissionMatrix(null);
          return;
        }

        const authenticatedUser = data.user as User;
        setUser(authenticatedUser);
        // Use role permissions (new system) if available, otherwise fall back to user permissions (backward compatibility)
        setPermissionMatrix(
          getRolePermissionMatrix(
            authenticatedUser.role,
            authenticatedUser.rolePermissions || [],
          ),
        );
      } catch {
        setUser(null);
        setPermissionMatrix(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const hasPermission = useCallback(
    (action: keyof typeof CRUD_ACTION, feature: keyof typeof FEATURES) =>
      hasPermissionInMatrix(permissionMatrix, FEATURES[feature], CRUD_ACTION[action]),
    [permissionMatrix],
  );

  const canAddData =
    hasPermission('CREATE', 'SOFTWARE') ||
    hasPermission('CREATE', 'VERSIONS') ||
    hasPermission('CREATE', 'TOKENS');

  const canEditData =
    hasPermission('UPDATE', 'SOFTWARE') ||
    hasPermission('UPDATE', 'VERSIONS') ||
    hasPermission('UPDATE', 'TOKENS');

  const canDeleteData =
    hasPermission('DELETE', 'SOFTWARE') ||
    hasPermission('DELETE', 'VERSIONS') ||
    hasPermission('DELETE', 'TOKENS');

  const canManageUsers = hasPermission('READ', 'USERS') || hasPermission('UPDATE', 'USERS');
  const canAddUsers = hasPermission('CREATE', 'USERS');
  const canDeleteUsers = hasPermission('DELETE', 'USERS');

  return {
    user,
    loading,
    permissionMatrix,
    hasPermission,
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

