export { default as http } from './httpService'

export {
    UseLogin,
    UseAddRole,
    UseAddUser,
    UseDeleteRole,
    UseDeleteUser,
    UseGetRoleDetail,
    UseGetRoles,
    UseLogout,
    UseGetUserDetail,
    UseGetUsers,
    UseUpdateRole,
    UseUpdateUser,
    UseGetRolesPermissions,
    UseGetAppPermissions,
    UseUpdateRolePermissions
} from "./queries/UsersQueries.ts"

export {
    UseAddOffice,
    UseDeleteOffice,
    UseGetOfficeDetail,
    UseGetOffices,
    UseUpdateOffice,
    UseGetOpenOffices
} from "./queries/OfficesQueries.ts"