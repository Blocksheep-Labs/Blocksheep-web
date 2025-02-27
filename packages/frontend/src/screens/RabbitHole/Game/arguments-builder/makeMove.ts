import { ethers } from "ethers";

export const build = (
  fuelSubmission: number, 
  fuelLeft: number, 
  roundIndex: number, 
  userAddress: string, 
  inGameUsers: string[]
) => {
    return ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256", "uint256", "address", "address[]"],
      [fuelSubmission, fuelLeft, roundIndex, userAddress, inGameUsers.filter(i => i !== userAddress)]
    )
}