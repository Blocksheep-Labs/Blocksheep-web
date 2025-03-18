import Web3 from "web3";
import BlocksheepAbi from "../../config/abis/blocksheep.json";
import USDCAbi from "../../config/abis/usdc.json";
import envCfg from "../../config/env";

export const registerOnTheRace = async (raceId: number, botAddress: string) => {
    // console.log({ envCfg });

    const botAddrIndex = envCfg.BOTS_ADDRS.indexOf(botAddress);
    if (botAddrIndex === -1) {
        throw new Error(`Bot address ${botAddress} not found in BOTS_ADDRS.`);
    }

    const web3 = new Web3(new Web3.providers.HttpProvider(envCfg.RPC_URL));
    const account = web3.eth.accounts.privateKeyToAccount(envCfg.BOTS_PRIVATE_KEYS[botAddrIndex]);
    if (!web3.eth.accounts.wallet.get(account.address)) {
        web3.eth.accounts.wallet.add(account);
    }

    try {
        const blocksheepContract = new web3.eth.Contract(
            BlocksheepAbi,
            envCfg.BLOCKSHEEP_CONTRACT_ADDRESS
        );

        const usdcContract = new web3.eth.Contract(
            USDCAbi,
            envCfg.USDC_CONTRACT_ADDRESS
        );

        // Get USDC decimals
        const decimals = await usdcContract.methods.decimals().call();
        const needToDeposit = BigInt(30) * BigInt(10 ** Number(decimals));

        // Get bot's balance
        const botNativeBalance = web3.utils.fromWei(await web3.eth.getBalance(account.address), "ether");
        const botInGameBalance = BigInt(await blocksheepContract.methods.balances(account.address).call());

        let amountToDeposit = needToDeposit - botInGameBalance;
        if (amountToDeposit < 0) {
            amountToDeposit = needToDeposit;
        }

        // Mint USDC
        const txMint = await usdcContract.methods.mint(
            account.address,
            amountToDeposit,
            Number(botNativeBalance) < 0.0012
        ).send({ from: account.address });

        console.log("Mint Transaction Hash:", txMint.transactionHash, 'for bot:', account.address);

        // Approve USDC spending
        const txApprove = await usdcContract.methods.approve(
            envCfg.BLOCKSHEEP_CONTRACT_ADDRESS,
            amountToDeposit
        ).send({ from: account.address });

        console.log("Approve Transaction Hash:", txApprove.transactionHash, 'for bot:', account.address);

        // Deposit USDC
        if (amountToDeposit > 0) {
            const txDeposit = await blocksheepContract.methods.deposit(amountToDeposit)
                .send({ from: account.address });

            console.log("Deposit Transaction Hash:", txDeposit.transactionHash, 'for bot:', account.address);
        }

        // Register bot for the race
        const txRegister = await blocksheepContract.methods.register(raceId)
            .send({ from: account.address });

        console.log(`Register transaction successful: ${txRegister.transactionHash} for bot: ${account.address}`);
    } catch (err) {
        console.error("Error sending register TX, reason:", err);
    }
};
