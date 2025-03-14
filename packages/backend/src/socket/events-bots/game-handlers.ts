interface IUserMadeChoice {
    game: "UNDERDOG" | "RABBITHOLE" | "BULLRUN",
    raceId: number,
}


export default (socket: any, io: any) => {
    socket.on('user-made-choice', ({ game, raceId }: IUserMadeChoice) => {

        // TODO: based on the game bot participates in - listens to users choices (submissions)
        //  and participates in the race too
        switch (game) {
            case "BULLRUN":
                break;
            case "RABBITHOLE":
                break;
            case "UNDERDOG":
                break;
        }
    });
}