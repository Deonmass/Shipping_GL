export const offices = [
    {
        city: "KINSHASA",
        isHeadquarters: true,
        address: [
            "Street du Livre N° 157,",
            "Pauline Building, 3rd Floor #302,",
            "Commune de GOMBE, KINSHASA, DRC"
        ],
        importance: "Hub principal pour l'accès au Port de Matadi, principal port maritime de la RDC"
    },
    {
        city: "GOMA",
        address: [
            "Avenue Mulay Benezeth, n°50",
            "Quartier les Volcans, Commune de Goma",
            "Nord Kivu, DRC"
        ],
        importance: "Position stratégique pour les corridors commerciaux vers l'Afrique de l'Est"
    },
    {
        city: "LUBUMBASHI",
        address: [
            "AV. SENDWE NO 90",
            "MAKUTANO",
            "COMMUNE DE LUBUMBASHI, DRC"
        ],
        importance: "Porte d'entrée vers le corridor Sud via Kasumbalesa et les ports de Durban"
    },
    {
        city: "DAR ES SALAAM",
        address: [
            "SHIPPING GL",
            "C/O ROYAL FREIGHT",
            "PLOT 995/149, OFF UHURU STREET,",
            "P.O. BOX 4040,",
            "DAR ES SALAAM, TANZANIA"
        ],
        importance: "Accès direct au Port de Dar es Salaam, hub majeur pour l'Afrique de l'Est"
    }
];

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