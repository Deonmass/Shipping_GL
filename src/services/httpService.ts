import axios, {type AxiosInstance, type AxiosRequestConfig, type AxiosResponse} from 'axios';
import {localStorageKeys} from "../constants";
import { ResponseBodyType } from '../types';
import { AppStorage } from '../utils';
import AppToast from "../utils/AppToast.ts";


const REACT_APP_BASE_URL = import.meta.env.VITE_API_URL

export const getUserCurrentLocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log("La Géolocalisation n'est pas supporté par ce navigateur");
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const {latitude, longitude} = position.coords;
                resolve({latitude, longitude});
            },
            (err) => {
                let errorMessage = `Erreur de Geolocalisation  (${err.code}): `;
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage += "L'utilisateur a refusé de permettre la Geolocalisation.";
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage += "La position de l'utilisateur n'est pas valable.";
                        break;
                    case err.TIMEOUT:
                        errorMessage += "La requete pour obtenir la position de l'utilisateur a echoué.";
                        break;
                    default:
                        errorMessage += "Une erreur inconnue est survenue pour obtenir la geolocalisation.";
                        break;
                }
                console.log(errorMessage);
                resolve(null); // Resolve with null on error
            },
            {
                // Optional: Options for getCurrentPosition
                enableHighAccuracy: false, // Set to true for more precise but slower results
                timeout: 5000,           // Maximum time (ms) to wait for a position
                maximumAge: 0            // Don't use a cached position
            }
        );
    });
};


const token = AppStorage.getItem(localStorageKeys.token);
const visitorToken = AppStorage.getItem(localStorageKeys.visitorToken);

let headers: any = {
    'content-type': 'application/json',
};

const axiosInstance: AxiosInstance = axios.create({
    baseURL: REACT_APP_BASE_URL,
    headers,
    timeout: 30000,
    //withCredentials: true,
})

axiosInstance.interceptors.request.use(
    async (config) => {
        //const location: any = await getUserCurrentLocation()
        //config.headers['Auth-Location'] = location?.latitude ? `${location?.latitude},${location?.longitude}` : "NOT_AVAILABLE"
        config.headers['Auth-Location'] = "NOT_AVAILABLE"
        return config
    },
    error => Promise.reject('Erreur --> ' + error)
)

const authInterceptor = (config: any) => {
    const newCongif = config;
    if (token) {
        newCongif.headers.Authorization = `Bearer ${token ? token : ''}`;
        newCongif.headers["Auth-Token"] = token ? token : '';
    }
    if (visitorToken) {
        newCongif.headers["Visit-Token"] = visitorToken;
    }
    return newCongif;
};

axiosInstance.interceptors.request.use(authInterceptor, error => {
    return Promise.reject(error);
});

axiosInstance.interceptors.request.use(
    config => config,
    error => Promise.reject('Request Error --> ' + error),
);

const parseRequestData = (data: string) => {
    try {
        return JSON.parse(data)
    } catch (e) {
        return {}
    }
}

async function response(response: AxiosResponse<ResponseBodyType>): Promise<any> {
    if (response?.config?.method?.toLowerCase() === "get" && response?.data?.error) {
        AppToast.error(true, response?.data?.message || "Erreur lors de la requete");
    }
    if(typeof response.data !== "object") {
        AppToast.error(true,"Oups! Erreur inattendue. Réessayez SVP.")
        return false
    }
    return Promise.resolve({
        online: navigator?.onLine,
        statusCode: response?.status || 200,
        responseData: response?.data || '',
        requestData: response?.config?.data
            ? parseRequestData(response?.config?.data)
            : {},
    })
}

axiosInstance.interceptors.response.use(
    response,
    error => {
        console.log(">>>>", error);
        const message =
            error.toString().replace('Axios', '').replace('Error:', '') || '';
        if (!navigator?.onLine) {
            AppToast.warning(true,'Problème de connexion. Vérifiez SVP');
        }
        if (!error || !error?.response || error == 'AxiosError: Network Error') {
            //console.log(">>>>", error);
            ///return;
        }

        if (error?.response?.status?.toString() === "404") {
            AppToast.warning(true,"Please, URL not found.")
            return false
        }

        if (error?.response?.status?.toString() === "419" && error.response.data.message && error.response.data.message.includes("connexion a expiré")) {
            console.log("Please, session expired login again.")
            AppStorage.clearAll()
            window.location.href = error?.response?.data?.data?.request === "visitor" ? "/login" : "/login"
            return false
        }
        return Promise.resolve({
            error: true,
            statusCode: error?.response?.status || 500,
            title: error?.response?.data?.title || '',
            message: error?.response?.data?.message || error?.response?.data?.description || message,
            data: error?.response?.data || '',
        });
    },
);

const get = async (url: string, config?: AxiosRequestConfig<any>): Promise<any> => {
    return axiosInstance.get(url, config)
}

const post = async (url: string, data?: any, config?: AxiosRequestConfig<any>): Promise<ResponseBodyType> => {
    return await axiosInstance.post(url, data, config)
}

const put = async (url: string, data?: any, config?: AxiosRequestConfig<any>): Promise<ResponseBodyType> => {
    return await axiosInstance.put(url, data, config)
}

const _delete = async (url: string, config?: AxiosRequestConfig<any>): Promise<ResponseBodyType> => {
    return await axiosInstance.delete(url, config)
}

const patch = async (url: string, data?: any, config?: AxiosRequestConfig<any>): Promise<ResponseBodyType> => {
    return await axiosInstance.patch(url, data, config)
}

const fetchFile = async ({url, method}: {
    url: string,
    method: "GET" | "POST",
    filename?: string,
    format?: string
}) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token ? token : ''}`);
    myHeaders.append("Auth-Token", token ? token : '');
    myHeaders.append("Visit-Token", visitorToken ? visitorToken : '');
    const res = await fetch(`${REACT_APP_BASE_URL}${url}`, {method, headers: myHeaders})
    const blob = await res.blob()
    if (blob.type === "" || blob.type !== "application/pdf") {
        console.log("Une erreur est survenue ! Ressayez SVP.")
        return
    }
    //fileDownload(blob, `${filename}.${format}`);
    const fileURL = URL.createObjectURL(blob);
    window.open(fileURL, '_blank');
}

const methods = {
    get,
    post,
    put,
    patch,
    delete: _delete,
    fetchFile
};

export default methods;
