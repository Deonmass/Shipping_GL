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
    UseUpdateRolePermissions,
    UseGetUsersStats,
    UseToggleUserStatus
} from "./queries/UsersQueries.ts"

export {
    UseAddOffice,
    UseDeleteOffice,
    UseGetOfficeDetail,
    UseGetOffices,
    UseUpdateOffice,
    UseGetOpenOffices
} from "./queries/OfficesQueries.ts"

export {
    UseAddCategory,
    UseGetCategoryDetail,
    UseDeleteCategory,
    UseGetCategories,
    UseGetOpenCategories,
    UseUpdateCategory
} from "./queries/CategoriesQueries.ts"

export {
    UseGetPartnerDetail,
    UseAddPartner,
    UseDeletePartner,
    UseGetPartners,
    UseUpdatePartner,
    UseGetOpenPartners,
} from "./queries/PartnersQueries.ts"

export {
    UseGetServiceDetail,
    UseAddService,
    UseDeleteService,
    UseGetOpenServices,
    UseGetServices,
    UseUpdateService,
} from "./queries/ServicesQueries.ts"

export {
    UseGetPostDetail,
    UseAddPost,
    UseDeletePost,
    UseGetPosts,
    UseUpdatePost,
    UseGetOpenPosts,
} from "./queries/PostsQueries.ts"