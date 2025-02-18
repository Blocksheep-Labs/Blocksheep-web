import { readContract } from '@wagmi/core';
import { config } from "@/config/wagmi";
import { BLOCK_SHEEP_CONTRACT } from "@/config/constants";
import BlockSheepAbi from "@/contracts/BlockSheep.json";
import { useSmartAccount } from './smartAccountProvider';
import { useEffect, useState } from 'react';


export const useCheckAdminAccess = () => {
    const { smartAccountAddress } = useSmartAccount();
    const [ hasAccess, setHasAccess ] = useState(false);
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        if (smartAccountAddress) {
            setLoading(true);
            readContract(config, {
                address: BLOCK_SHEEP_CONTRACT,
                abi: BlockSheepAbi,
                functionName: "userHasAdminAccess",
                args: [smartAccountAddress]
            }).then(userIsAdmin => {
                console.log({userIsAdmin});
                setHasAccess(Boolean(userIsAdmin));
            }).catch(() => {
                console.log("User access can not be checked properly");
            }).finally(() => {
                setLoading(false);
            })
        }
    }, [smartAccountAddress]);

    return { hasAccess, loading };
}