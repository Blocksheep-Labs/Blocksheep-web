import React from "react";
import LoadingBackground from "../assets/loading/loading-bg.png";
function LoadingModal() {
  return (
    <div className="absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={LoadingBackground} alt="loading-bg" />
      </div>
    </div>
  );
}

export default LoadingModal;
