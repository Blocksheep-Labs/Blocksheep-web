import { ethers } from "ethers"

export const build = (userAddress: string) => {
    return ethers.utils.defaultAbiCoder.encode(
        ["address"],
        [userAddress]
    )
}