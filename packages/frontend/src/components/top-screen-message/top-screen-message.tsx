export default function TopScreenMessage() {
    return (
        <div className="w-[90%] top-20 absolute left-[50%] z-50 bg-[#f3f8fc] h-28 rounded-2xl shadow-2xl p-2" style={{ transform: 'translate(-50%, -50%)' }}>
            <div className="bg-[#991212] w-full h-full rounded-xl flex items-center justify-center text-white">
                <span className="w-[70%] text-center font-bold font-[Berlin]">Not enough funds, pls top up yor balance within profile page.</span>
            </div>
        </div>
    );
}