import React, { useEffect } from "react";
import { adminCreateRace, getNextGameId, userHasAdminAccess } from "../../../utils/contract-functions";
import { useSmartAccount } from "../../../hooks/smartAccountProvider";
import { useNavigate } from "react-router-dom";
import { httpCreateRace } from "../../../utils/http-requests";
import { txAttempts } from "../../../utils/txAttempts";
import { TUnderdogQuestion, useAdminCreateRace } from "../../../hooks/basic/Admin/createRace";
import { useCheckAdminAccess } from "../../../hooks/basic/Admin/checkAdminAccess";


export default function AdminScreen() {
    const navigate = useNavigate();
    const { processTransaction } = useAdminCreateRace();
    const { hasAccess, loading } = useCheckAdminAccess();
    
    useEffect(() => {
        if (!loading && !hasAccess) {
            alert("You are not an admin!");
            navigate('/');
        }
    }, [loading, hasAccess]);


    const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Create a new FormData object from the form element
        const formData = new FormData(e.currentTarget);
        
        // Extract the form values
        const duration = Number(formData.get('duration'));
        const playersRequired = Number(formData.get('playersRequired'));
        
        /*
        const numbers: number[] = [];
        for (let i = 0; i < 3; i++) {
            // Generate a random number between 0 and 43 (inclusive)
            const randomNumber = Math.floor(Math.random() * 44);
            numbers.push(randomNumber);
        }
        */

        const storyKey = Math.floor(Math.random() * 4);
        const rID = await getNextGameId();

        // Log the values
        console.log({
            raceId: `race-${rID}`,
            duration,
            playersRequired,
            // numbers
        });

        const questions: TUnderdogQuestion[] = [
            {
                imgUrl: "https://gateway.pinata.cloud/ipfs/bafybeifalh7xa4vexupzelazm26pvx4id746justwbbefphfgjablxm4gq",
                content: "Is it better to have nice or smart kids?",
                answers: ["Smart", "Nice"]
            },
            {
                imgUrl: "https://gateway.pinata.cloud/ipfs/bafybeibzj5kt6iptaqn3nbf3ph4mnlvnwks7g5eyqllx3xlwpk7m7je4zy",
                content: "Would you rather explore the depths of the ocean or outer space?",
                answers: ["Ocean", "Space"]
            },
            {
                imgUrl: "https://gateway.pinata.cloud/ipfs/bafkreie3gcaeirx6mpmmptno4tryt4mmv7aotuudsbv562h54bon7vxfyq",
                content: "Would you rather read minds or being able to teleport?",
                answers: ["Read", "Teleport"]
            },
        ];


        txAttempts(
            3,
            async() => {
                /*
                return await adminCreateRace(
                    title, 
                    duration,
                    playersRequired, 
                    smartAccountClient,
                    numbers
                )
                */
                return await processTransaction(
                    duration,
                    playersRequired,
                    questions,
                    [[-1, -2, 3], [1, 0, 0], [-1, 1, 1]]
                );
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