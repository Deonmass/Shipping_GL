import {getAuthData} from "../utils";
import type {PermissionObject} from "../types";
import {appPermissions} from "../constants/appPermissions.ts";

export const HasPermission = (permissionId: number | string, operation: number = 1) => {
    const {permissions: userPermissions, user} = getAuthData()
    if(user?.role_id?.toString() === "1") return true;
    if(permissionId.toString() === appPermissions.none?.toString())   return true
    if (userPermissions && userPermissions[permissionId]) {
        const hasPermission = userPermissions[permissionId];
        const ops = hasPermission.operations.split(",")
        const canOperate = ops.indexOf(operation?.toString())
        return canOperate > -1
    }
    return false
}


export const HasOneOfPermissions = (_permissions: PermissionObject[]) => {
    const {permissions: userPermissions, user} = getAuthData()
    if(user?.role_id?.toString() === "1") return true;
    if(!_permissions?.length) return false
    for (const _permission of _permissions) {
        if(_permission.id?.toString() === appPermissions.none?.toString()) {
            return true
            break;
        }
        if (userPermissions && userPermissions[_permission.id]) {
            const hasPermission = userPermissions[_permission.id];
            const ops = hasPermission.operations.split(",")
            const canOperate = ops.indexOf(_permission.ops?.toString())
            return canOperate > -1
            break;
        }
        return false
    }
    return false
}