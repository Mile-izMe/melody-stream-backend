export const PERMISSIONS_KEY = "permissions"

export enum PermissionName {
	SongCreate = "song:create",
	SongUpdate = "song:update",
	GetRole = "role:get",
	CreateRolePermissions = "role_permission:create",
	GetAllPermissions = "permissions:get",
	CreatePermissions = "permissions:create",
	GetPermissionByRole = "permission_by_role:get",
	GetUserPermissions = "user_permissions:get",
}