import type {GetQueryParams} from "../../types";
import {
    UseGetDetailQuery,
    UseGetQuery,
    UsePostFormDataQuery,
    UseUpdateFormDataQuery,
    UseUpdateQuery
} from "../QueryManager.ts";
import {endpoints} from "../../constants";

export const UseGetOpenPartners = (options?: GetQueryParams) => UseGetQuery({
    identifier: "OpenPartners",
    options: options,
    endpoint: endpoints.openPartners,
})

export const UseGetPartners = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Partners",
    options: options,
    endpoint: endpoints.partners,
})
export const UseGetPartnerDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Partner",
    options: options,
    endpoint: endpoints.partners,
})
export const UseAddPartner = () => UsePostFormDataQuery(endpoints.partners, "addPartner")
export const UseUpdatePartner = () => UseUpdateFormDataQuery(endpoints.partners, "updatePartner")
export const UseDeletePartner = () => UseUpdateQuery(`${endpoints.partners}-delete`, "deletePartner")
