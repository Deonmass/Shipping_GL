import { endpoints } from "../../constants";
import type {GetQueryParams} from "../../types";
import {
    UseGetDetailQuery,
    UseGetQuery,
    UsePostFormDataQuery,
    UseUpdateFormDataQuery,
    UseUpdateQuery
} from "../QueryManager.ts";

export const UseGetOffices = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Offices",
    options: options,
    endpoint: endpoints.offices,
})
export const UseGetOfficeDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Office",
    options: options,
    endpoint: endpoints.offices,
})
export const UseAddOffice = () => UsePostFormDataQuery(endpoints.offices, "addOffice")
export const UseUpdateOffice = () => UseUpdateFormDataQuery(endpoints.offices, "updateOffice")
export const UseDeleteOffice = () => UseUpdateQuery(`${endpoints.offices}-delete`, "deleteOffice")