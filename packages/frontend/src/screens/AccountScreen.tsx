// import {
//   Web3Button,
//   useAddress,
//   useContract,
//   useContractRead,
//   useContractWrite,
// } from "@thirdweb-dev/react";
// import { formatUnits, parseUnits } from "ethers/lib/utils";
// import { BLOCK_SHEEP_CONTRACT, USDC_ADDR } from "../constants";
// import ApproveERC20 from "../components/ApproveERC20";
// import BlockSheepABI from "../contracts/BlockSheep";

const btnStyle = "!rounded-xl !p-1 !min-w-8 flex-1";
import { useAppSelector } from "../app/hooks";
import { USDC_MULTIPLIER } from "../config/constants";
// import { selectCount, selectStatus } from "../features/counter/counterSlice";
import { selectWallet, selectWalletStatus } from "../features/auth/walletSlice";
import { useSmartAccount } from "../hooks/smartAccountProvider";
import { useUserBalance } from "../hooks/useUserBalance";
import shortenAddress from "../utils/shortenAddress";
import NextFlag from "../assets/common/flag.png";
import { useNavigate } from "react-router-dom";


const ProfileButton = ({text, onClick, bgColors, icon}: {text: string; onClick?: () => void; bgColors: string, icon: React.ReactNode}) => {
  return (
    <div className="m-auto flex w-[85%] gap-2 shadow-xl">
      <div className={`flex items-center rounded-xl w-full border-b-4 border-r-2 hover:border-0 p-4 ${bgColors}`}>
        <p className="text-center flex flex-row gap-2 font-[Berlin-Bold] text-[16px]">
          {icon}
          {text}
        </p>
      </div>
    </div>
  );
}


function AccountScreen() {
  const { smartAccountAddress } = useSmartAccount();
  const userBalance = useUserBalance(smartAccountAddress as `0x${string}`);
  const navigate = useNavigate();
  const wallet = useAppSelector(selectWallet);

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">

      <div className="mt-10 flex flex-col gap-5 cursor-pointer">
        <ProfileButton 
          text={`Address: ${shortenAddress(smartAccountAddress as string)}`} 
          bgColors="bg-gradient-to-r from-[#efb828] to-[#fbe572] text-[#18243F] hover:text-white border-[#793325]" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path fillRule="evenodd" d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15Zm4.125 3a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-3.873 8.703a4.126 4.126 0 0 1 7.746 0 .75.75 0 0 1-.351.92 7.47 7.47 0 0 1-3.522.877 7.47 7.47 0 0 1-3.522-.877.75.75 0 0 1-.351-.92ZM15 8.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15ZM14.25 12a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15Z" clipRule="evenodd" />
            </svg>
          }
        />
        
        <ProfileButton 
          text={`Balance: ${(Number(userBalance) / USDC_MULTIPLIER).toString()}$`} 
          bgColors="bg-gradient-to-r from-[#efb828] to-[#fbe572] text-[#18243F] hover:text-white border-[#793325]" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path d="M2.273 5.625A4.483 4.483 0 0 1 5.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0 0 18.75 3H5.25a3 3 0 0 0-2.977 2.625ZM2.273 8.625A4.483 4.483 0 0 1 5.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0 0 18.75 6H5.25a3 3 0 0 0-2.977 2.625ZM5.25 9a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3H15a.75.75 0 0 0-.75.75 2.25 2.25 0 0 1-4.5 0A.75.75 0 0 0 9 9H5.25Z" />
            </svg>
          }
        />
        
        <ProfileButton 
          text={`Deposit $`} 
          bgColors="bg-gradient-to-r from-[#55b439] to-[#b5c94b] text-[#18243F] hover:text-white border-[#257948] text-white" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
            </svg>
          }
        />
        
        <ProfileButton 
          text={`Refund $`} 
          bgColors="bg-gradient-to-r from-[#55b439] to-[#b5c94b] text-[#18243F] hover:text-white border-[#257948] text-white"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm3 10.5a.75.75 0 0 0 0-1.5H9a.75.75 0 0 0 0 1.5h6Z" clipRule="evenodd" />
            </svg>
          }
        />
        
        <ProfileButton 
          text={`Logout`} 
          bgColors="bg-gradient-to-r from-red-800 to-red-500 text-[#18243F] hover:text-white border-red-900 text-white" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm5.03 4.72a.75.75 0 0 1 0 1.06l-1.72 1.72h10.94a.75.75 0 0 1 0 1.5H10.81l1.72 1.72a.75.75 0 1 1-1.06 1.06l-3-3a.75.75 0 0 1 0-1.06l3-3a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
          }
        />
      </div>

      <div className="absolute bottom-0 right-0 w-2/5">
        <button
          className="absolute mt-[8%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[30px] text-[#18243F] hover:text-white"
          onClick={() => {
            navigate('/select')
          }}
        >
          Races
        </button>
        <img src={NextFlag} alt="next-flag" />
      </div>
    </div>
  );
}

export default AccountScreen;
