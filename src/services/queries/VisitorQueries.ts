import type {GetQueryParams} from "../../types";
import {
    UseGetDetailQuery,
    UseGetQuery,
    UsePostFormDataQuery,
    UseUpdateFormDataQuery,
    UseUpdateQuery
} from "../QueryManager.ts";
import {endpoints} from "../../constants";

export const UseGetVisitors = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Visitors",
    options: options,
    endpoint: endpoints.visitors,
})
export const UseGetVisitorDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Visitor",
    options: options,
    endpoint: endpoints.visitors,
})
export const UseAddVisitor = () => UsePostFormDataQuery(endpoints.visitors, "addVisitor")
export const UseUpdateVisitor = () => UseUpdateFormDataQuery(endpoints.visitors, "updateVisitor")
export const UseDeleteVisitor = () => UseUpdateQuery(`${endpoints.visitors}-delete`, "deleteVisitor")

export const UseLoginVisitor = () => UsePostFormDataQuery(`${endpoints.openVisitors}-login`, "loginVisitor")
export const UseRegisterVisitor = () => UsePostFormDataQuery(`${endpoints.openVisitors}-register`, "registerVisitor")
export const UseLogoutVisitor = () => UsePostFormDataQuery(`${endpoints.connectedVisitors}-logout`, "logoutVisitor")
export const UseVisitorCommentPost = () => UsePostFormDataQuery(`${endpoints.connectedVisitors}-comment-post`, "commentPostVisitor")
export const UseVisitorLikePost = () => UsePostFormDataQuery(`${endpoints.connectedVisitors}-like-post`, "likePostVisitor")
