import React, { useEffect } from "react";
import { adminCreateRace, userHasAdminAccess } from "../utils/contract-functions";
import { useSmartAccount } from "../hooks/smartAccountProvider";
import { useReadContract } from "wagmi";
import { useNavigate } from "react-router-dom";


export default function AdminScreen() {
    const {smartAccountClient} = useSmartAccount();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (smartAccountClient) {
            userHasAdminAccess(smartAccountClient).then(data => {
                console.log({
                    account: smartAccountClient.account.address,
                    isAdmin: data,
                });
                if (!data) {
                    alert("You are not an admin!");
                    navigate('/');
                }
            })
        }
    }, [smartAccountClient]);

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
                <input type="text" placeholder="Title" name="title"></input>
                <input type="number" placeholder="Duration (1,2,3...)" name="duration"></input>
                <input type="number" placeholder="Players required" name="playersRequired"></input>
                <button type="submit" className="btn border-[2px] border-black">Create race</button>
            </form>
        </div>
    
    );
}