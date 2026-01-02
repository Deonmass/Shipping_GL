import {createContext, useState} from "react";
import {getAuthData} from "../utils";
import type {AuthDataType} from '../types';

type Props = {
    currentUser: AuthDataType
    setCurrentUser: (user: AuthDataType) => void
}

export const AdminContext = createContext<Props>({
    currentUser: {
        token: null,
        user: null,
        permissions: null,
    },
    setCurrentUser: () => {}
})

const getCurrentUser = () => {
    return getAuthData()
}

const AdminContextProvider: React.FC<any> = (props: any) => {
    const [currentUser, setCurrentUser] = useState<AuthDataType>(getCurrentUser())

    const value: Props = {currentUser, setCurrentUser}

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    );
}

export default AdminContextProvider;
