
import {useMutation, useQuery} from "@tanstack/react-query";
import {formatUrlParams, getQueryKey} from "../utils";
import {cacheTime} from "../constants";
import { GetQueryParams } from "../types";
import http from "./httpService";

type QueryProps = {
    endpoint: string
    id?: string | number
    identifier: string
    options?: GetQueryParams
}

export const UseGetQuery = (props: QueryProps) =>
    useQuery({
        queryKey : getQueryKey(props?.identifier, props?.options),
        queryFn:  async ({ signal }) => http.get(`${props?.endpoint}${formatUrlParams(props?.options)}`, {signal}),
        staleTime: props?.options?.staleTime || cacheTime.long,
        enabled: props?.options?.enabled,
        refetchOnWindowFocus: props?.options?.refetchOnWindowFocus || false,
    })

export const UseGetDetailQuery = (props: QueryProps) =>
    useQuery({
        queryKey: getQueryKey(props?.identifier, [props?.id, props?.options]),
        queryFn: async ({ signal }) => http.get(`${props?.endpoint}/${props?.id}${formatUrlParams(props?.options)}`, {signal}),
        staleTime: props?.options?.staleTime || cacheTime.medium,
        enabled: props?.options?.enabled,
        refetchOnWindowFocus: false,
    })

export const UsePostQuery = (endpoint: string, identifier?: string) => useMutation({
    mutationKey: [identifier],
    mutationFn: async (body: any) => http.post(endpoint, body)
})

export const UsePostFormDataQuery = (endpoint: string,  identifier?: string) =>
    useMutation({
        mutationKey: [identifier],
        mutationFn: async (body: any) => http.post(endpoint, body, { headers: { 'content-type': 'multipart/form-data' } })
    })

export const UsePostAdFormDataQuery = (endpoint: string, identifier?: string, key: string = 'id', options?: GetQueryParams & { endpoint?: string }) =>
    useMutation({
        mutationKey: [identifier],
        mutationFn: async (body: any) => http.post(`${endpoint}/${body[key] || ""}${options?.endpoint || ""}`, body, { headers: { 'content-type': 'multipart/form-data' } })
    })


export const UseUpdateQuery = (endpoint: string,  identifier?: string, key: string = 'id') =>
    useMutation({
        mutationKey:  [identifier],
        mutationFn: async (body: any) => http.post(`${endpoint}/${body[key] || ""}`, body)
        //mutationFn: async (body: any) => http.put(`${endpoint}/${body[key] || ""}`, body)
    })

export const UseUpdateFormDataQuery = (endpoint: string,  identifier?: string, key: string = 'id',  options?: GetQueryParams & { endpoint?: string }) =>
    useMutation({
        mutationKey:  [identifier],
        mutationFn: async (body: any) => http.post(`${endpoint}/${body[key] || ""}${options?.endpoint || ""}`, body, { headers: { 'content-type': 'multipart/form-data' } })
    })

export const UsePutQuery = (endpoint: string,  identifier?: string,) =>
    useMutation({
        mutationKey:  [identifier],
        mutationFn: async (body: any) => http.put(endpoint, body)
    })

export const UseDeleteQuery = (endpoint: string, identifier?: string, key: string = 'id') =>
    useMutation({
        mutationKey: [identifier],
        mutationFn: async (body: any) => http.delete(`${endpoint}/${body[key] || ""}`)
    })

export const UsePatchQuery = (endpoint: string,  identifier?: string, key: string = 'id', options?: GetQueryParams & { endpoint?: string }) =>
    useMutation({
        mutationKey: [identifier],
        mutationFn: async (body: any) => http.patch(`${endpoint}/${body[key] || ""}${options?.endpoint || ""}`)
    })

export const UseFetchFileQuery = (endpoint: string, key: string = 'id', _method: "POST" | "GET" = "POST",  options?: GetQueryParams & { funcKey: string, endpoint?: string, filename?: string }) =>
    useMutation({
        mutationKey: [options?.funcKey],
        mutationFn: async (body: any) => http.fetchFile({method: _method, url: `${endpoint}/${body[key] || ""}${options?.endpoint || ""}`, filename: options?.filename || "fichier"})
    })
