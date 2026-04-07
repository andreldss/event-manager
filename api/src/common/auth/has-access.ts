import { AuthUser } from '../types/auth-user.js';

export type AccessLevel = 'none' | 'view' | 'manage';

function accessLevelValue(level: AccessLevel) {
  if (level === 'none') return 0;
  if (level === 'view') return 1;
  return 2;
}

export function hasAccess(
  user: AuthUser,
  permission: keyof NonNullable<typeof user.permissions>,
  requiredLevel: AccessLevel,
) {
  if (user?.isAdmin) {
    return true;
  }

  const currentLevel = user?.permissions?.[permission] ?? 'none';

  return accessLevelValue(currentLevel) >= accessLevelValue(requiredLevel);
}
