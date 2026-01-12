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

export const UseGetOpenEvents = (options?: GetQueryParams) => UseGetQuery({
    identifier: "OpenEvents",
    options: options,
    endpoint: endpoints.openEvents,
})

export const UseGetEvents = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Events",
    options: options,
    endpoint: endpoints.events,
})
export const UseGetEventDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Event",
    options: options,
    endpoint: endpoints.events,
})
export const UseAddEvent = () => UsePostFormDataQuery(endpoints.events, "addEvent")
export const UseUpdateEvent = () => UseUpdateFormDataQuery(endpoints.events, "updateEvent")
export const UseDeleteEvent = () => UseUpdateQuery(`${endpoints.events}-delete`, "deleteEvent")


export const UseGetNewsletters = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Newsletters",
    options: options,
    endpoint: endpoints.newsletters,
})
export const UseGetNewsletterDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Newsletter",
    options: options,
    endpoint: endpoints.newsletters,
})
export const UseAddNewsletter = () => UsePostFormDataQuery(endpoints.newsletters, "addNewsletter")
export const UseUpdateNewsletter = () => UseUpdateFormDataQuery(endpoints.newsletters, "updateNewsletter")
export const UseDeleteNewsletter = () => UseUpdateQuery(`${endpoints.newsletters}-delete`, "deleteNewsletter")

export const UseOpenAddNewsletter = () => UsePostFormDataQuery(endpoints.openNewsletters, "openAddNewsletter")


export const UseGetOpenPostComments = (options?: GetQueryParams) => UseGetQuery({
    identifier: "OpenPostComments",
    options: options,
    endpoint: endpoints.openPostComments,
})
export const UseAddVisitorPostComment = () => UsePostFormDataQuery(`${endpoints.connectedVisitors}-comment-post`, "addVisitorPostComment")


export const UseGetPostComments = (options?: GetQueryParams) => UseGetQuery({
    identifier: "PostComments",
    options: options,
    endpoint: endpoints.postComments,
})
export const UseGetPostCommentDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "PostComment",
    options: options,
    endpoint: endpoints.postComments,
})
export const UseAddPostComment = () => UsePostFormDataQuery(endpoints.postComments, "addPostComment")
export const UseUpdatePostComment = () => UseUpdateFormDataQuery(endpoints.postComments, "updatePostComment")
export const UseDeletePostComment = () => UseUpdateQuery(`${endpoints.postComments}-delete`, "deletePostComment")



export const UseGetOpenPostLikes = (options?: GetQueryParams) => UseGetQuery({
    identifier: "OpenPostLikes",
    options: options,
    endpoint: endpoints.openPostLikes,
})
export const UseAddVisitorPostLike = () => UsePostFormDataQuery(`${endpoints.connectedVisitors}-like-post`, "addVisitorPostLike")


export const UseGetPostLikes = (options?: GetQueryParams) => UseGetQuery({
    identifier: "PostLikes",
    options: options,
    endpoint: endpoints.postLikes,
})
export const UseGetPostLikeDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "PostLike",
    options: options,
    endpoint: endpoints.postLikes,
})
export const UseAddPostLike = () => UsePostFormDataQuery(endpoints.postLikes, "addPostLike")
export const UseUpdatePostLike = () => UseUpdateFormDataQuery(endpoints.postLikes, "updatePostLike")
export const UseDeletePostLike = () => UseUpdateQuery(`${endpoints.postLikes}-delete`, "deletePostLike")
