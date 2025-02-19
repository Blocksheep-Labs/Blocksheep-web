import { ethers } from "ethers"

export const build = (opponentAddress: string, userAddress: string) => {
    return ethers.utils.defaultAbiCoder.encode(
        ["address", "address"],
        [opponentAddress, userAddress]
    )
}