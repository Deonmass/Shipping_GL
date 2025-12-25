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