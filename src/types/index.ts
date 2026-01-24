export type AuthDataType = {
    token: string | null
    user: ItemType | null
    permissions: any
}

export type ItemType = {
    id?: string | number
    title?: string,
    description?: string,
    status?: string | number
    [key: string]: any
}

export type ResponseBodyType = {
    online: boolean,
    statusCode: number,
    responseData: any,
    message?: string,
    error?: boolean,
}

export type GetQueryParams = {
    fields?: string
    limit?: number
    sortColumn?: string
    sortDirection?: 'asc' | 'desc'
    relations?: string
    pagination?: boolean
    page?: number
    noPermission?: 0 | 1
    staleTime?: number
    enabled?: boolean
    [key: string]: any
}

export type PermissionActionType =  "read" | "read_detail" | "create" | "update" | "delete" | "validate" | "export" | "print"
export type PermissionObject = { id: number | string, ops: number }

export type FormPageType = {
    action?: "add" | "update"
    item?: ItemType,
    isModal?: boolean,
    onSuccessOps?: (newData?: any) => void,
    onSubmitForm?: (data?: any) => void,
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    status?: string | number;
    role_id?: string | number;
    phone?: string;
    [key: string]: any;
}