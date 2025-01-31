import { ethers } from "ethers";

export const build = (currentQuestionIndex: number, answerIndex: 0 | 1) => {
    return ethers.utils.defaultAbiCoder.encode(
      ["uint8", "uint8"],
      [currentQuestionIndex, answerIndex]
    )
}
