import { ethers } from "ethers";

export const build = (fuelSubmission: number, fuelLeft: number, roundIndex: number) => {
    return ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256", "uint256"],
      [fuelSubmission, fuelLeft, roundIndex]
    )
}