export const fetchGameResult = (raceId: number, gameId: number) => {
  return new Promise<{ data: number }>((resolve) =>
    setTimeout(() => resolve({ data: { raceId, gameId } }), 500),
  );
};

export const fetchGames = (raceId: number) => {
  return new Promise<{ data: number }>((resolve) =>
    setTimeout(() => resolve({ data: raceId }), 500),
  );
};

export const fetchRaces = (raceId: number) => {
  return new Promise<{ date: number }>((resolve) =>
    setTimeout(() => resolve({ date: raceId }), 500),
  );
};
