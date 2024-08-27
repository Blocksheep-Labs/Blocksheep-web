import React from "react";
import { adminCreateRace } from "../utils/contract-functions";
import { useSmartAccount } from "../hooks/smartAccountProvider";


export default function AdminScreen() {
    const {smartAccountClient} = useSmartAccount();

    const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Create a new FormData object from the form element
        const formData = new FormData(e.currentTarget);
        
        // Extract the form values
        const title = formData.get('title') as string;
        const duration = Number(formData.get('duration'));
        const playersRequired = Number(formData.get('playersRequired'));

        // Log the values
        console.log({
            title,
            duration,
            playersRequired,
        });

        await adminCreateRace(title, duration, playersRequired, smartAccountClient).then(_ => {
            alert("OK");
        });
    }

    return (
        <div className="bg-white p-10">
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                <h2>Create Race</h2>
                <input type="text" placeholder="Title"></input>
                <input type="number" placeholder="Duration (1,2,3...)"></input>
                <input type="number" placeholder="Players required"></input>
                <button type="submit" className="btn border-[2px] border-black">Create race</button>
            </form>
        </div>
    
    );
}