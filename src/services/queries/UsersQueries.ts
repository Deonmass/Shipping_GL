import {endpoints} from "../../constants";
import {UseGetDetailQuery, UseGetQuery, UsePostQuery, UseUpdateQuery} from "../QueryManager.ts";
import {GetQueryParams} from "../../types";

export const UseLogin = () => UsePostQuery(endpoints.login, "login")
export const UseLogout = () => UsePostQuery(endpoints.logout, "logout")
export const UseAddUser = () => UsePostQuery(endpoints.users, "addUser")
export const UseUpdateUser = () => UseUpdateQuery(endpoints.users, "updateUser")
export const UseDeleteUser = () => UseUpdateQuery(`${endpoints.users}-delete`, "deleteUser")
export const UseGetUsers = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Users",
    options: options,
    endpoint: endpoints.users,
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
