
export type TFlowPhases = 
    "STORY_INTRO" | 
    "RACE_START" | 
    "UNDERDOG_PREVIEW" |
    "UNDERDOG_RULES" |  
    "UNDERDOG" | 
    "RACE_UPDATE_1" |
    "STORY_PART_1" |
    "RABBIT_HOLE_PREVIEW" |  
    "RABBIT_HOLE_RULES" |  
    "RABBIT_HOLE" | 
    "RACE_UPDATE_2" |
    "STORY_PART_2" | 
    "BULLRUN_PREVIEW" |
    "BULLRUN_RULES" |  
    "BULLRUN" | 
    "RACE_UPDATE_3" |
    "STORY_PART_3" | 
    "RABBIT_HOLE_V2_PREVIEW" |
    "RABBIT_HOLE_V2_RULES" |
    "RABBIT_HOLE_V2" | 
    "RACE_UPDATE_4" |
    "STORY_PART_4" | 
    "STORY_CONCLUSION" |
    "RATE" | 
    "PODIUM" | 
    "LEVEL_UPDATE"
;

export default function generateLink(phase: TFlowPhases, raceId: number) {
    switch (phase) {
        case "STORY_INTRO": return `/race/${raceId}/story/intro`

        case "RACE_START": return `/race/${raceId}/countdown`

        case "UNDERDOG_PREVIEW": return `/race/${raceId}/underdog/preview`
        case "UNDERDOG_RULES": return `/race/${raceId}/underdog/rules`
        case "UNDERDOG": return `/race/${raceId}/underdog`

        case "RACE_UPDATE_1": return `/race/${raceId}/race-update/board1`
        case "STORY_PART_1": return `/race/${raceId}/story/part1`

        case "RABBIT_HOLE_PREVIEW": return `/race/${raceId}/rabbit-hole/v1/preview`
        case "RABBIT_HOLE_RULES": return `/race/${raceId}/rabbit-hole/v1/rules`
        case "RABBIT_HOLE": return `/race/${raceId}/rabbit-hole/v1`

        case "RACE_UPDATE_2": return `/race/${raceId}/race-update/board2`
        case "STORY_PART_2": return `/race/${raceId}/story/part2`

        case "BULLRUN_PREVIEW": return `/race/${raceId}/bullrun/preview`
        case "BULLRUN_RULES": return `/race/${raceId}/bullrun/rules`
        case "BULLRUN": return `/race/${raceId}/bullrun`

        case "RACE_UPDATE_3": return `/race/${raceId}/race-update/board3`
        case "STORY_PART_3": return `/race/${raceId}/story/part3`

        case "RABBIT_HOLE_V2_PREVIEW": return `/race/${raceId}/rabbit-hole/v2/preview`
        case "RABBIT_HOLE_V2_RULES": return `/race/${raceId}/rabbit-hole/v2/rules`
        case "RABBIT_HOLE_V2": return `/race/${raceId}/rabbit-hole/v2`

        case "RACE_UPDATE_4": return `/race/${raceId}/race-update/board4`
        case "STORY_PART_4": return `/race/${raceId}/story/part4`
        case "STORY_CONCLUSION": return `/race/${raceId}/story/conclusion`
        case "RATE": return `/race/${raceId}/rate`
        case "PODIUM": return `/race/${raceId}/stats`

        case "LEVEL_UPDATE": return `/race/${raceId}/level-update`

        default: return "/"
    }
}