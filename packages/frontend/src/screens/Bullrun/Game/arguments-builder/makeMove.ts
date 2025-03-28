import { ethers } from "ethers"

export const build = (perkIndex: number, opponentAddress: string, userAddress: string) => {
    return ethers.utils.defaultAbiCoder.encode(
        ["uint256", "address", "address"],
        [perkIndex, opponentAddress, userAddress]
    )
}