import type {GetQueryParams} from "../../types";
import {
    UseGetDetailQuery,
    UseGetQuery,
    UsePostFormDataQuery,
    UseUpdateFormDataQuery,
    UseUpdateQuery
} from "../QueryManager.ts";
import {endpoints} from "../../constants";

export const UseGetOpenPartners = (options?: GetQueryParams) => UseGetQuery({
    identifier: "OpenPartners",
    options: options,
    endpoint: endpoints.openPartners,
})

export const UseGetPartners = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Partners",
    options: options,
    endpoint: endpoints.partners,
})
export const UseGetPartnerDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Partner",
    options: options,
    endpoint: endpoints.partners,
})
export const UseAddPartner = () => UsePostFormDataQuery(endpoints.partners, "addPartner")
export const UseUpdatePartner = () => UseUpdateFormDataQuery(endpoints.partners, "updatePartner")
export const UseDeletePartner = () => UseUpdateQuery(`${endpoints.partners}-delete`, "deletePartner")

export const UseGetOpenTeams = (options?: GetQueryParams) => UseGetQuery({
    identifier: "OpenTeams",
    options: options,
    endpoint: endpoints.openTeams,
})

export const UseGetTeams = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Teams",
    options: options,
    endpoint: endpoints.teams,
})
export const UseGetTeamDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Team",
    options: options,
    endpoint: endpoints.teams,
})
export const UseAddTeam = () => UsePostFormDataQuery(endpoints.teams, "addTeam")
export const UseUpdateTeam = () => UseUpdateFormDataQuery(endpoints.teams, "updateTeam")
export const UseDeleteTeam = () => UseUpdateQuery(`${endpoints.teams}-delete`, "deleteTeam")



export const UseGetOpenCertifications = (options?: GetQueryParams) => UseGetQuery({
    identifier: "OpenCertifications",
    options: options,
    endpoint: endpoints.openCertifications,
})

export const UseGetCertifications = (options?: GetQueryParams) => UseGetQuery({
    identifier: "Certifications",
    options: options,
    endpoint: endpoints.certifications,
})
export const UseGetCertificationDetail = (id: string, options?: GetQueryParams) => UseGetDetailQuery({
    id: id,
    identifier: "Certification",
    options: options,
    endpoint: endpoints.certifications,
})
export const UseAddCertification = () => UsePostFormDataQuery(endpoints.certifications, "addCertification")
export const UseUpdateCertification = () => UseUpdateFormDataQuery(endpoints.certifications, "updateCertification")
export const UseDeleteCertification = () => UseUpdateQuery(`${endpoints.certifications}-delete`, "deleteCertification")
