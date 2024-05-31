const CTASection = () => (
  <div className="w-full flex justify-center items-center gap-[10px] mt-[10px]">
    <button
      type="button"
      className="shadow-md bg-white_3 text-white_4 border-white_border bg-green 
        p-[4px_15px] rounded-[5px]
        transition duration-[300ms] hover:scale-[1.1]"
    >
      Start
    </button>
    <button
      type="button"
      className="shadow-md bg-green
       p-[4px_15px] rounded-[5px] text-white
       transition duration-[300ms] hover:scale-[1.05]"
    >
      Set Speed
    </button>
  </div>
)

export default CTASection
