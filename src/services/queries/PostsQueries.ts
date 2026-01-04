import type {GetQueryParams} from "../../types";
import {
    UseGetDetailQuery,
    UseGetQuery,
    UsePostFormDataQuery,
    UseUpdateFormDataQuery,
    UseUpdateQuery
} from "../QueryManager.ts";
import {endpoints} from "../../constants";

export const UseGetOpenPosts = (options?: GetQueryParams) => UseGetQuery({
    identifier: "OpenPosts",
    options: options,
    endpoint: endpoints.openPosts,
})

export const UseGetPosts = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Posts",
    options: options,
    endpoint: endpoints.posts,
})
export const UseGetPostDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Post",
    options: options,
    endpoint: endpoints.posts,
})
export const UseAddPost = () => UsePostFormDataQuery(endpoints.posts, "addPost")
export const UseUpdatePost = () => UseUpdateFormDataQuery(endpoints.posts, "updatePost")
export const UseDeletePost = () => UseUpdateQuery(`${endpoints.posts}-delete`, "deletePost")
