import { Navigate, Outlet } from 'react-router-dom'
import {HasOneOfPermissions} from "../utils/PermissionChecker.ts";

type PropsType = {
    isAccessible?: boolean
    permissions?: any[]
}

export default function NotAllowedRoute(props: PropsType) {
    const {permissions} = props
    if(permissions?.length) {
        if (!HasOneOfPermissions(permissions)) {
            return <Navigate to="not-allowed" replace/>;
        }
    }
    return <Outlet/>;
}
