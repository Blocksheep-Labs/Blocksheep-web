import { ethers } from "ethers";

export const encodeContractFunctionSendingData = (functionSignature: string, types: string[], values: any[]) => {
    const encodedData = ethers.utils.defaultAbiCoder.encode(types,values);

    return ethers.utils.solidityPack(["bytes4", "bytes"], [
        ethers.utils.id(functionSignature).slice(0, 10), // First 4 bytes (function selector)
        encodedData,
    ]);
};