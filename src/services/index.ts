export {default as http} from './httpService'

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
    UseGetTeamDetail,
    UseGetOpenTeams,
    UseGetTeams,
    UseAddTeam,
    UseDeleteTeam,
    UseUpdateTeam,
} from "./queries/PartnersQueries.ts"

export {
    UseGetServiceDetail,
    UseAddService,
    UseDeleteService,
    UseGetOpenServices,
    UseGetServices,
    UseUpdateService,
    UseGetQuoteRequestDetail,
    UseAddQuoteRequests,
    UseAddOpenQuoteRequests,
    UseGetQuoteRequests,
    UseDeleteQuoteRequests,
    UseUpdateQuoteRequests
} from "./queries/ServicesQueries.ts"

export {
    UseGetPostDetail,
    UseAddPost,
    UseDeletePost,
    UseGetPosts,
    UseUpdatePost,
    UseGetOpenPosts,
    UseGetEventDetail,
    UseGetEvents,
    UseGetOpenEvents,
    UseAddEvent,
    UseDeleteEvent,
    UseUpdateEvent,
    UseGetNewsletterDetail,
    UseOpenAddNewsletter,
    UseGetNewsletters,
    UseAddNewsletter,
    UseUpdateNewsletter,
    UseDeleteNewsletter,
    UseGetOpenPostLikes,
    UseGetPostLikes,
    UseGetPostComments,
    UseGetPostLikeDetail,
    UseGetPostCommentDetail,
    UseGetOpenPostComments,
    UseAddPostComment,
    UseAddPostLike,
    UseAddVisitorPostComment,
    UseAddVisitorPostLike,
    UseDeletePostComment,
    UseDeletePostLike,
    UseUpdatePostComment,
    UseUpdatePostLike
} from "./queries/PostsQueries.ts"

export {
    UseGetJobOfferDetail,
    UseAddJobOffer,
    UseDeleteJobOffer,
    UseGetJobOffers,
    UseGetOpenJobOffers,
    UseUpdateJobOffer
} from "./queries/JobOffersQueries.ts"

export {
    UseRegisterVisitor,
    UseVisitorLikePost,
    UseAddVisitor,
    UseDeleteVisitor,
    UseGetVisitors,
    UseGetVisitorDetail,
    UseLoginVisitor,
    UseLogoutVisitor,
    UseUpdateVisitor,
    UseVisitorCommentPost,
} from "./queries/VisitorQueries.ts"