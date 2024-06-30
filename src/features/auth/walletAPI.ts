import { Wallet } from "ethers";

// A balance function to mimic making an async request for data
export const fetchBalance = (address = "0xe2FFA8b4a8332d9930cbF85399b4165950ae5F49") => {
  return new Promise<{ data: string }>((resolve) =>
    //resolve and send the balance
    setTimeout(() => resolve({ data: "2.01" }), 500),
  );
};

export const fetchWallet = () => {
  return new Promise<{ wallet: Wallet }>((resolve) => {
    setTimeout(() => resolve({ wallet: Wallet.createRandom() }), 500);
  });
};

