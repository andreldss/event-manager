export type AccessLevel = "none" | "view" | "manage";

export class UserPermissionsDto {
    financialAccess: AccessLevel;
    recordsAccess: AccessLevel;
    attachmentsAccess: AccessLevel;
    collectionsAccess: AccessLevel;
    eventsAccess: AccessLevel;
    usersAccess: AccessLevel;
}