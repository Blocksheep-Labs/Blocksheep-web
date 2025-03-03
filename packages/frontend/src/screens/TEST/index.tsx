import { useState } from "react";

import RabbitHoleGame from "../RabbitHole/Game";

export default function TEST() {
    const [displayNumber, setDisplayNumber] = useState(0);
    return (
        <RabbitHoleGame/>
    );
    
}