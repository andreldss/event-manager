export type AccessLevel = "none" | "view" | "manage";

export interface UserPermissions {
  financialAccess: AccessLevel;
  recordsAccess: AccessLevel;
  attachmentsAccess: AccessLevel;
  collectionsAccess: AccessLevel;
  eventsAccess: AccessLevel;
  usersAccess: AccessLevel;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  permissions: UserPermissions;
}
