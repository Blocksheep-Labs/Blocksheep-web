export const fetchGameResult = (raceId: number, gameId: number) => {
  return new Promise<{ data: number }>((resolve) =>
    setTimeout(() => resolve({ data: { raceId, gameId } }), 500),
  );
};

/*
  Game
  {  
    uint256 gameId;
    uint64 endAt;
    uint8 numOfQuestions;
    // questionIndex => Question
    mapping(uint8 => Question) questions;
    mapping(address => uint256) scoreByAddress;
  }
  Game Obj =>  {
      gameId, 
      endAt,
      numberOfQuestions,
      [
        {
          question: {
            questionId, 
            draw, 
            distributed,
            answeredPlayerCount,
            playersByAnswer: {
              0: [address1, address2],
              1: [address3, address4]
            },
            answered: {
              address1: 0,
              address2: 0,
              address3: 1,
              address4: 1
            }
        }
      },
      {
        question: {

        }
      }
    ]
    }

*/
/*
  Race
  struct Race {
    string name;
    uint64 startAt;
    uint8 numOfGames;
    uint8 numOfQuestions;
    uint8 playersCount;
    mapping(uint256 => Game) games;
    mapping(address => bool) playerRegistered;
  }

  race Obj => [
     race1: {
      name,
      startAt,
      numOfGames,
      numOfQuestions,
      playersCount,
      games: [
        0: {
          gameId, 
          endAt,
          numberOfQuestions,
          [
            {
              question1: {
                questionId, 
                draw, 
                distributed,
                answeredPlayerCount,
                playersByAnswer: {
                  0: [address1, address2],
                  1: [address3, address4]
                },
                answered: {
                  address1: 0,
                  address2: 0,
                  address3: 1,
                  address4: 1
                }
            }
          },
          {
            question2: {
    
            }
          }
        }
      ],
    },
    race2: {
      name,
      startAt,
      numOfGames,
      numOfQuestions,
      playersCount,
      games: [
        {
          gameId, 
          endAt,
          numberOfQuestions,
          [
            {
              question1: {
                questionId, 
                draw, 
                distributed,
                answeredPlayerCount,
                playersByAnswer: {
                  0: [address1, address2],
                  1: [address3, address4]
                },
                answered: {
                  address1: 0,
                  address2: 0,
                  address3: 1,
                  address4: 1
                }
            }
          },
          {
            question2: {
    
            }
          }
        }
      ],
    }
  ]

*/

/*
  struct Score{
    uint256 credit;
    uint256 score;
    mapping(bytes32 => bool) scoreFinalized;
  }

  score obj => [
    score:{
      value: {
        raceId,
        gameIndex,
        userAddress
      }
      credit,
      score,
      scoreFinalized: {
        address1: true,
        address2: false
      }
    }
  ]
*/

export const fetchGames = (raceId: number) => {
  //for games of a race

  return new Promise<{ data: number }>((resolve) =>
    setTimeout(() => resolve({ data: raceId }), 500),
  );
};

export const fetchRaces = (raceId: number) => {
  //for races of the system
  /*
    string name;
    uint64 startAt;
    uint8 numOfGames;
    uint8 numOfQuestions;
    uint8 playersCount;
    mapping(uint256 => Game) games;
    mapping(address => bool) playerRegistered;
  */
  return new Promise<{ date: number }>((resolve) =>
    setTimeout(() => resolve({ date: raceId }), 500),
  );
};
