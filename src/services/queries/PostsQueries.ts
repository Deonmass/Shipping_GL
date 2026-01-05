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
