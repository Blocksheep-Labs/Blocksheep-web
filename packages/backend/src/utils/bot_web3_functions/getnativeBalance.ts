import { ethers } from "ethers";


export const getNativeBalance = async (address: string, provider: ethers.providers.Provider) => {
    try {
        const balance = await provider.getBalance(address);
        return ethers.utils.formatEther(balance);
    } catch (err) {
        console.error("Error fetching native balance:", err);
        return null;
    }
};
