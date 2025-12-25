import { decryptData, encryptData } from './AppEncrypt'

const setItem = (item: string, value: string) =>   sessionStorage.setItem(item, encryptData(value || ""))

const getItem = (item: string) =>  decryptData(sessionStorage.getItem(item) || "")

const removeItem = (item: string) =>  sessionStorage.removeItem(item)

const clearAll = () =>  sessionStorage.clear()


const exports = {
    setItem,
    getItem,
    removeItem,
    clearAll
}

export default  exports
