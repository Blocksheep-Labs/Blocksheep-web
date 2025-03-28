import SynchronizingBackground from "../../assets/loading/synchronizing-bg.jpg";


function SynchronizingModal() {
  return (
    <div className="loading-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={SynchronizingBackground} alt="sync-bg" />
      </div>
    </div>
  );
}

export default SynchronizingModal;