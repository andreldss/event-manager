export type AccessLevel = 'none' | 'view' | 'manage';

export class UserPermissions {
  financialAccess: AccessLevel;
  recordsAccess: AccessLevel;
  attachmentsAccess: AccessLevel;
  collectionsAccess: AccessLevel;
  eventsAccess: AccessLevel;
  usersAccess: AccessLevel;
}

export class AuthUser {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  permissions: UserPermissions;
}
