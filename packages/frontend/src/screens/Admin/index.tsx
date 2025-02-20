import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpCreateRace } from "@/utils/http-requests";
import { txAttempts } from "@/utils/txAttempts";
import { TUnderdogQuestion, useAdminCreateRace } from "@/hooks/useCreateRace";
import { useCheckAdminAccess } from "@/hooks/useCheckAdminAccess";
import ReordableList from "./components/reordable-list/reordable-list";
import possibleScreensArray from "@/config/possible-screens.json";
import possibleQuestions from "@/config/questions.json";
import { useNextGameId } from "@/hooks/useNextGameId";


export default function AdminScreen() {
    const navigate = useNavigate();
    const { processTransaction } = useAdminCreateRace();
    const { hasAccess, loading } = useCheckAdminAccess();
    const { rid, loading: rIdLoading } = useNextGameId();
    const [ screensOrder, setScreensOrder ] = useState<string[]>(possibleScreensArray);
    const [ toggledOffScreens, setToggledOffScreens ] = useState<string[]>(possibleScreensArray);
    
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
        
        // get 3 random questions
        const questions: TUnderdogQuestion[] = [];
        
        for (let i = 0; i < 3; i++) {
            // Generate a random number between 0 and 43 (inclusive)
            const randomNumber = Math.floor(Math.random() * 44);
            questions.push(possibleQuestions[randomNumber]);
        }

        const perksPoints = [[-1, -2, 3], [1, 0, 0], [-1, 1, 1]];

        const storyKey = Math.floor(Math.random() * 4);

        const screensToWriteIntoContract = screensOrder.filter(i => toggledOffScreens.includes(i));

        // Log the values
        console.log({
            raceId: `race-${rid}`,
            duration,
            playersRequired,
            questions,
            perksPoints,
            screensToWriteIntoContract,
        });


        txAttempts(
            3,
            async() => {
                return await processTransaction(
                    duration,
                    playersRequired,
                    storyKey,
                    questions,
                    perksPoints,
                    screensToWriteIntoContract,
                );
            },
            3000
        )
        .catch(console.log)
        .then(async() => {
            await httpCreateRace(`race-${rid}`);
        });
    }

    return (
        <div className="bg-white p-8 overflow-y-auto relative" style={{ height: `${window.innerHeight}px` }}>
            <button onClick={() => navigate('/select')} className="absolute top-2 right-2">{'<< Go back'}</button>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>

                <span className="text-3xl">New race</span>
                <hr/>

                <h2>Basic</h2>
                <input type="number" placeholder="Duration (1,2,3...)" name="duration"></input>
                <input type="number" placeholder="Players required" name="playersRequired"></input>
                <hr/>

                <h2>Screens order</h2>
                <div className="h-64 overflow-y-auto overflow-x-hidden">
                    <ReordableList 
                        items={screensOrder} 
                        setItems={setScreensOrder} 
                        toggledItems={toggledOffScreens}
                        setToggledItems={setToggledOffScreens}
                    />
                </div>
                <hr/>

                <h2>Stories</h2>
                <span className="text-yellow-600">Story key will be randomly selected</span>
                <hr/>

                <h2>Underdog setup</h2>
                <span className="text-yellow-600">3 questions will be randomly selected</span>
                <hr/>

                <h2>Rabbithole setup</h2>
                <span className="text-yellow-600">No additional setup is needed</span>
                <hr/>

                <h2>Bullrun setup</h2>
                <span className="text-yellow-600">[[-1, -2, 3], [1, 0, 0], [-1, 1, 1]]</span>
                <hr/>

                <button type="submit" className="btn border-[2px] border-black h-12 disabled:opacity-30" disabled={rIdLoading}>Create race</button>
            </form>
        </div>
    );
}