import { ethers } from "ethers"

export const build = (perkIndex: number, opponentAddress: string) => {
    return ethers.utils.defaultAbiCoder.encode(
        ["uint256", "address"],
        [perkIndex, opponentAddress]
    )
}