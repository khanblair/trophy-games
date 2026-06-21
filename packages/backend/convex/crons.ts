import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Keep the matches table fresh from the FootyStats proxy so the apps can read
// from Convex (fast) instead of hitting the proxy directly (slow).
crons.interval(
    "sync-footystats-matches",
    { minutes: 15 },
    internal.footystats.syncMatches,
    {},
);

export default crons;
