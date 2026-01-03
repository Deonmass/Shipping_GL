export {default as endpoints} from './endpoints'

export const localStorageKeys = {
    token: 'ldSAywaJOSdlaAhreab3342jkhvzx02HdHHDgsaosxkjbzpsnsgfas',
    user: 'Udg2lashjdvskiu21e937sakshlxba93wbs93',
    permissions: 'Hpagdb9273kjhvxlauhgedlkhxszx83ksbnp',
}

export const cacheTime = {
    long: 6000,
    medium: 3000,
    short: 1000,
    none: 0,
}



export const appOps = {
    read: 1,
    create:  2,
    update: 3,
    delete: 4
}

export const categoriesTypes= [
    {
        value: "news",
        name: "Actualités"
    },
    {
        value: "partner",
        name: "Partenaires"
    },
    {
        value: "job",
        name: "Postes"
    },
]


export const permissionsOperations= [
    {
        id: 1,
        title: "Voir"
    },
    {
        id: 2,
        title: "Ajouter"
    },
    {
        id: 3,
        title: "Modifier"
    },
    {
        id: 4,
        title: "Supprimer"
    }
]


export const staticPermissions = [
    "offices",


    "dashboard",
    "users",
    "users_assign_roles",
    "users_permissions",
    "partners",
    "posts",
    "comments",
    "likes",
    "events",
    "categories",
    "newsletter",
    "services",
    "notifications_like",
    "notifications_comment",
    "notifications_post",
    "notifications_partner",
    "notifications_update",
    "reports",
    "settings",
    "updates",
    "quote_requests",
    "notifications_quote",
    "recruitment",
    "job_offers",
    "candidates",
    "menu_visibility",
    "offices"
]