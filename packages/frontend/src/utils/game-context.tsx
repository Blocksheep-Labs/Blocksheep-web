import React, { createContext, useContext, useState } from 'react';

export type TStep = "questions" | "board" | "start";

export type GameState = {
  questionsByGames: any;
  amountOfRegisteredUsers: number;
  progress: any;
  step?: TStep;
  raceProgressVisual: any[];
};

// context
const GameContext = createContext<{ 
  gameState: GameState | null; 
  updateGameState: (data: any, progress: any, step?: TStep) => void; 
  setGameStateObject: (state: GameState) => void;
} | null>(null);

// custom hook to use the GameContext
export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};

// provider
export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const updateGameState = (data: any, progress: any, step?: TStep) => {
    const state = generateStateObjectForGame(data, progress, step);
    setGameState(state);
  };
  
  const setGameStateObject = (state: GameState) => {
    setGameState(state);
  }

  return (
    <GameContext.Provider value={{ gameState, updateGameState, setGameStateObject }}>
      {children}
    </GameContext.Provider>
  );
};


const generateStateObjectForGame = (data: any, progress: any, step?: TStep) => {
  return {
    questionsByGames: data.questionsByGames, 
    amountOfRegisteredUsers: data.registeredUsers.length, 
    progress,
    step,
    raceProgressVisual: [],
  }
}
