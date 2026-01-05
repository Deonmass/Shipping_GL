import { endpoints } from "../../constants";
import type {GetQueryParams} from "../../types";
import {
    UseGetDetailQuery,
    UseGetQuery,
    UsePostFormDataQuery,
    UseUpdateFormDataQuery,
    UseUpdateQuery
} from "../QueryManager.ts";

export const UseGetOpenJobOffers = (options?: GetQueryParams) => UseGetQuery({
    identifier: "OpenJobOffers",
    options: options,
    endpoint: endpoints.openJobOffers,
})

export const UseGetJobOffers = (options?: GetQueryParams) => UseGetQuery({
    identifier: "JobOffers",
    options: options,
    endpoint: endpoints.jobOffers,
})
export const UseGetJobOfferDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "JobOffer",
    options: options,
    endpoint: endpoints.jobOffers,
})
export const UseAddJobOffer = () => UsePostFormDataQuery(endpoints.jobOffers, "addJobOffer")
export const UseUpdateJobOffer = () => UseUpdateFormDataQuery(endpoints.jobOffers, "updateJobOffer")
export const UseDeleteJobOffer = () => UseUpdateQuery(`${endpoints.jobOffers}-delete`, "deleteJobOffer")