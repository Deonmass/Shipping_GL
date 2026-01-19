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

export const UseGetQuoteRequests = (options?: GetQueryParams) => UseGetQuery({
    identifier: "QuoteRequests",
    options: options,
    endpoint: endpoints.quoteRequests,
})
export const UseGetQuoteRequestDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "QuoteRequest",
    options: options,
    endpoint: endpoints.quoteRequests,
})
export const UseAddQuoteRequests = () => UsePostFormDataQuery(endpoints.quoteRequests, "addQuoteRequests")
export const UseUpdateQuoteRequests = () => UseUpdateFormDataQuery(endpoints.quoteRequests, "updateQuoteRequests")
export const UseDeleteQuoteRequests = () => UseUpdateQuery(`${endpoints.quoteRequests}-delete`, "deleteQuoteRequests")

export const UseAddOpenQuoteRequests = () => UsePostFormDataQuery(endpoints.openQuoteRequests, "addOpenQuoteRequests")



export const UseGetCotations = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Cotations",
    options: options,
    endpoint: endpoints.cotations,
})
export const UseGetCotationDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Cotation",
    options: options,
    endpoint: endpoints.cotations,
})
export const UseAddCotation = () => UsePostFormDataQuery(endpoints.cotations, "addCotation")
export const UseUpdateCotation = () => UseUpdateFormDataQuery(endpoints.cotations, "updateCotation")
export const UseDeleteCotation = () => UseUpdateQuery(`${endpoints.cotations}-delete`, "deleteCotation")

export const UseGetCotationStatus = (options?: GetQueryParams) => UseGetQuery({
    identifier: "CotationStatus",
    options: options,
    endpoint: endpoints.cotationStatus,
})
export const UseGetCotationStatusDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "CotationStatus",
    options: options,
    endpoint: endpoints.cotationStatus,
})
export const UseAddCotationStatus = () => UsePostFormDataQuery(endpoints.cotationStatus, "addCotationStatus")
export const UseUpdateCotationStatus = () => UseUpdateFormDataQuery(endpoints.cotationStatus, "updateCotationStatus")
export const UseDeleteCotationStatus = () => UseUpdateQuery(`${endpoints.cotationStatus}-delete`, "deleteCotationStatus")
