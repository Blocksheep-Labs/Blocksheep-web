import { TFlowPhases } from "../../../utils/linkGetter";

export type TRabbitholeGameVersion = "v1" | "v2";

export default function rabbitholeGetGamePart(
    version: TRabbitholeGameVersion, 
    type: "preview" | "rules" | "game"
): TFlowPhases {
    switch (version) {
        case "v1":
            switch (type) {
                case "preview": return "RABBIT_HOLE_PREVIEW";
                case "rules":   return "RABBIT_HOLE_RULES"  ;
                case "game":    return "RABBIT_HOLE"        ;
                default:        return "RABBIT_HOLE_PREVIEW";
            }

        case "v2":
            switch (type) {
                case "preview": return "RABBIT_HOLE_V2_PREVIEW";
                case "rules":   return "RABBIT_HOLE_V2_RULES"  ;
                case "game":    return "RABBIT_HOLE_V2"        ;
                default:        return "RABBIT_HOLE_V2_PREVIEW";
            }

        default:
            return "RABBIT_HOLE_PREVIEW"
    }
}