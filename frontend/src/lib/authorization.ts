import { USER_ROLE, type UserRoleValue } from './prisma-constants';

export const CRUD_ACTION = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type CrudAction = (typeof CRUD_ACTION)[keyof typeof CRUD_ACTION];

export const CRUD_ACTION_VALUES: readonly CrudAction[] = Object.values(CRUD_ACTION);

export const FEATURES = {
  SOFTWARE: 'software',
  VERSIONS: 'versions',
  TOKENS: 'tokens',
  AUDIT_LOGS: 'auditLogs',
  SETTINGS: 'settings',
  USERS: 'users',
  PERMISSIONS: 'permissions',
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

interface FeatureDefinition {
  key: FeatureKey;
  label: string;
  description: string;
  actions: CrudAction[];
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    key: FEATURES.SOFTWARE,
    label: 'Software',
    description: 'Manage software catalog entries',
    actions: [CRUD_ACTION.CREATE, CRUD_ACTION.READ, CRUD_ACTION.UPDATE, CRUD_ACTION.DELETE],
  },
  {
    key: FEATURES.VERSIONS,
    label: 'Versions',
    description: 'Publish and edit release versions',
    actions: [CRUD_ACTION.CREATE, CRUD_ACTION.READ, CRUD_ACTION.UPDATE, CRUD_ACTION.DELETE],
  },
  {
    key: FEATURES.TOKENS,
    label: 'Tokens',
    description: 'Issue, update, and revoke access tokens',
    actions: [CRUD_ACTION.CREATE, CRUD_ACTION.READ, CRUD_ACTION.UPDATE, CRUD_ACTION.DELETE],
  },
  {
    key: FEATURES.AUDIT_LOGS,
    label: 'Audit Logs',
    description: 'View security and activity logs',
    actions: [CRUD_ACTION.READ, CRUD_ACTION.DELETE],
  },
  {
    key: FEATURES.SETTINGS,
    label: 'Settings',
    description: 'Update company profile and contact data',
    actions: [CRUD_ACTION.READ, CRUD_ACTION.UPDATE],
  },
  {
    key: FEATURES.USERS,
    label: 'Users',
    description: 'Manage user accounts and access',
    actions: [CRUD_ACTION.CREATE, CRUD_ACTION.READ, CRUD_ACTION.UPDATE, CRUD_ACTION.DELETE],
  },
  {
    key: FEATURES.PERMISSIONS,
    label: 'Permissions',
    description: 'Assign granular permissions to users',
    actions: [CRUD_ACTION.READ, CRUD_ACTION.UPDATE],
  },
];

export const FEATURE_KEYS: readonly FeatureKey[] = FEATURE_DEFINITIONS.map((def) => def.key);

export type PermissionMatrix = Record<FeatureKey, Record<CrudAction, boolean>>;

export interface UserPermissionAssignment {
  permission: string;
  resource: string | null;
}

const createEmptyMatrix = (): PermissionMatrix =>
  FEATURE_DEFINITIONS.reduce((acc, feature) => {
    acc[feature.key] = CRUD_ACTION_VALUES.reduce((actionAcc, action) => {
      actionAcc[action] = false;
      return actionAcc;
    }, {} as Record<CrudAction, boolean>);
    return acc;
  }, {} as PermissionMatrix);

const cloneMatrix = (matrix: PermissionMatrix): PermissionMatrix => {
  const clone = {} as PermissionMatrix;
  FEATURE_DEFINITIONS.forEach((feature) => {
    clone[feature.key] = { ...matrix[feature.key] };
  });
  return clone;
};

const buildMatrixFromConfig = (
  config: Partial<Record<FeatureKey, CrudAction[]>>,
): PermissionMatrix => {
  const matrix = createEmptyMatrix();

  FEATURE_DEFINITIONS.forEach((feature) => {
    const actions = config[feature.key] ?? [];
    actions.forEach((action) => {
      if (feature.actions.includes(action)) {
        matrix[feature.key][action] = true;
      }
    });
  });

  return matrix;
};

const ADMIN_MATRIX = buildMatrixFromConfig(
  FEATURE_DEFINITIONS.reduce((acc, feature) => {
    acc[feature.key] = feature.actions;
    return acc;
  }, {} as Record<FeatureKey, CrudAction[]>),
);

const MANAGER_MATRIX = buildMatrixFromConfig({});

const USER_MATRIX = buildMatrixFromConfig({});

const ROLE_DEFAULT_MATRICES: Record<UserRoleValue, PermissionMatrix> = {
  [USER_ROLE.ADMIN]: ADMIN_MATRIX,
  [USER_ROLE.MANAGER]: MANAGER_MATRIX,
  [USER_ROLE.USER]: USER_MATRIX,
};

export const getRoleDefaultMatrix = (role: UserRoleValue): PermissionMatrix => {
  const matrix = ROLE_DEFAULT_MATRICES[role] ?? USER_MATRIX;
  return cloneMatrix(matrix);
};

