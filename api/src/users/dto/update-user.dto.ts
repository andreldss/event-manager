import { UserPermissionsDto } from "./user-permissions.dto.js"

export class UpdateUserDto {
  name: string;
  email: string;
  isAdmin: boolean;
  password?: string;
  permissions: UserPermissionsDto;
}