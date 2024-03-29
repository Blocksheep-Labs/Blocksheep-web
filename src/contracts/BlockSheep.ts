export default [
  {
    type: "constructor",
    inputs: [
      { name: "_underlying", type: "address", internalType: "address" },
      { name: "owner", type: "address", internalType: "address" },
      { name: "_cost", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addGameName",
    inputs: [{ name: "gameName", type: "string", internalType: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addQuestion",
    inputs: [
      { name: "question", type: "string", internalType: "string" },
      { name: "answers", type: "string[]", internalType: "string[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addRace",
    inputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "startAt", type: "uint64", internalType: "uint64" },
      {
        name: "games",
        type: "tuple[]",
        internalType: "struct BlockSheep.GameParams[]",
        components: [
          { name: "gameId", type: "uint256", internalType: "uint256" },
          { name: "questionIds", type: "uint256[]", internalType: "uint256[]" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balances",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "cost",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "distributReward",
    inputs: [
      { name: "raceId", type: "uint256", internalType: "uint256" },
      { name: "gameIndex", type: "uint8", internalType: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "feeCollected",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "register",
    inputs: [{ name: "raceId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitAnswers",
    inputs: [
      { name: "raceId", type: "uint256", internalType: "uint256" },
      { name: "gameIndex", type: "uint8", internalType: "uint8" },
      { name: "answerIds", type: "uint8[]", internalType: "uint8[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "underlying",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IERC20" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      { name: "previousOwner", type: "address", indexed: true, internalType: "address" },
      { name: "newOwner", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "AddressEmptyCode",
    inputs: [{ name: "target", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "AddressInsufficientBalance",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
  },
  { type: "error", name: "AlreadyAnswered", inputs: [] },
  { type: "error", name: "AlreadyDistributed", inputs: [] },
  { type: "error", name: "AlreadyRegistered", inputs: [] },
  { type: "error", name: "EmptyQuestions", inputs: [] },
  { type: "error", name: "FailedInnerCall", inputs: [] },
  { type: "error", name: "InvalidGameIndex", inputs: [] },
  { type: "error", name: "InvalidRaceId", inputs: [] },
  { type: "error", name: "InvalidTimestamp", inputs: [] },
  { type: "error", name: "LengthMismatch", inputs: [] },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
  },
  { type: "error", name: "RaceIsFull", inputs: [] },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
  },
  { type: "error", name: "Timeout", inputs: [] },
] as const;
