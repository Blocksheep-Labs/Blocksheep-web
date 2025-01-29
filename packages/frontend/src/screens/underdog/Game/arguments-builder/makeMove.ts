import { MAKE_MOVE_SELECTOR, MAKE_MOVE_TYPES } from "@/hooks/useMakeMove";
import { ethers } from "ethers";


export const build = (raceId: number, currentQuestionIndex: number, answerIndex: 0 | 1) => {
    return ethers.utils.solidityPack(
        MAKE_MOVE_TYPES,
        [
          MAKE_MOVE_SELECTOR, 
          Number(raceId), 
          ethers.utils.defaultAbiCoder.encode(
            ["uint8", "uint8"],
            [currentQuestionIndex, answerIndex]
          )
        ]
    )
}
