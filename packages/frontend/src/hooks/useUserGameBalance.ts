import { useState, useEffect } from "react";
import { readContract } from "@wagmi/core";
import { BLOCK_SHEEP_CONTRACT } from "../config/constants";
import blocksheepAbi from "../contracts/BlockSheep.json";
import { useSmartAccount } from "./smartAccountProvider";
import { config } from "@/config/wagmi";

export const useUserGameBalance = () => {
    const { smartAccountAddress } = useSmartAccount();

    const [userBalance, setUserBalance] = useState(0);

    useEffect(() => {
        if (smartAccountAddress) {
            readContract(config, {
                address: BLOCK_SHEEP_CONTRACT,
                abi: blocksheepAbi,
                functionName: "balances",
                args: [smartAccountAddress],
            }).then(b => {
                setUserBalance(Number(b));
            });
        }
    }, [smartAccountAddress]);

    return userBalance;
};
