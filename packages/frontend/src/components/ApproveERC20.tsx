// import {
//   Address,
//   Web3Button,
//   useAddress,
//   useContract,
//   useContractWrite,
// } from "@thirdweb-dev/react";
// import React, { useMemo } from "react";
// import { useTokenAllowance } from "../hooks/useTokenAllowance";
// import { ethers } from "ethers";

// interface ApproveERC20Props extends React.ComponentPropsWithoutRef<"button"> {
//   token: Address;
//   amount: bigint;
//   contract: Address | undefined;
//   enabled?: boolean;
// }

// enum ApprovalState {
//   LOADING = "LOADING",
//   UNKNOWN = "UNKNOWN",
//   NOT_APPROVED = "NOT_APPROVED",
//   PENDING = "PENDING",
//   APPROVED = "APPROVED",
// }

// function ApproveERC20({ token, amount, contract, children }: ApproveERC20Props) {
//   // const [max, setMax] = useState(false);
//   const address = useAddress();
//   const { contract: erc20 } = useContract(token);
//   const { data: allowance, isLoading: isAllowanceLoading } = useTokenAllowance({
//     token: token,
//     owner: address,
//     spender: contract,
//   });

//   const { mutateAsync, isLoading } = useContractWrite(erc20, "approve");
//   const state = useMemo(() => {
//     let state = ApprovalState.UNKNOWN;
//     if (allowance !== undefined && amount !== undefined && allowance > amount)
//       state = ApprovalState.APPROVED;
//     else if (allowance !== undefined && amount !== undefined && allowance === amount)
//       state = ApprovalState.APPROVED;
//     else if (isLoading) state = ApprovalState.PENDING;
//     else if (isAllowanceLoading) state = ApprovalState.LOADING;
//     else if (allowance !== undefined && amount !== undefined && allowance < amount) {
//       state = ApprovalState.NOT_APPROVED;
//     }
//     return state;
//   }, [allowance, amount, isAllowanceLoading, isLoading]);

//   if (state === ApprovalState.APPROVED) {
//     return <>{children}</>;
//   }

//   return (
//     <Web3Button
//       contractAddress={token}
//       className="!min-w-8 flex-1 !rounded-xl !p-1"
//       action={async () => {
//         await mutateAsync({
//           args: [contract, amount ?? ethers.constants.MaxUint256],
//         });
//       }}
//     >
//       Approve
//     </Web3Button>
//   );
// }

// export default ApproveERC20;
