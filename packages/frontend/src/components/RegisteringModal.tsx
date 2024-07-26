import RegisteringBackground from "../assets/loading/registering-bg.png";


function RegisteringModal() {
  return (
    <div className="loading-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={RegisteringBackground} alt="registering-bg" />
      </div>
    </div>
  );
}

export default RegisteringModal;
