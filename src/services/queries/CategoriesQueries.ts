import { endpoints } from "../../constants";
import type {GetQueryParams} from "../../types";
import {
    UseGetDetailQuery,
    UseGetQuery,
    UsePostFormDataQuery,
    UseUpdateFormDataQuery,
    UseUpdateQuery
} from "../QueryManager.ts";

export const UseGetOpenCategories = (options?: GetQueryParams) => UseGetQuery({
    identifier: "OpenCategories",
    options: options,
    endpoint: endpoints.categories,
})

export const UseGetCategories = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Categories",
    options: options,
    endpoint: endpoints.categories,
})
export const UseGetCategoryDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Category",
    options: options,
    endpoint: endpoints.categories,
})
export const UseAddCategory = () => UsePostFormDataQuery(endpoints.categories, "addCategory")
export const UseUpdateCategory = () => UseUpdateFormDataQuery(endpoints.categories, "updateCategory")
export const UseDeleteCategory = () => UseUpdateQuery(`${endpoints.categories}-delete`, "deleteCategory")
