import {localStorageKeys} from "../constants";
import {AppStorage} from "../utils";
import {AuthDataType} from "../types";

export {default as AppStorage} from './AppLocalStorage'
export {decryptData, encryptData} from './AppEncrypt'


export const formatUrlParams = (params?: { [key: string]: any }) => {
    if (!params) return ''
    let url = ''
    Object.keys(params).map((item, index) => {
        if (index === 0) url = params[item] ? `?${item}=${params[item] || ''}` : `?r=''`
        else url += params[item] ? `&${item}=${params[item] || ''}` : ""
        return item
    })
    return url
}

export const getQueryKey = (key: string, params?: { [key: string]: any }) => {
    if (!params) return [key]
    const options = Object.values(params).map(item => item)
    return [key, ...options]
}

export const setAuthUser = (data: AuthDataType) => {
    AppStorage.setItem(localStorageKeys.token, data.token || '')
    AppStorage.setItem(localStorageKeys.user, JSON.stringify(data.user))
    AppStorage.setItem(localStorageKeys.permissions, JSON.stringify(data.permissions))
}

export const getAuthData = (): AuthDataType => {
    const token = AppStorage.getItem(localStorageKeys.token)
    let user: any = AppStorage.getItem(localStorageKeys.user)
    user = user ? JSON.parse(user) : null
    let permissions = AppStorage.getItem(localStorageKeys.permissions)
    permissions = permissions ? JSON.parse(permissions) : null
    return {token, user, permissions}
}

export const removeAuthData = () => {
    AppStorage.removeItem(localStorageKeys.token)
    AppStorage.removeItem(localStorageKeys.user)
    AppStorage.removeItem(localStorageKeys.permissions)
    AppStorage.clearAll()
}