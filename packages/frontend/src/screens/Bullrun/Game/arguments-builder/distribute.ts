import { ethers } from "ethers"

export const build = (opponentAddress: string) => {
    return ethers.utils.defaultAbiCoder.encode(
        ["address"],
        [opponentAddress]
    )
}