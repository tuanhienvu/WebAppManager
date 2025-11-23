export const TOKEN_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
} as const;

export type TokenStatusValue =
  typeof TOKEN_STATUS[keyof typeof TOKEN_STATUS];

export const TOKEN_STATUS_VALUES: readonly TokenStatusValue[] =
  Object.values(TOKEN_STATUS);

export const PERMISSION = {
  READ: 'READ',
  WRITE: 'WRITE',
  SYNC: 'SYNC',
  EXCHANGE: 'EXCHANGE',
  EXTEND: 'EXTEND',
} as const;

export type PermissionValue =
  typeof PERMISSION[keyof typeof PERMISSION];

export const PERMISSION_VALUES: readonly PermissionValue[] =
  Object.values(PERMISSION);

export const LOG_ACTION = {
  VALIDATE: 'VALIDATE',
  EXTEND: 'EXTEND',
  REVOKE: 'REVOKE',
  EXCHANGE: 'EXCHANGE',
  CREATE: 'CREATE',
} as const;

export type LogActionValue =
  typeof LOG_ACTION[keyof typeof LOG_ACTION];

export const LOG_ACTION_VALUES: readonly LogActionValue[] =
  Object.values(LOG_ACTION);

export const USER_ROLE = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
} as const;

export type UserRoleValue = typeof USER_ROLE[keyof typeof USER_ROLE];

export const USER_ROLE_VALUES: readonly UserRoleValue[] =
  Object.values(USER_ROLE);

