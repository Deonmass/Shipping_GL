import {AES, Utf8} from 'crypto-es';
const ENCRYPT_TOKEN = import.meta.env.VITE_ENCRYPT_TOKEN

export const encryptData = (data: string) => {
    const ciphertext = AES.encrypt(data, ENCRYPT_TOKEN);
    return ciphertext.toString()
}

export const decryptData = (data: string) => {
    const bytes = AES.decrypt(data, ENCRYPT_TOKEN);
    return bytes.toString(Utf8);
}
