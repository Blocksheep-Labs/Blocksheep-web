import React from "react";
import RibbonLabel from "../components/LibbonLabel";
import RaceItem from "../components/RaceItem";
function SelectRaceScreen() {
  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
      <div className="mt-16 flex w-full justify-center">
        <RibbonLabel />
      </div>
      <div className="mx-8 my-4 flex h-[60%] flex-col gap-20 overflow-y-auto pt-4">
        {Array.from({ length: 10 }, (_, i) => i).map((i) => (
          <RaceItem key={i.toString()} />
        ))}
      </div>
    </div>
  );
}

export default SelectRaceScreen;
