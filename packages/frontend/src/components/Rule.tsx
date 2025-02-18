const Rule = ({text, showExample}: {text: string, showExample?: boolean}) => {
    return (
        <div className="bg-[#eec245] h-fit px-4 py-4 rounded-br-[40px] rounded-tl-[40px] border-black border-[2px] text-xl text-center">
            {text}
            {
                showExample &&
                <div className="flex flex-row justify-center items-end gap-3 w-full mb-3">
                    <div>
                        <span className="text-[16px]">NICE</span>
                        <div className="bg-[#7ba85a] w-14 h-8 text-sm text-white flex justify-center items-center border-black border-[1px]">40%</div>
                    </div>
                    <div>
                        <span className="text-[16px]">SMART</span>
                        <div className="bg-[#b1271c] w-14 h-14 text-sm text-white flex justify-center items-center border-black border-[1px]">60%</div>
                    </div>
                </div>
            }
        </div>
    );
}


export default Rule;