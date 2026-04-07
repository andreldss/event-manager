import { AccessLevel, AuthUser } from "@/types/auth-user";

export function hasAccess(
  user: AuthUser | null,
  permission: keyof AuthUser["permissions"],
  requiredLevel: AccessLevel,
) {
  if (!user) return false;

  if (user.isAdmin) {
    return true;
  }

  const values = {
    none: 0,
    view: 1,
    manage: 2,
  };

  const currentLevel = user.permissions?.[permission] ?? "none";

  return values[currentLevel] >= values[requiredLevel];
}
