import { Room } from "./room";
import { User } from "./user";
import { newUUID } from "./uuid";

export enum PermissionType {
  Ban = "ban",
  Censor = "censor",
  Edit = "edit",
}

export type Permission = {
  id: string;
  type: PermissionType;
  userId: string;
};

export function newPermission(user: User, type: PermissionType): Permission {
  return {
    id: newUUID(),
    type,
    userId: user.id,
  } as Permission;
}

export function grantInitialPermissions(room: Room, user: User): Room {
  return {
    ...room,
    permissions: [
      newPermission(user, PermissionType.Ban),
      newPermission(user, PermissionType.Censor),
      newPermission(user, PermissionType.Edit),
    ],
  };
}

export function hasPermissionToBanUsers(user: User, room: Room) {
  return !!room.permissions.find(
    (permission) =>
      permission.userId === user.id && permission.type === PermissionType.Ban,
  );
}

export function hasPermissionToCensorPosts(user: User, room: Room) {
  return !!room.permissions.find(
    (permission) =>
      permission.userId === user.id &&
      permission.type === PermissionType.Censor,
  );
}

export function hasPermissionToEditRoom(user: User, room: Room) {
  return !!room.permissions.find(
    (permission) =>
      permission.userId === user.id && permission.type === PermissionType.Edit,
  );
}

export function serializePermission(permission: Permission) {
  return {
    id: permission.id,
    type: permission.type,
  };
}
