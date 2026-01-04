import type {GetQueryParams} from "../../types";
import {
    UseGetDetailQuery,
    UseGetQuery,
    UsePostFormDataQuery,
    UseUpdateFormDataQuery,
    UseUpdateQuery
} from "../QueryManager.ts";
import {endpoints} from "../../constants";

export const UseGetOpenServices = (options?: GetQueryParams) => UseGetQuery({
    identifier: "OpenServices",
    options: options,
    endpoint: endpoints.openServices,
})

export const UseGetServices = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Services",
    options: options,
    endpoint: endpoints.services,
})
export const UseGetServiceDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Service",
    options: options,
    endpoint: endpoints.services,
})
export const UseAddService = () => UsePostFormDataQuery(endpoints.services, "addService")
export const UseUpdateService = () => UseUpdateFormDataQuery(endpoints.services, "updateService")
export const UseDeleteService = () => UseUpdateQuery(`${endpoints.services}-delete`, "deleteService")
