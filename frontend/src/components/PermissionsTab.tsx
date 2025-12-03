// This is a comprehensive permissions management interface
// This will be integrated into settings.tsx as the Permissions tab content

import React, { useState, useEffect } from 'react';
import MessagePopup from '@/components/MessagePopup';
import Modal from '@/components/Modal';
import { IconExclamation } from '@/components/icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api-client';
import {
  FEATURE_DEFINITIONS,
  CRUD_ACTION,
  matrixToAssignments,
  getRolePermissionMatrix,
  getRoleDefaultMatrix,
  getEffectivePermissionMatrix,
  crudToDbPermission,
  dbPermissionToCrud,
  type PermissionMatrix,
  type FeatureKey,
  type CrudAction,
  type UserPermissionAssignment,
} from '@/lib/authorization';
import { USER_ROLE, USER_ROLE_VALUES, type UserRoleValue } from '@/lib/prisma-constants';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
}

interface ManagedRolePermission {
  id?: string;
  permission: string;
  resource: string | null;
}

interface UserPermission {
  id: string;
  permission: string;
  resource: string | null;
}

interface PermissionsTabProps {
  users: ManagedUser[];
  onUsersReload: () => void;
}

export const PermissionsTab: React.FC<PermissionsTabProps> = ({ users, onUsersReload }) => {
  const { t } = useLanguage();
  const { user: currentUser, isAdmin, isManager } = useCurrentUser();
  const [subTab, setSubTab] = useState<'features' | 'roles' | 'users'>('features');
  const [selectedRole, setSelectedRole] = useState<UserRoleValue | null>(USER_ROLE.MANAGER);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [roleMatrix, setRoleMatrix] = useState<PermissionMatrix | null>(null);
  const [userMatrix, setUserMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dirty, setDirty] = useState(false);
  const [showApplyToUsersModal, setShowApplyToUsersModal] = useState(false);
  const [applyingToUsers, setApplyingToUsers] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState<Record<FeatureKey, boolean>>(() => {
    const enabled: Record<FeatureKey, boolean> = {} as Record<FeatureKey, boolean>;
    FEATURE_DEFINITIONS.forEach(f => {
      enabled[f.key] = true;
    });
    return enabled;
  });

  const canViewPermissions = isAdmin || isManager;
  const canUpdatePermissions = isAdmin || isManager;

  // Load role permissions
  const loadRolePermissions = async (role: UserRoleValue) => {
    try {
      const response = await apiFetch(`/api/roles/${role}/permissions`);
      if (!response.ok) throw new Error('Failed to load role permissions');
      const data = (await response.json()) as ManagedRolePermission[];
      return data;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  // Load user permissions
  const loadUserPermissions = async (userId: string) => {
    try {
      const response = await apiFetch(`/api/users/${userId}/permissions`);
      if (!response.ok) throw new Error('Failed to load user permissions');
      const data = (await response.json()) as UserPermission[];
      return data;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  // Load feature enabled state from settings
  useEffect(() => {
    const loadFeatureEnabled = async () => {
      try {
        const response = await apiFetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          const enabled: Record<FeatureKey, boolean> = {} as Record<FeatureKey, boolean>;
          FEATURE_DEFINITIONS.forEach(f => {
            const key = `feature_${f.key}_enabled`;
            enabled[f.key] = settings[key] !== 'false';
          });
          setFeatureEnabled(enabled);
        }
      } catch (error) {
        console.error('Failed to load feature enabled state:', error);
      }
    };
    if (canViewPermissions) {
      loadFeatureEnabled();
    }
  }, [canViewPermissions]);

  // Load role matrix when role changes
  useEffect(() => {
    if (!selectedRole || !canViewPermissions) {
      setRoleMatrix(null);
      return;
    }
    
    const loadAndSetMatrix = async () => {
      setLoading(true);
      const permissions = await loadRolePermissions(selectedRole);
      const effectiveMatrix = getRolePermissionMatrix(selectedRole, permissions);
      setRoleMatrix(effectiveMatrix);
      setStatus('idle');
      setLoading(false);
    };
    
    void loadAndSetMatrix();
  }, [selectedRole, canViewPermissions]);

  // Load user matrix when user changes
  useEffect(() => {
    if (!selectedUserId || !canViewPermissions) {
      setUserMatrix(null);
      return;
    }
    
    const loadAndSetUserMatrix = async () => {
      setLoading(true);
      const permissions = await loadUserPermissions(selectedUserId);
      const user = users.find(u => u.id === selectedUserId);
      if (!user) {
        setLoading(false);
        return;
      }
      const effectiveMatrix = getEffectivePermissionMatrix(user.role, permissions);
      setUserMatrix(effectiveMatrix);
      setLoading(false);
    };
    
    void loadAndSetUserMatrix();
  }, [selectedUserId, canViewPermissions, users]);

  // Select all role permissions
  const selectAllRolePermissions = () => {
    if (!roleMatrix || !canUpdatePermissions || !selectedRole || selectedRole === USER_ROLE.ADMIN) {
      return;
    }
    const newMatrix: PermissionMatrix = {} as PermissionMatrix;
    FEATURE_DEFINITIONS.forEach((feature) => {
      newMatrix[feature.key] = { ...roleMatrix[feature.key] };
      feature.actions.forEach((action) => {
        // Don't allow MANAGER to set DELETE permissions
        if (isManager && action === CRUD_ACTION.DELETE) {
          return;
        }
        newMatrix[feature.key][action] = true;
      });
    });
    setRoleMatrix(newMatrix);
    setDirty(true);
  };

  // Remove all role permissions
  const removeAllRolePermissions = () => {
    if (!roleMatrix || !canUpdatePermissions || !selectedRole || selectedRole === USER_ROLE.ADMIN) {
      return;
    }
    const newMatrix: PermissionMatrix = {} as PermissionMatrix;
    FEATURE_DEFINITIONS.forEach((feature) => {
      newMatrix[feature.key] = { ...roleMatrix[feature.key] };
      feature.actions.forEach((action) => {
        newMatrix[feature.key][action] = false;
      });
    });
    setRoleMatrix(newMatrix);
    setDirty(true);
  };

  // Toggle role permission
  const toggleRolePermission = (featureKey: FeatureKey, action: CrudAction) => {
    if (!roleMatrix || !canUpdatePermissions || !selectedRole || selectedRole === USER_ROLE.ADMIN) {
      return;
    }
    if (isManager && action === CRUD_ACTION.DELETE) {
      return;
    }
    const featureDef = FEATURE_DEFINITIONS.find((def) => def.key === featureKey);
    if (!featureDef || !featureDef.actions.includes(action)) {
      return;
    }
    setRoleMatrix((prev) => {
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

  // Select all user permissions
  const selectAllUserPermissions = () => {
    if (!userMatrix || !canUpdatePermissions || !selectedUserId) {
      return;
    }
    const user = users.find(u => u.id === selectedUserId);
    if (!user || user.role === USER_ROLE.ADMIN) {
      return;
    }
    const newMatrix: PermissionMatrix = {} as PermissionMatrix;
    FEATURE_DEFINITIONS.forEach((feature) => {
      newMatrix[feature.key] = { ...userMatrix[feature.key] };
      feature.actions.forEach((action) => {
        newMatrix[feature.key][action] = true;
      });
    });
    setUserMatrix(newMatrix);
    setDirty(true);
  };

  // Remove all user permissions
  const removeAllUserPermissions = () => {
    if (!userMatrix || !canUpdatePermissions || !selectedUserId) {
      return;
    }
    const user = users.find(u => u.id === selectedUserId);
    if (!user || user.role === USER_ROLE.ADMIN) {
      return;
    }
    const newMatrix: PermissionMatrix = {} as PermissionMatrix;
    FEATURE_DEFINITIONS.forEach((feature) => {
      newMatrix[feature.key] = { ...userMatrix[feature.key] };
      feature.actions.forEach((action) => {
        newMatrix[feature.key][action] = false;
      });
    });
    setUserMatrix(newMatrix);
    setDirty(true);
  };

  // Toggle user permission
  const toggleUserPermission = (featureKey: FeatureKey, action: CrudAction) => {
    if (!userMatrix || !canUpdatePermissions || !selectedUserId) {
      return;
    }
    const user = users.find(u => u.id === selectedUserId);
    if (!user || user.role === USER_ROLE.ADMIN) {
      return;
    }
    const featureDef = FEATURE_DEFINITIONS.find((def) => def.key === featureKey);
    if (!featureDef || !featureDef.actions.includes(action)) {
      return;
    }
    setUserMatrix((prev) => {
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

  // Save role permissions (API call only, no state management)
  const saveRolePermissionsOnly = async (): Promise<ManagedRolePermission[]> => {
    if (!selectedRole || !roleMatrix || !canUpdatePermissions || selectedRole === USER_ROLE.ADMIN) {
      throw new Error('Invalid state for saving role permissions');
    }
    
    const assignments = matrixToAssignments(roleMatrix);
    const payload = assignments.map(({ permission, resource }) => ({
      permission: crudToDbPermission(permission),
      resource: resource,
    }));
    
    const response = await apiFetch(`/api/roles/${selectedRole}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: payload }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update role permissions');
    }
    
    return (await response.json()) as ManagedRolePermission[];
  };

  // Update all users with the selected role to match role permissions
  const updateAllUsersWithRole = async () => {
    if (!selectedRole || !roleMatrix || !canUpdatePermissions || selectedRole === USER_ROLE.ADMIN) {
      return;
    }

    setApplyingToUsers(true);
    try {
      // Get all users with this role (excluding system admin)
      const usersWithRole = users.filter(u => u.role === selectedRole && u.email?.toLowerCase() !== 'vuleitsolution@gmail.com');
      
      // Prepare permissions payload
      const assignments = matrixToAssignments(roleMatrix);
      const payload = assignments.map(({ permission, resource }) => ({
        permission: crudToDbPermission(permission),
        resource: resource,
      }));

      // Update each user's permissions
      const updatePromises = usersWithRole.map(async (user) => {
        const response = await apiFetch(`/api/users/${user.id}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions: payload }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to update user ${user.email}: ${errorData.error || 'Unknown error'}`);
        }
        return response.json();
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating users with role permissions:', error);
      throw error;
    } finally {
      setApplyingToUsers(false);
    }
  };

  // Handle save role permissions - show confirmation modal first
  const handleSaveRolePermissions = () => {
    if (!selectedRole || !roleMatrix || !canUpdatePermissions || selectedRole === USER_ROLE.ADMIN) {
      return;
    }
    setShowApplyToUsersModal(true);
  };

  // Save role permissions and optionally apply to all users
  const handleConfirmSaveRolePermissions = async (applyToAllUsers: boolean) => {
    setShowApplyToUsersModal(false);
    
    if (!selectedRole || !roleMatrix || !canUpdatePermissions || selectedRole === USER_ROLE.ADMIN) {
      return;
    }

    setSaving(true);
    setStatus('idle');
    
    try {
      // First, save the role permissions
      const updatedPermissions = await saveRolePermissionsOnly();
      setRoleMatrix(getRolePermissionMatrix(selectedRole, updatedPermissions));

      // If user chose to apply to all users, update all users with this role
      if (applyToAllUsers) {
        await updateAllUsersWithRole();
        onUsersReload(); // Reload users to reflect changes
      }
      
      setDirty(false);
      setStatus('success');
    } catch (error) {
      console.error('Error saving role permissions:', error);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Save user permissions
  const handleSaveUserPermissions = async () => {
    if (!selectedUserId || !userMatrix || !canUpdatePermissions) {
      return;
    }
    const user = users.find(u => u.id === selectedUserId);
    if (!user || user.role === USER_ROLE.ADMIN) {
      return;
    }
    setSaving(true);
    setStatus('idle');
    try {
      const assignments = matrixToAssignments(userMatrix);
      const payload = assignments.map(({ permission, resource }) => ({
        permission: crudToDbPermission(permission),
        resource: resource,
      }));
      const response = await apiFetch(`/api/users/${selectedUserId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: payload }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update user permissions');
      }
      const updatedPermissions = (await response.json()) as UserPermission[];
      setUserMatrix(getEffectivePermissionMatrix(user.role, updatedPermissions));
      setDirty(false);
      setStatus('success');
      onUsersReload();
    } catch (error) {
      console.error('Error saving user permissions:', error);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle feature enabled state
  const toggleFeatureEnabled = async (featureKey: FeatureKey) => {
    if (!canUpdatePermissions) return;
    const newValue = !featureEnabled[featureKey];
    setFeatureEnabled(prev => ({ ...prev, [featureKey]: newValue }));
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`feature_${featureKey}_enabled`]: String(newValue) }),
      });
      setStatus('success');
    } catch (error) {
      console.error('Error updating feature enabled state:', error);
      setFeatureEnabled(prev => ({ ...prev, [featureKey]: !newValue }));
      setStatus('error');
    }
  };

  if (!canViewPermissions) {
    return (
      <div className="bg-white border border-red-200 text-red-700 rounded-lg p-8 text-center">
        {t('permissions.noAccess')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setSubTab('features')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              subTab === 'features'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Feature Management
          </button>
          <button
            onClick={() => setSubTab('roles')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              subTab === 'roles'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Role Permissions
          </button>
          <button
            onClick={() => setSubTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              subTab === 'users'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Permissions
          </button>
        </nav>
      </div>

      {/* Status messages */}
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

      {/* Feature Management Tab */}
      {subTab === 'features' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Enable/Disable</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enable or disable features. Disabled features will be hidden from the UI.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {FEATURE_DEFINITIONS.map((feature) => (
                  <tr key={feature.key}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{feature.label}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{feature.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          featureEnabled[feature.key]
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {featureEnabled[feature.key] ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => toggleFeatureEnabled(feature.key)}
                        disabled={!canUpdatePermissions}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          featureEnabled[feature.key]
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {featureEnabled[feature.key] ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Permissions Tab */}
      {subTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label htmlFor="roleSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Select Role
              </label>
              <select
                id="roleSelect"
                className="input-notus w-full md:max-w-md"
                value={selectedRole ?? ''}
                onChange={(e) => setSelectedRole((e.target.value as UserRoleValue) || null)}
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
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={selectAllRolePermissions}
                disabled={!selectedRole || saving || !roleMatrix || !canUpdatePermissions || selectedRole === USER_ROLE.ADMIN}
              >
                Select All
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={removeAllRolePermissions}
                disabled={!selectedRole || saving || !roleMatrix || !canUpdatePermissions || selectedRole === USER_ROLE.ADMIN}
              >
                Remove All
              </button>
              <button
                type="button"
                className="btn-notus-secondary"
                onClick={() => {
                  if (selectedRole && selectedRole !== USER_ROLE.ADMIN) {
                    setRoleMatrix(getRoleDefaultMatrix(selectedRole));
                    setDirty(true);
                  }
                }}
                disabled={!selectedRole || saving || !roleMatrix || !canUpdatePermissions || selectedRole === USER_ROLE.ADMIN}
              >
                Reset to Defaults
              </button>
              <button
                type="button"
                className="btn-notus-primary"
                onClick={handleSaveRolePermissions}
                disabled={
                  !selectedRole ||
                  !roleMatrix ||
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

          {selectedRole && roleMatrix && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">{t('permissions.matrixLegend')}</p>
              <div className="table-scroll-container">
                <div className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full min-w-max">
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
                                    id={`role-permission-${feature.key}-${action}`}
                                    className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 w-5 h-5"
                                    checked={roleMatrix[feature.key][action] ?? false}
                                    onChange={() => toggleRolePermission(feature.key, action)}
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
            </div>
          )}
        </div>
      )}

      {/* User Permissions Tab */}
      {subTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Select User
              </label>
              <select
                id="userSelect"
                className="input-notus w-full md:max-w-md"
                value={selectedUserId ?? ''}
                onChange={(e) => setSelectedUserId(e.target.value || null)}
                disabled={loading}
              >
                <option value="">Select a user</option>
                {users
                  .filter((u) => u.role !== USER_ROLE.ADMIN)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={selectAllUserPermissions}
                disabled={!selectedUserId || saving || !userMatrix || !canUpdatePermissions}
              >
                Select All
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={removeAllUserPermissions}
                disabled={!selectedUserId || saving || !userMatrix || !canUpdatePermissions}
              >
                Remove All
              </button>
              <button
                type="button"
                className="btn-notus-primary"
                onClick={handleSaveUserPermissions}
                disabled={!selectedUserId || !userMatrix || saving || !dirty || !canUpdatePermissions}
              >
                {saving ? t('common.loading') : 'Save User Permissions'}
              </button>
            </div>
          </div>

          {selectedUserId && userMatrix && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">{t('permissions.matrixLegend')}</p>
              <div className="table-scroll-container">
                <div className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full min-w-max">
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
                            const user = users.find(u => u.id === selectedUserId);
                            const checkboxDisabled =
                              !canUpdatePermissions ||
                              !enabled ||
                              !user ||
                              user.role === USER_ROLE.ADMIN;
                            return (
                              <td key={actionKey} className="px-4 py-3 text-center">
                                {enabled ? (
                                  <input
                                    type="checkbox"
                                    id={`user-permission-${feature.key}-${action}`}
                                    className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 w-5 h-5"
                                    checked={userMatrix[feature.key][action] ?? false}
                                    onChange={() => toggleUserPermission(feature.key, action)}
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
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Applying Role Permissions to Users */}
      <Modal
        isOpen={showApplyToUsersModal}
        onClose={() => setShowApplyToUsersModal(false)}
        title="Apply Role Permissions"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
              <IconExclamation className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Apply permissions to existing users?
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Do you want to apply these permission changes to all existing users with the{' '}
                <strong>{selectedRole}</strong> role?
              </p>
              {selectedRole && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700">
                    <strong>
                      {users.filter(u => u.role === selectedRole && u.role !== USER_ROLE.ADMIN && u.email?.toLowerCase() !== 'vuleitsolution@gmail.com').length}
                    </strong>{' '}
                    user(s) currently have the <strong>{selectedRole}</strong> role.
                  </p>
                </div>
              )}
              <div className="space-y-2 text-sm text-gray-600">
                <p className="font-semibold">If you choose <strong>Yes</strong>:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>All existing users with this role will be updated immediately</li>
                  <li>Their individual permissions will be replaced with the new role permissions</li>
                  <li>This action cannot be undone easily</li>
                </ul>
                <p className="font-semibold mt-3">If you choose <strong>No</strong>:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Only new users created after this update will get the new permissions</li>
                  <li>Existing users will keep their current permissions</li>
                  <li>You can update individual users later if needed</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={() => setShowApplyToUsersModal(false)}
              disabled={saving || applyingToUsers}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleConfirmSaveRolePermissions(false)}
              disabled={saving || applyingToUsers}
            >
              No, Save Only
            </button>
            <button
              type="button"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleConfirmSaveRolePermissions(true)}
              disabled={saving || applyingToUsers}
            >
              {applyingToUsers ? 'Applying...' : 'Yes, Apply to All'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

