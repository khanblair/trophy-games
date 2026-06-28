import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Keep the matches table fresh from the FootyStats proxy so the apps can read
// from Convex (fast) instead of hitting the proxy directly (slow).
// Runs every 5 minutes — same interval the old GitHub Actions workflow used.
crons.interval(
    "sync-footystats-matches",
    { minutes: 5 },
    internal.footystats.syncMatches,
    {},
);

// Prune non-elite (noise) leagues and stale matches so the DB stays lean.
crons.interval(
    "cleanup-matches",
    { hours: 6 },
    internal.matches.cleanup,
    {},
);

// Automatically categorize and predict matches for today and tomorrow.
crons.interval(
    "auto-categorize-matches",
    { minutes: 10 },
    internal.analysis.autoAnalyzeAndCategorizeMatches,
    {},
);

export default crons;
