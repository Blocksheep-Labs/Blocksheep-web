
export type TFlowPhases = 
    "STORY_INTRO" | 
    "RACE_START" | 
    "UNDERDOG_PREVIEW" |
    "UNDERDOG_RULES" |  
    "UNDERDOG" | 
    "ADD_NAME" | 
    "STORY_PART_1" |
    "RABBIT_HOLE_PREVIEW" |  
    "RABBIT_HOLE_RULES" |  
    "RABBIT_HOLE" | 
    "STORY_PART_2" | 
    "BULL_RUN_PREVIEW" |
    "BULL_RUN_RULES" |  
    "BULL_RUN" | 
    "STORY_PART_3" | 
    "RABBIT_HOLE_V2_PREVIEW" |
    "RABBIT_HOLE_V2_RULES" |
    "RABBIT_HOLE_V2" | 
    "STORY_PART_4" | 
    "STORY_CONCLUSION" |
    "RATE" | 
    "PODIUM"
;

export default function generateLink(phase: TFlowPhases, raceId: number) {
    switch (phase) {
        case "STORY_INTRO": return `/race/${raceId}/strory/intro`

        case "RACE_START": return `/race/${raceId}/countdown`

        case "UNDERDOG_PREVIEW": return `/race/${raceId}/underdog/preview`
        case "UNDERDOG_RULES": return `/race/${raceId}/underdog/rules`
        case "UNDERDOG": return `/race/${raceId}/underdog`

        case "ADD_NAME": return `/race/${raceId}/set-nickname`
        case "STORY_PART_1": return `/race/${raceId}/story/part1`

        case "RABBIT_HOLE_PREVIEW": return `/race/${raceId}/rabbit-hole/preview`
        case "RABBIT_HOLE_RULES": return `/race/${raceId}/rabbit-hole/rules`
        case "RABBIT_HOLE": return `/race/${raceId}/rabbit-hole`

        case "STORY_PART_2": return `/race/${raceId}/story/part2`

        case "BULL_RUN_PREVIEW": return `/race/${raceId}/bullrun/preview`
        case "BULL_RUN_RULES": return `/race/${raceId}/bullrun/rules`
        case "BULL_RUN": return `/race/${raceId}/bullrun`

        case "STORY_PART_3": return `/race/${raceId}/story/part3`

        case "RABBIT_HOLE_V2_PREVIEW": return `/race/${raceId}/rabbit-hole-v2/preview`
        case "RABBIT_HOLE_V2_RULES": return `/race/${raceId}/rabbit-hole-v2/rules`
        case "RABBIT_HOLE_V2": return `/race/${raceId}/rabbit-hole-v2`

        case "STORY_PART_4": return `/race/${raceId}/story/part4`
        case "STORY_CONCLUSION": return `/race/${raceId}/story/conclusion`
        case "RATE": return `/race/${raceId}/rate`
        case "PODIUM": return `/race/${raceId}/stats`

        default: return "/"
    }
}