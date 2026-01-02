import { decryptData, encryptData } from './AppEncrypt'

const setItem = (item: string, value: string) =>   localStorage.setItem(item, encryptData(value || ""))

const getItem = (item: string) =>  decryptData(localStorage.getItem(item) || "")

const removeItem = (item: string) =>  localStorage.removeItem(item)

const clearAll = () =>  localStorage.clear()


const exports = {
    setItem,
    getItem,
    removeItem,
    clearAll
}

export default  exports
