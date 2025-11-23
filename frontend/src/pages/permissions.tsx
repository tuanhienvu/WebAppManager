import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import MessagePopup from '@/components/MessagePopup';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api-client';
import {
  FEATURE_DEFINITIONS,
  CRUD_ACTION,
  matrixToAssignments,
  getRolePermissionMatrix,
  getRoleDefaultMatrix,
  crudToDbPermission,
  type PermissionMatrix,
  type FeatureKey,
  type CrudAction,
} from '@/lib/authorization';
import { USER_ROLE, USER_ROLE_VALUES, type UserRoleValue } from '@/lib/prisma-constants';

type ManagedRolePermission = {
  id?: string;
  permission: string;
  resource: string | null;
};

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
};

const PermissionsPage = () => {
  const { t } = useLanguage();
  const { user, loading: userLoading } = useCurrentUser();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRoleValue | null>(null);
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dirty, setDirty] = useState(false);

  // ADMIN and MANAGER can view and update permissions
  const isAdmin = user?.role === USER_ROLE.ADMIN;
  const isManager = user?.role === USER_ROLE.MANAGER;
  const canViewPermissions = isAdmin || isManager;
  const canUpdatePermissions = isAdmin || isManager; // ADMIN and MANAGER can update permissions

  const loadUsers = async () => {
    try {
      const response = await apiFetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      const data = (await response.json()) as ManagedUser[];
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadRolePermissions = async (role: UserRoleValue) => {
    try {
      const response = await apiFetch(`/api/roles/${role}/permissions`);
      if (!response.ok) {
        throw new Error('Failed to load role permissions');
      }
      const data = (await response.json()) as ManagedRolePermission[];
      return data;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  useEffect(() => {
    if (!userLoading && user && canViewPermissions) {
      void loadUsers();
      // Set default selected role to MANAGER if not ADMIN
      if (!selectedRole) {
        setSelectedRole(USER_ROLE.MANAGER);
      }
    } else if (!canViewPermissions) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, user, canViewPermissions]);

  useEffect(() => {
    if (!selectedRole) {
      setMatrix(null);
      return;
    }
    
    const loadAndSetMatrix = async () => {
      setLoading(true);
      const permissions = await loadRolePermissions(selectedRole);
      const effectiveMatrix = getRolePermissionMatrix(selectedRole, permissions);
      setMatrix(effectiveMatrix);
      setStatus('idle');
      setLoading(false);
    };
    
    void loadAndSetMatrix();
  }, [selectedRole]);

  const togglePermission = (
    featureKey: FeatureKey,
    action: CrudAction,
  ) => {
    if (!matrix || !canUpdatePermissions || !selectedRole) {
      return;
    }
    // ADMIN role cannot be modified (always has full control)
    if (selectedRole === USER_ROLE.ADMIN) {
      return;
    }
    // MANAGER cannot toggle DELETE actions
    if (isManager && action === CRUD_ACTION.DELETE) {
      return;
    }
    const featureDef = FEATURE_DEFINITIONS.find((def) => def.key === featureKey);
    if (!featureDef || !featureDef.actions.includes(action)) {
      return;
    }
    setMatrix((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [featureKey]: {
          ...prev[featureKey],
          [action]: !prev[featureKey][action],
        },
      };
    });
    setDirty(true);
  };

  const handleReset = () => {
    if (!selectedRole || !canUpdatePermissions) return;
    // ADMIN always has full control, cannot be reset
    if (selectedRole === USER_ROLE.ADMIN) return;
    setMatrix(getRoleDefaultMatrix(selectedRole));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedRole || !matrix || !canUpdatePermissions) {
      return;
    }
    // ADMIN role cannot be modified
    if (selectedRole === USER_ROLE.ADMIN) {
      return;
    }
    setSaving(true);
    setStatus('idle');
    try {
      const assignments = matrixToAssignments(matrix);
      // Convert CRUD actions to DB permission format
      const payload = assignments.map(({ permission, resource }) => ({
        permission: crudToDbPermission(permission),
        resource: resource,
      }));
      console.log('Saving permissions:', { role: selectedRole, count: payload.length, payload });
      const response = await apiFetch(`/api/roles/${selectedRole}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: payload }),
      });
      if (!response.ok) {
        let errorMessage = 'Failed to update role permissions';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `${errorMessage} (${response.status})`;
        }
        console.error('Permission update error:', errorMessage);
        throw new Error(errorMessage);
      }
      const updatedPermissions = (await response.json()) as ManagedRolePermission[];
      setMatrix(getRolePermissionMatrix(selectedRole, updatedPermissions));
      setDirty(false);
      setStatus('success');
    } catch (error) {
      console.error('Error saving permissions:', error);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignUserRole = async (userId: string, newRole: UserRoleValue) => {
    if (!canUpdatePermissions) return;
    
    const SYSTEM_ADMIN_EMAIL = 'vuleitsolution@gmail.com';
    const user = users.find(u => u.id === userId);
    const isSystemAdmin = user?.email?.toLowerCase() === SYSTEM_ADMIN_EMAIL.toLowerCase();
    
    // Rule 1: No user can be assigned ADMIN role (except system admin)
    if (newRole === USER_ROLE.ADMIN && !isSystemAdmin) {
      setStatus('error');
      return;
    }

    // Rule 2: System admin cannot be assigned to lower roles (MANAGER, USER)
    if (isSystemAdmin && newRole !== USER_ROLE.ADMIN) {
      setStatus('error');
      return;
    }

    try {
      const response = await apiFetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update user role');
      }
      await loadUsers();
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  if (!userLoading && (!user || (!canViewPermissions && !canUpdatePermissions))) {
    return (
      <Layout>
        <div className="bg-white border border-red-200 text-red-700 rounded-lg p-8 text-center">
          {t('permissions.noAccess')}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('permissions.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('permissions.description')}
            </p>
          </div>
          {dirty && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              {t('permissions.unsavedChanges')}
            </span>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label htmlFor="roleSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Select Role
              </label>
              <select
                id="roleSelect"
                className="input-notus w-full md:max-w-md"
                value={selectedRole ?? ''}
                onChange={(event) => setSelectedRole((event.target.value as UserRoleValue) || null)}
                disabled={loading}
              >
                <option value="">Select a role</option>
                {USER_ROLE_VALUES.map((role) => (
                  <option key={role} value={role}>
                    {role} {role === USER_ROLE.ADMIN && '(Full Control)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-notus-secondary"
                onClick={handleReset}
                disabled={!selectedRole || saving || !matrix || !canUpdatePermissions || selectedRole === USER_ROLE.ADMIN}
              >
                Reset to Defaults
              </button>
              <button
                type="button"
                className="btn-notus-primary"
                onClick={handleSave}
                disabled={
                  !selectedRole ||
                  !matrix ||
                  saving ||
                  !dirty ||
                  !canUpdatePermissions ||
                  selectedRole === USER_ROLE.ADMIN
                }
              >
                {saving ? t('common.loading') : 'Save Role Permissions'}
              </button>
            </div>
          </div>

          {selectedRole === USER_ROLE.ADMIN && (
            <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              System Admin has full control over all features. Permissions cannot be modified.
            </div>
          )}

          {status === 'success' && (
            <MessagePopup
              variant="success"
              message={t('permissions.successMessage')}
              onClose={() => setStatus('idle')}
            />
          )}
          {status === 'error' && (
            <MessagePopup
              variant="error"
              message={t('permissions.errorMessage')}
              onClose={() => setStatus('idle')}
            />
          )}

          {!selectedRole && (
            <div className="text-center text-gray-500 py-10">
              Please select a role to manage permissions
            </div>
          )}

          {selectedRole && matrix && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">{t('permissions.matrixLegend')}</p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {t('permissions.feature')}
                      </th>
                        {Object.keys(CRUD_ACTION).map((actionKey) => (
                          <th
                            key={actionKey}
                            className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                          >
                            {t(`permissions.${actionKey.toLowerCase()}` as const)}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {FEATURE_DEFINITIONS.map((feature) => (
                      <tr key={feature.key} className="bg-white">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{feature.label}</div>
                          <div className="text-xs text-gray-500">{feature.description}</div>
                        </td>
                        {Object.keys(CRUD_ACTION).map((actionKey) => {
                          const action = CRUD_ACTION[actionKey as keyof typeof CRUD_ACTION];
                          const enabled = feature.actions.includes(action);
                          // Disable DELETE action for MANAGER users
                          const isDeleteAction = action === CRUD_ACTION.DELETE;
                          const checkboxDisabled =
                            !canUpdatePermissions ||
                            selectedRole === USER_ROLE.ADMIN ||
                            !enabled ||
                            (isManager && isDeleteAction);
                          return (
                            <td key={actionKey} className="px-4 py-3 text-center">
                              {enabled ? (
                                <input
                                  type="checkbox"
                                  id={`permission-${feature.key}-${action}`}
                                  name={`permission-${feature.key}-${action}`}
                                  className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 w-5 h-5"
                                  checked={matrix[feature.key][action] ?? false}
                                  onChange={() =>
                                    togglePermission(
                                      feature.key,
                                      action,
                                    )
                                  }
                                  disabled={checkboxDisabled}
                                />
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Users with MANAGER Role ({users.filter(u => u.role === USER_ROLE.MANAGER).length})
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {users.filter(u => u.role === USER_ROLE.MANAGER).length === 0 ? (
                  <p className="text-sm text-gray-500">No users assigned to this role</p>
                ) : (
                  <div className="space-y-2">
                    {users.filter(u => u.role === USER_ROLE.MANAGER).map((user) => (
                      <div key={user.id} className="items-center justify-between bg-white p-3 rounded border border-gray-200">
                        <div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                          <span className="text-sm text-gray-500"> | {user.email}</span>
                          <span className="text-sm text-gray-400"> | Current: {user.role}</span>
                        </div>
                        {canUpdatePermissions && (
                          <select
                            className="input-notus text-sm"
                            value={user.role}
                            onChange={(e) => handleAssignUserRole(user.id, e.target.value as UserRoleValue)}
                            disabled={user.email?.toLowerCase() === 'vuleitsolution@gmail.com'}
                          >
                            {USER_ROLE_VALUES.filter((role) => {
                              // Rule 1: Hide ADMIN option for non-system-admin users
                              const isSystemAdmin = user.email?.toLowerCase() === 'vuleitsolution@gmail.com';
                              if (role === USER_ROLE.ADMIN && !isSystemAdmin) {
                                return false;
                              }
                              return true;
                            }).map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        )}
                        {user.email?.toLowerCase() === 'vuleitsolution@gmail.com' && (
                          <span className="text-xs text-gray-500 ml-2">(System Admin - Role cannot be changed)</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          

          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Users with USER Role ({users.filter(u => u.role === USER_ROLE.USER).length})</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {users.filter((u) => u.role === USER_ROLE.USER).length === 0 ? (
                <p className="text-sm text-gray-500">No users with USER role</p>
              ) : (
                <div className="space-y-2">
                  {users
                    .filter((u) => u.role === USER_ROLE.USER)
                    .map((user) => (
                      <div
                        key={user.id}
                        className=" items-center justify-between bg-white p-3 rounded border border-gray-200"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                          <span className="text-sm text-gray-500 ml-2"> | {user.email}</span>
                          <span className="text-sm text-gray-400 ml-2"> | Current: {user.role}</span>
                        </div>
                        {canUpdatePermissions && (
                          <select
                            className="input-notus text-sm"
                            value={user.role}
                            onChange={(e) => handleAssignUserRole(user.id, e.target.value as UserRoleValue)}
                            disabled={user.email?.toLowerCase() === 'vuleitsolution@gmail.com'}
                          >
                            {USER_ROLE_VALUES.filter((role) => {
                              // Rule 1: Hide ADMIN option for non-system-admin users
                              const isSystemAdmin = user.email?.toLowerCase() === 'vuleitsolution@gmail.com';
                              if (role === USER_ROLE.ADMIN && !isSystemAdmin) {
                                return false;
                              }
                              return true;
                            }).map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        )}
                        {user.email?.toLowerCase() === 'vuleitsolution@gmail.com' && (
                          <span className="text-xs text-gray-500 ml-2">(System Admin - Role cannot be changed)</span>
                        )}
                      </div>
                      
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PermissionsPage;

