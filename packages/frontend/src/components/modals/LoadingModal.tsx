import { useEffect } from "react";
import LoadingBackground from "../../assets/loading/loading-bg.jpg";


function LoadingModal({
  closeHandler, distributeFunction
}: {
  closeHandler: () => void;
  distributeFunction: () => Promise<void>;
}) {
  useEffect(() => {
    distributeFunction()
      .then(data => {
        console.log("Distribute reward:", data);
        closeHandler();
      }).catch(err => {
        console.log("Distribute reward error:", err);
        closeHandler();
      });
  }, []);

  return (
    <div className="loading-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={LoadingBackground} alt="loading-bg" />
      </div>
    </div>
  );
}

export default LoadingModal;
