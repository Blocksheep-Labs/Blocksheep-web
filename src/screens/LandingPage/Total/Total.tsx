// import { useEthersSigner } from "@/hooks/useEthersSigner"
// import WalletConnectButton from "@/components/WalletConnectButton"
// import ConnectButton from "@/components/ConnectButton"
import Lever from "./Lever";
// import { RabbitHead } from "./RabbitHead";
// import { Darkness } from "./Darkness";
// import PlayerMovement from "./PlayerMovement";
// import { RabbitTail } from "./RabbitTail";
import StatusTable from "./StatusTable";

const Total = () => {
  // const { phase, players, onChangeSpeed, userSpeed, playGame, playing, initGame, initializing } =
  //   useGame();
  // const signer = useEthersSigner();
  const playing = false;

  return (
    <div className="jusitfy-center relative flex h-screen w-screen flex-col items-center">
      <StatusTable />
      <div className="h-[25vh]" />
      <div className="tunnel samsungS8:mt-[15vh] relative mt-[15vh] !w-full md:mt-[60px]">
        {/* {players?.length > 0 && <PlayerMovement phase={phase} players={players} />}
        <Darkness phase={phase} />
        <RabbitHead phase={phase} />
        <RabbitTail phase={phase} /> */}
      </div>

      <div className="control-panels mt-[13vh] md:mt-[60px]">
        <Lever />
        <div className="panel">
          {/* <input
            className="3md:m-[8px] !focus:border-green disabled m-[4.8px] w-full
                      appearance-none rounded-[3.6px] 
                      p-[2.4px_1.8px_2.8px_6.6px] text-sm outline-0 !ring-0
                      transition duration-300
              hover:scale-[1.01] sm:rounded-[6px] sm:p-[4px_3px_4px_11px] md:text-base"
            type="number"
            placeholder="None"
            onChange={onChangeSpeed}
            min={1}
            max={10}
            value={userSpeed}
          /> */}
        </div>
      </div>
      <div className="mt-[10vh] flex w-full items-center justify-center gap-[10px]">
        <button
          type="button"
          className={`shadow-md 
          ${
            // players?.length < 3 || initializing
            true
              ? "bg-white_3 text-white_4 cursor-not-allowed"
              : "bg-green cursor-pointer text-white"
          }
          rounded-[5px] !border-0 
          p-[4px_15px] !outline-0 !ring-0
          transition duration-300 hover:scale-105`}
          // onClick={initGame}
          // disabled={players?.length < 3 || initializing}
        >
          {/* {initializing  ? "Initializing..." : "Init Game"} */}
          {"1" == "1" ? "Initializing..." : "Init Game"}
        </button>

        {/* {!signer  */}
        {"1" == "1" && (
          <button>Wallet Connect</button>
          // <WalletConnectButton>
          //   <ConnectButton />
          // </WalletConnectButton>
        )}
        {/* {signer && ( */}
        {
          <button
            type="button"
            className="bg-green cursor-pointer rounded-[5px] 
            !border-0 p-[4px_15px] text-white
            shadow-md !outline-0 !ring-0
               transition duration-300 hover:scale-105"
            // onClick={playGame}
            // disabled={players?.length < 3 || playing}
          >
            {playing ? "Playing..." : "Start Game"}
          </button>
        }
      </div>
      <div />
    </div>
  );
};

export default Total;
