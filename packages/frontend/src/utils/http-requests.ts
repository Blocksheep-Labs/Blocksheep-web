import axios from "axios";
import { SERVER_BASE } from "../config/constants";



// USERS
export const httpSetNameByAddress = async(
    name: string,
    address: string,
) => {
    return await axios.post(`${SERVER_BASE}/users/set-name`, {
        name,
        address, 
    });
}

export const httpGetUserDataByAddress = async(address: string) => {
    return await axios.get(`${SERVER_BASE}/users/by-address`, {
        params: {
            address,
        }
    });
}



// RACES
export const httpGetRaceDataById = async(raceId: string) => {
    return await axios.get(`${SERVER_BASE}/races/id`, {
        params: {
            raceId,
        }
    });
}


export const httpRaceInsertUser = async(raceId: string, userId: string) => {
    return await axios.post(`${SERVER_BASE}/races/insert-user`, {
        raceId, userId
    })
}


export const httpCreateRace = async(raceId: string, storyKey: number) => {
    return await axios.post(`${SERVER_BASE}/races/create`, {
        raceId, storyKey
    });
}