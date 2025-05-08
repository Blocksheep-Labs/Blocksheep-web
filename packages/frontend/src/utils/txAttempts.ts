export const txAttempts = (retries: number, fn: () => any, delay: number) => {
    let attemptsCount = 0;

    const processTX = async(remainingRetries: number, fn: () => any, delay: number) => {
        try {
            attemptsCount++;
            const data = await fn();
            console.log("TX done: ", data);
            return data;
        } catch (error) {
            console.log(`Attempt ${attemptsCount} failed with error: ${error}, retry in ${delay} ms...`);

            if (remainingRetries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return processTX(remainingRetries - 1, fn, delay);
            } else {
                throw new Error('All retries failed.');
            }
        }
    };

    return processTX(retries, fn, delay);
};
