import {endpoints} from "../../constants";
import {UseGetDetailQuery, UseGetQuery, UsePostQuery, UseUpdateQuery} from "../QueryManager.ts";
import {GetQueryParams} from "../../types";

export const UseLogin = () => UsePostQuery(endpoints.login, "login")
export const UseLogout = () => UsePostQuery(endpoints.logout, "logout")
export const UseAddUser = () => UsePostQuery(endpoints.users, "addUser")
export const UseUpdateUser = () => UseUpdateQuery(endpoints.users, "updateUser")
export const UseUpdateUserPassword = () => UseUpdateQuery(`${endpoints.users}-change-password`, "updateUserPassword")
export const UseToggleUserStatus = () => UseUpdateQuery(`${endpoints.users}-toggle-status`, "toggleStatusUser")
export const UseDeleteUser = () => UseUpdateQuery(`${endpoints.users}-delete`, "deleteUser")
export const UseGetUsers = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Users",
    options: options,
    endpoint: endpoints.users,
})
export const UseGetUsersStats = (options?: GetQueryParams) => UseGetQuery({
    identifier: "UsersStats",
    options: options,
    endpoint: `${endpoints.users}-stats`,
})
export const UseGetUserDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "User",
    options: options,
    endpoint: endpoints.users,
})


export const UseGetRoles = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Roles",
    options: options,
    endpoint: endpoints.roles,
})
export const UseGetRoleDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Role",
    options: options,
    endpoint: endpoints.roles,
})
export const UseAddRole = () => UsePostQuery(endpoints.roles, "addRole")
export const UseUpdateRole = () => UseUpdateQuery(endpoints.roles, "updateRole")
export const UseDeleteRole = () => UseUpdateQuery(`${endpoints.roles}-delete`, "deleteRole")

export const UseGetRolesPermissions = (options?: GetQueryParams) => UseGetQuery({
    identifier: "RolesPermissions",
    options: options,
    endpoint: endpoints.rolesPermissions,
})
export const UseUpdateRolePermissions = () => UsePostQuery(`${endpoints.rolesPermissions}-add-multi`, "updateRolePermissions")

export const UseGetAppPermissions = (options?: GetQueryParams) => UseGetQuery({
    identifier: "AppPermissions",
    options: options,
    endpoint: endpoints.appPermissions,
})


export const UseGetDashboardStats = (options?: GetQueryParams) => UseGetQuery({
    identifier: "DashboardStats",
    options: options,
    endpoint: endpoints.dashboard,
})

// export const UseGetAppPermissionOps = (options?: GetQueryParams) => UseGetQuery({
//     identifier: "AppPermissionsOps",
//     options: options,
//     endpoint: endpoints.appPermissionsOps,
// })
// export const UseGetUserPermissions = (options?: GetQueryParams & {user_id?: string, key_format?: string}) => UseGetQuery({
//     identifier: "UserPermissions",
//     options: options,
//     endpoint: endpoints.userPermissions,
// })
// export const UseAddUserPermission = () => UsePostQuery(endpoints.userPermissions, "addUserPermission")
