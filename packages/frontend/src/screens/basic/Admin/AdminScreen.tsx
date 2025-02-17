import React, { useEffect } from "react";
import { adminCreateRace, getNextGameId, userHasAdminAccess } from "../../../utils/contract-functions";
import { useSmartAccount } from "../../../hooks/smartAccountProvider";
import { useNavigate } from "react-router-dom";
import { httpCreateRace } from "../../../utils/http-requests";
import { txAttempts } from "../../../utils/txAttempts";


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
        
        const numbers: number[] = [];
        for (let i = 0; i < 3; i++) {
            // Generate a random number between 0 and 43 (inclusive)
            const randomNumber = Math.floor(Math.random() * 44);
            numbers.push(randomNumber);
        }

        const storyKey = Math.floor(Math.random() * 4);
        const rID = await getNextGameId();

        // Log the values
        console.log({
            raceId: `race-${rID}`,
            title,
            duration,
            playersRequired,
            numbers
        });


        txAttempts(
            3,
            async() => {
                return await adminCreateRace(
                    title, 
                    duration,
                    playersRequired, 
                    smartAccountClient,
                    numbers
                )
            },
            3000
        )
        .catch(console.log)
        .then(async() => {
            await httpCreateRace(`race-${rID}`, storyKey);
        });
    }

    return (
        <div className="bg-white p-10" style={{ height: `${window.innerHeight}px` }}>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                <h2>Create Race</h2>
                <input type="text" placeholder="Title" name="title"></input>
                <input type="number" placeholder="Duration (1,2,3...)" name="duration"></input>
                <input type="number" placeholder="Players required" name="playersRequired"></input>
                
                {
                    /*
                        <p>UNDERDOG SETUP:</p>
                        <select name="question_1">
                            {
                                Array(44).fill(0).map((i, k) => {
                                    return <option key={k}>{k}</option>
                                })
                            }
                        </select>
                        <select name="question_2">
                            {
                                Array(44).fill(0).map((i, k) => {
                                    return <option key={k}>{k}</option>
                                })
                            }
                        </select>
                        <select name="question_3">
                            {
                                Array(44).fill(0).map((i, k) => {
                                    return <option key={k}>{k}</option>
                                })
                            }
                        </select>
                    */
                }
                <button type="submit" className="btn border-[2px] border-black">Create race</button>
            </form>
        </div>
    
    );
}