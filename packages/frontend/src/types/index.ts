import { BigNumber } from "ethers";

export type Race = {
  id: number;
  name: string;
  numOfGames: number;
  numOfQuestions: number;
  registered: boolean;
  startAt: BigNumber;
  status: number;
  games: bigint[];
  gamesCompletedPerUser: bigint[],
  refunded: boolean,
  registeredUsers: string[],
  numOfPlayersRequired: number;
};
