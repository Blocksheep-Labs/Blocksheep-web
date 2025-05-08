import defaultScreenTimings from "@/config/default_screen_timings.json";

export default function getScreenTime(data: any, screenName: string): number {
    // @ts-ignore
    return data?.race?.screenTimings?.[screenName] || defaultScreenTimings?.[screenName]?.time
}