const buildMatrixFromAssignments = (
  assignments: UserPermissionAssignment[],
): PermissionMatrix | null => {
  if (!assignments || assignments.length === 0) {
    return null;
  }
  const matrix = createEmptyMatrix();
  let hasValidAssignment = false;
  assignments.forEach(({ permission, resource }) => {
    if (!resource || !isValidFeature(resource)) {
      return;
    }
    const action = dbPermissionToCrud(permission);
    if (!action) {
      return;
    }
    matrix[resource][action] = true;
    hasValidAssignment = true;
  });
  return hasValidAssignment ? matrix : null;
};

export const getEffectivePermissionMatrix = (
  role: UserRoleValue,
  assignments?: UserPermissionAssignment[],
): PermissionMatrix => {
  // System admin (ADMIN) always has full control
  if (role === USER_ROLE.ADMIN) {
    return getRoleDefaultMatrix(USER_ROLE.ADMIN);
  }

  // If user has individual permissions, use those (for backward compatibility)
  // Note: This is deprecated in favor of role-based permissions
  if (assignments && assignments.length > 0) {
    const assignmentMatrix = buildMatrixFromAssignments(assignments);
    if (assignmentMatrix) {
      return assignmentMatrix;
    }
  }
  
  // No default permissions - return empty matrix if no permissions are set
  // Permissions must be explicitly assigned
  return createEmptyMatrix();
};

export interface RolePermissionAssignment {
  permission: string;
  resource: string | null;
}

const buildMatrixFromRoleAssignments = (
  assignments: RolePermissionAssignment[],
): PermissionMatrix | null => {
  if (!assignments || assignments.length === 0) {
    return null;
  }
  const matrix = createEmptyMatrix();
  let hasValidAssignment = false;
  assignments.forEach(({ permission, resource }) => {
    if (!resource || !isValidFeature(resource)) {
      return;
    }
    const action = dbPermissionToCrud(permission);
    if (!action) {
      return;
    }
    matrix[resource][action] = true;
    hasValidAssignment = true;
  });
  return hasValidAssignment ? matrix : null;
};

export const getRolePermissionMatrix = (
  role: UserRoleValue,
  rolePermissions?: RolePermissionAssignment[],
): PermissionMatrix => {
  // System admin (ADMIN) always has full control
  if (role === USER_ROLE.ADMIN) {
    return getRoleDefaultMatrix(USER_ROLE.ADMIN);
  }

  // If role has permissions defined, use those
  if (rolePermissions && rolePermissions.length > 0) {
    const roleMatrix = buildMatrixFromRoleAssignments(rolePermissions);
    if (roleMatrix) {
      return roleMatrix;
    }
  }
  
  // No default permissions - return empty matrix if no permissions are set
  // Permissions must be explicitly assigned
  return createEmptyMatrix();
};

export const matrixToAssignments = (matrix: PermissionMatrix) => {
  const assignments: { permission: CrudAction; resource: FeatureKey }[] = [];
  FEATURE_DEFINITIONS.forEach((feature) => {
    // Check ALL CRUD actions in the matrix, not just those defined in feature.actions
    CRUD_ACTION_VALUES.forEach((action) => {
      if (matrix[feature.key] && matrix[feature.key][action]) {
        assignments.push({ permission: action, resource: feature.key });
      }
    });
  });
  return assignments;
};

export const isValidAction = (value: unknown): value is CrudAction =>
  typeof value === 'string' && CRUD_ACTION_VALUES.includes(value as CrudAction);

export const isValidFeature = (value: unknown): value is FeatureKey =>
  typeof value === 'string' && FEATURE_KEYS.includes(value as FeatureKey);

export const hasPermissionInMatrix = (
  matrix: PermissionMatrix | null,
  feature: FeatureKey,
  action: CrudAction,
) => {
  if (!matrix) {
    return false;
  }
  return Boolean(matrix[feature]?.[action]);
};

export const describeFeature = (feature: FeatureKey) =>
  FEATURE_DEFINITIONS.find((def) => def.key === feature);

const CRUD_TO_DB_PERMISSION: Record<CrudAction, string> = {
  [CRUD_ACTION.CREATE]: 'WRITE',
  [CRUD_ACTION.READ]: 'READ',
  [CRUD_ACTION.UPDATE]: 'SYNC',
  [CRUD_ACTION.DELETE]: 'EXCHANGE',
};

const DB_PERMISSION_TO_CRUD: Record<string, CrudAction> = {
  READ: CRUD_ACTION.READ,
  WRITE: CRUD_ACTION.CREATE,
  SYNC: CRUD_ACTION.UPDATE,
  EXCHANGE: CRUD_ACTION.DELETE,
};

export const crudToDbPermission = (action: CrudAction): string => CRUD_TO_DB_PERMISSION[action];

export const dbPermissionToCrud = (value: string): CrudAction | null =>
  DB_PERMISSION_TO_CRUD[value] ?? null;


