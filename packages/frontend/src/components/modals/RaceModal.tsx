import { useEffect, useState } from "react";
import NextFlag from "../../assets/common/flag.png";
import RaceBoard from "../RaceBoard";
import { httpGetRaceDataById } from "../../utils/http-requests";

export type RaceModalProps = {
  raceId: number;
  progress: { curr: number; delta: number; address: string  }[];
  handleClose: () => void;
  disableBtn: boolean,
};

function RaceModal({ progress, handleClose, disableBtn, raceId }: RaceModalProps) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (raceId) {
      httpGetRaceDataById(`race-${raceId}`).then(({data}) => {
        setUsers(data.race.users);
      });
    }
  }, [raceId]);

  return (
    <div className="race-board absolute inset-0 bg-[rgb(153,161,149)]">
      { // <RaceBoard progress={progress} users={users}/>
      }

      <div className="absolute bottom-0 right-0 w-2/5">
        <button
          className="absolute mt-[5%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[36px] disabled:text-[20px] text-[#18243F] hover:text-white disabled:text-gray-500 disabled:hover:text-gray-500 disabled:mt-5"
          onClick={() => {
            handleClose();
          }}
          disabled={disableBtn}
        >
          {disableBtn ? "Waiting..." : "Next"}
        </button>
        <img src={NextFlag} alt="next-flag" />
      </div>
    </div>
  );
}

export default RaceModal;
