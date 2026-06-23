import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { isEliteLeague } from "./leagues";

// Shared validator for a match coming from the FootyStats proxy (used by the
// web overlay flows to upsert a proxy match into Convex before tagging it).
const proxyMatchInput = v.object({
    id: v.string(),
    league: v.string(),
    leagueId: v.optional(v.number()),
    leagueLogo: v.optional(v.string()),
    homeTeam: v.string(),
    homeTeamId: v.optional(v.number()),
    homeTeamLogo: v.optional(v.string()),
    awayTeam: v.string(),
    awayTeamId: v.optional(v.number()),
    awayTeamLogo: v.optional(v.string()),
    country: v.optional(v.string()),
    countryFlag: v.optional(v.string()),
    timestamp: v.string(),
    status: v.string(),
    score: v.optional(v.string()),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
    matchType: v.optional(v.union(v.literal('free'), v.literal('paid'), v.literal('vip'), v.literal('unassigned'))),
    isTrending: v.optional(v.boolean()),
    odds: v.optional(v.object({
        home: v.string(),
        away: v.string(),
        draw: v.optional(v.string()),
    })),
});

// Insert a proxy match into the matches table, returning the new doc.
async function insertProxyMatch(ctx: any, match: any) {
    const matchDate = match.timestamp ? match.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const _id = await ctx.db.insert("matches", {
        ...match,
        score: match.score || (match.homeScore != null && match.awayScore != null ? `${match.homeScore}-${match.awayScore}` : '0-0'),
        matchDate,
        isHistory: false,
        createdAt: now,
        updatedAt: now,
    });
    return await ctx.db.get(_id);
}

// ========== QUERIES ==========

export const getAll = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 100;
        return await ctx.db.query("matches").order("desc").take(limit);
    },
});

export const getAllLeagues = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("leagues").order("desc").take(100);
    },
});

export const get = query({
    args: {
        matchType: v.optional(v.union(v.literal('free'), v.literal('paid'), v.literal('vip'), v.literal('unassigned'))),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let q = ctx.db.query("matches").order("desc");

        if (args.matchType) {
            q = ctx.db.query("matches")
                .withIndex("by_match_type", (q) => q.eq("matchType", args.matchType))
                .order("desc");
        }

        const limit = args.limit || 100;
        return await q.take(limit);
    },
});

export const getById = query({
    args: {
        matchId: v.string(),
    },
    handler: async (ctx, args) => {
        // Primary lookup: external `id` field (indexed).
        const byExternalId = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();
        if (byExternalId) return byExternalId;

        // Fallback: treat matchId as a Convex document _id (e.g. from history screen).
        try {
            const byDocId = await ctx.db.get(args.matchId as any);
            return byDocId ?? null;
        } catch {
            return null;
        }
    },
});

export const getTrending = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("matches")
            .withIndex("by_trending", (q) => q.eq("isTrending", true))
            .order("desc")
            .take(50);
    },
});

export const getByDate = query({
    args: {
        date: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("matches")
            .filter((q) => q.eq(q.field("matchDate"), args.date))
            .order("desc")
            .take(100);
    },
});

// Get matches by matchType AND date — used by mobile list screens so they
// only fetch the matches for the selected day instead of all matches of a type.
export const getByTypeAndDate = query({
    args: {
        matchType: v.union(v.literal('free'), v.literal('paid'), v.literal('vip'), v.literal('unassigned')),
        date: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("matches")
            .withIndex("by_match_type", (q) => q.eq("matchType", args.matchType))
            .filter((q) => q.eq(q.field("matchDate"), args.date))
            .order("desc")
            .take(args.limit || 100);
    },
});

export const getHistory = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("matches")
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "Finished"),
                    q.eq(q.field("status"), "FT"),
                    q.eq(q.field("isHistory"), true),
                )
            )
            .order("desc")
            .take(args.limit || 100);
    },
});

export const getHistoryByDateRange = query({
    args: {
        startDate: v.string(),
        endDate: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("matches")
            .withIndex("by_match_date", (q) =>
                q.gte("matchDate", args.startDate).lte("matchDate", args.endDate)
            )
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "Finished"),
                    q.eq(q.field("status"), "FT"),
                    q.eq(q.field("isHistory"), true),
                )
            )
            .order("desc")
            .take(args.limit || 100);
    },
});

// ========== MUTATIONS ==========

// CREATE - Add a new match manually
export const create = mutation({
    args: {
        match: v.object({
            id: v.string(),
            league: v.string(),
            leagueId: v.optional(v.number()),
            leagueLogo: v.optional(v.string()),
            homeTeam: v.string(),
            homeTeamId: v.optional(v.number()),
            homeTeamLogo: v.optional(v.string()),
            awayTeam: v.string(),
            awayTeamId: v.optional(v.number()),
            awayTeamLogo: v.optional(v.string()),
            country: v.optional(v.string()),
            countryFlag: v.optional(v.string()),
            timestamp: v.string(),
            status: v.string(),
            score: v.optional(v.string()),
            homeScore: v.optional(v.number()),
            awayScore: v.optional(v.number()),
            matchType: v.optional(v.union(v.literal('free'), v.literal('paid'), v.literal('vip'), v.literal('unassigned'))),
            isTrending: v.optional(v.boolean()),
            odds: v.optional(v.object({
                home: v.string(),
                away: v.string(),
                draw: v.optional(v.string()),
            })),
        }),
    },
    handler: async (ctx, args) => {
        const matchDate = args.match.timestamp ? args.match.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        const newMatch = {
            ...args.match,
            score: args.match.score || '0-0',
            matchDate,
            isHistory: false,
            createdAt: now,
            updatedAt: now,
        };

        const matchId = await ctx.db.insert("matches", newMatch);

        // Send notification for new match
        if (args.match.matchType === 'free') {
            await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                title: "New Free Tip Added!",
                body: `Check out the new match: ${args.match.homeTeam} vs ${args.match.awayTeam}`,
            });
        } else if (args.match.matchType === 'vip') {
            await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                title: "🔥 New VIP Tip Available",
                body: "Exclusive VIP prediction just dropped! Unlock premium access to win big today.",
            });
        } else if (args.match.matchType === 'paid') {
            await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                title: "💰 New Paid Tip Available",
                body: "High-confidence paid prediction added! Get access now for expert insights.",
            });
        }

        return matchId;
    },
});

// UPDATE - Update match details
export const update = mutation({
    args: {
        matchId: v.string(),
        updates: v.object({
            league: v.optional(v.string()),
            leagueLogo: v.optional(v.string()),
            homeTeam: v.optional(v.string()),
            homeTeamLogo: v.optional(v.string()),
            awayTeam: v.optional(v.string()),
            awayTeamLogo: v.optional(v.string()),
            country: v.optional(v.string()),
            countryFlag: v.optional(v.string()),
            timestamp: v.optional(v.string()),
            status: v.optional(v.string()),
            score: v.optional(v.string()),
            homeScore: v.optional(v.number()),
            awayScore: v.optional(v.number()),
            matchType: v.optional(v.union(v.literal('free'), v.literal('paid'), v.literal('vip'), v.literal('unassigned'))),
            isTrending: v.optional(v.boolean()),
            odds: v.optional(v.object({
                home: v.string(),
                away: v.string(),
                draw: v.optional(v.string()),
            })),
        }),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (!existing) {
            throw new Error(`Match with id ${args.matchId} not found`);
        }

        const updates: any = {
            ...args.updates,
            updatedAt: new Date().toISOString(),
        };

        // Update matchDate if timestamp changed
        if (args.updates.timestamp) {
            updates.matchDate = args.updates.timestamp.split('T')[0];
        }

        await ctx.db.patch(existing._id, updates);
        return existing._id;
    },
});

// DELETE - Delete a match
export const deleteMatch = mutation({
    args: {
        matchId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (!existing) {
            throw new Error(`Match with id ${args.matchId} not found`);
        }

        await ctx.db.delete(existing._id);
        return { success: true };
    },
});

// Update match type only
export const updateMatchType = mutation({
    args: {
        matchId: v.string(),
        matchType: v.union(v.literal('free'), v.literal('paid'), v.literal('vip'), v.literal('unassigned')),
        // Optional proxy match payload — when the match isn't yet in Convex
        // (i.e. it came straight from the FootyStats API), upsert it first.
        match: v.optional(proxyMatchInput),
    },
    handler: async (ctx, args) => {
        let existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (!existing && args.match) {
            // Insert without the new type so the patch below still detects the
            // change and fires the corresponding "new tip" alert.
            existing = await insertProxyMatch(ctx, { ...args.match, matchType: 'unassigned' });
        }

        if (existing) {
            await ctx.db.patch(existing._id, { 
                matchType: args.matchType,
                updatedAt: new Date().toISOString(),
            });

            if (args.matchType !== existing.matchType) {
                if (args.matchType === 'free') {
                    await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                        title: "Free Tip Added!",
                        body: `A new high-confidence free tip has been added: ${existing.homeTeam} vs ${existing.awayTeam}. Check it out now!`,
                    });
                } else if (args.matchType === 'vip') {
                    await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                        title: "🔥 New VIP Prediction",
                        body: "Exclusive VIP tip now available! Upgrade to premium for expert predictions.",
                    });
                } else if (args.matchType === 'paid') {
                    await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                        title: "💰 New Paid Prediction",
                        body: "Premium paid tip just added! Unlock access for professional insights.",
                    });
                }
            }
        }
    },
});

// Update match result
export const updateMatchResult = mutation({
    args: {
        matchId: v.string(),
        result: v.union(v.literal('win'), v.literal('lose'), v.literal('draw')),
        isHistory: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                result: args.result,
                isHistory: args.isHistory ?? true,
                updatedAt: new Date().toISOString(),
            });
        }
    },
});

// Mark as history
export const markAsHistory = mutation({
    args: {
        matchId: v.string(),
        isHistory: v.boolean(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { 
                isHistory: args.isHistory,
                updatedAt: new Date().toISOString(),
            });
        }
    },
});

// Save AI prediction
export const saveAIPrediction = mutation({
    args: {
        matchId: v.string(),
        aiPrediction: v.object({
            prediction: v.string(),
            confidence: v.number(),
            reasoning: v.array(v.string()),
            suggestedBet: v.optional(v.string()),
        }),
        // Optional proxy match payload — upsert the match if it isn't in Convex.
        match: v.optional(proxyMatchInput),
    },
    handler: async (ctx, args) => {
        let existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (!existing && args.match) {
            existing = await insertProxyMatch(ctx, args.match);
        }

        if (existing) {
            await ctx.db.patch(existing._id, {
                aiPrediction: {
                    ...args.aiPrediction,
                    generatedAt: new Date().toISOString()
                },
                updatedAt: new Date().toISOString(),
            });
        }
    },
});

// Toggle trending status
export const toggleTrending = mutation({
    args: {
        matchId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { 
                isTrending: !existing.isTrending,
                updatedAt: new Date().toISOString(),
            });
        }
    },
});

// Enrich a match with rich data from FootyStats /match-stats endpoint.
// Called by the web API after fetching detailed stats so mobile can read
// them from Convex without hitting the FootyStats API directly.
export const enrichMatch = mutation({
    args: {
        matchId: v.string(),
        data: v.any(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (!existing) {
            throw new Error(`Match ${args.matchId} not found in Convex`);
        }

        const updates: any = {
            updatedAt: new Date().toISOString(),
        };

        // Only set fields that are actually provided (non-null / non-undefined)
        for (const [key, value] of Object.entries(args.data)) {
            if (value !== undefined && value !== null) {
                updates[key] = value;
            }
        }

        await ctx.db.patch(existing._id, updates);
        return { success: true };
    },
});

// Delete a league
export const deleteLeague = mutation({
    args: {
        leagueId: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("leagues")
            .withIndex("by_league_id", (q) => q.eq("id", args.leagueId))
            .unique();

        if (!existing) {
            throw new Error(`League with id ${args.leagueId} not found`);
        }

        await ctx.db.delete(existing._id);
        return { success: true };
    },
});

// Bulk save matches (for admin import)
export const saveAll = mutation({
    args: {
        matches: v.array(v.any()),
        leagues: v.optional(v.array(v.any())),
    },
    handler: async (ctx, args) => {
        const now = new Date().toISOString();

        for (const match of args.matches) {
            // Derive matchDate from timestamp if not set
            const matchDate = match.matchDate || (match.timestamp ? match.timestamp.split('T')[0] : now.split('T')[0]);
            const matchWithDate = {
                ...match,
                matchDate,
                createdAt: match.createdAt || now,
                updatedAt: now,
            };

            const existing = await ctx.db
                .query("matches")
                .withIndex("by_match_id", (q) => q.eq("id", match.id))
                .unique();

            if (existing) {
                // Preserve admin overlay fields (matchType, aiPrediction, result,
                // isHistory, isTrending) when syncing live data from the proxy.
                const updated = { ...existing, ...matchWithDate };
                if (existing.matchType && !matchWithDate.matchType) updated.matchType = existing.matchType;
                if (existing.aiPrediction && !matchWithDate.aiPrediction) updated.aiPrediction = existing.aiPrediction;
                if (existing.result && !matchWithDate.result) updated.result = existing.result;
                if (existing.isHistory && !matchWithDate.isHistory) updated.isHistory = existing.isHistory;
                if (existing.isTrending && !matchWithDate.isTrending) updated.isTrending = existing.isTrending;
                await ctx.db.patch(existing._id, updated);
            } else {
                await ctx.db.insert("matches", matchWithDate);
            }
        }

        if (args.leagues) {
            for (const league of args.leagues) {
                const existing = await ctx.db
                    .query("leagues")
                    .withIndex("by_league_id", (q) => q.eq("id", league.id))
                    .unique();

                if (existing) {
                    await ctx.db.patch(existing._id, league);
                } else {
                    await ctx.db.insert("leagues", league);
                }
            }
        }
    },
});

// Bulk upsert from the FootyStats sync job. Updates live fields (scores,
// status, odds, timestamp) while preserving the admin overlay set in the
// dashboard (matchType, aiPrediction, result, isHistory, isTrending).
// Uses v.any() so the cron sync can pass rich fields (detailedOdds, potentials,
// stats, etc.) without being blocked by the strict proxyMatchInput validator.
export const bulkUpsert = mutation({
    args: {
        matches: v.array(v.any()),
    },
    handler: async (ctx, args) => {
        const now = new Date().toISOString();

        let inserted = 0;
        let updated = 0;

        for (const m of args.matches) {
            const matchDate = m.timestamp ? m.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
            const score = m.score || (m.homeScore != null && m.awayScore != null ? `${m.homeScore}-${m.awayScore}` : '0-0');
            // Per-id index lookup (not a whole-table scan). `.first()` tolerates
            // any legacy duplicates; OCC ensures concurrent syncs don't double-insert.
            const existing = await ctx.db
                .query("matches")
                .withIndex("by_match_id", (q) => q.eq("id", m.id))
                .first();

            if (existing) {
                // Merge: update live data fields but preserve admin overlays.
                // We spread `m` first so new rich fields are included, then
                // explicitly preserve overlay fields that might be missing in `m`.
                const updates: any = {
                    ...m,
                    score,
                    matchDate,
                    updatedAt: now,
                };
                if (existing.matchType && !m.matchType) updates.matchType = existing.matchType;
                if (existing.aiPrediction && !m.aiPrediction) updates.aiPrediction = existing.aiPrediction;
                if (existing.result && !m.result) updates.result = existing.result;
                if (existing.isHistory && !m.isHistory) updates.isHistory = existing.isHistory;
                if (existing.isTrending && !m.isTrending) updates.isTrending = existing.isTrending;
                await ctx.db.patch(existing._id, updates);
                updated++;
            } else {
                await ctx.db.insert("matches", {
                    ...m,
                    score,
                    matchDate,
                    isHistory: false,
                    createdAt: now,
                    updatedAt: now,
                });
                inserted++;
            }
        }

        return { inserted, updated, total: args.matches.length };
    },
});

// One-off cleanup: remove duplicate match documents that share the same
// FootyStats `id`, keeping the doc that carries the admin overlay (AI
// prediction / result / tier), otherwise the oldest. Safe to run repeatedly.
export const dedupeMatches = internalMutation({
    args: {},
    handler: async (ctx) => {
        const all = await ctx.db.query("matches").collect();

        const groups = new Map<string, typeof all>();
        for (const m of all) {
            const arr = groups.get(m.id) ?? [];
            arr.push(m);
            groups.set(m.id, arr);
        }

        const overlayScore = (d: typeof all[number]) =>
            (d.aiPrediction ? 1 : 0) +
            (d.result ? 1 : 0) +
            (d.matchType && d.matchType !== 'unassigned' ? 1 : 0) +
            (d.isHistory ? 1 : 0);

        let deleted = 0;
        let dupGroups = 0;

        for (const docs of groups.values()) {
            if (docs.length <= 1) continue;
            dupGroups++;
            // Best keeper first: most overlay data, then oldest.
            docs.sort((a, b) => overlayScore(b) - overlayScore(a) || a._creationTime - b._creationTime);
            for (let i = 1; i < docs.length; i++) {
                await ctx.db.delete(docs[i]._id);
                deleted++;
            }
        }

        return { totalRows: all.length, distinctIds: groups.size, dupGroups, deleted };
    },
});

// One-off: clear the tip tier on matches that are already finished — you can't
// tip a played match, so any free/paid/vip tag on a finished match is a mistake.
export const untagFinishedMatches = internalMutation({
    args: {},
    handler: async (ctx) => {
        const all = await ctx.db.query("matches").collect();
        let cleared = 0;
        for (const m of all) {
            const finished = m.status === 'Finished' || m.status === 'FT' || m.status === 'complete';
            if (finished && m.matchType && m.matchType !== 'unassigned') {
                await ctx.db.patch(m._id, { matchType: 'unassigned', updatedAt: new Date().toISOString() });
                cleared++;
            }
        }
        return { cleared };
    },
});

// Keep only elite competitions and a rolling retention window. Deletes:
//  - any match whose league is NOT in the elite whitelist (noise), and
//  - elite matches older than RETENTION_DAYS that aren't flagged as history.
// Processed one page at a time (cursor-based) so each mutation stays bounded.
const RETENTION_DAYS = 45;

export const cleanupBatch = internalMutation({
    args: {
        cursor: v.union(v.string(), v.null()),
        batch: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const numItems = args.batch ?? 400;
        const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString().split('T')[0];

        const { page, isDone, continueCursor } = await ctx.db
            .query("matches")
            .order("asc")
            .paginate({ cursor: args.cursor, numItems });

        let deleted = 0;
        for (const m of page) {
            const noise = !isEliteLeague(m.league, m.country);
            const stale = !m.isHistory && (m.matchDate || '') !== '' && (m.matchDate as string) < cutoff;
            if (noise || stale) {
                await ctx.db.delete(m._id);
                deleted++;
            }
        }

        return { scanned: page.length, deleted, cursor: continueCursor, isDone };
    },
});

// Full sweep: loops cleanupBatch until the whole table has been processed.
// Runs on a cron and can be invoked manually via `convex run matches:cleanup`.
export const cleanup = internalAction({
    args: {},
    handler: async (ctx): Promise<{ scanned: number; deleted: number; pages: number }> => {
        let cursor: string | null = null;
        let scanned = 0;
        let deleted = 0;
        let pages = 0;

        // Safety bound to avoid an infinite loop.
        for (let i = 0; i < 1000; i++) {
            const r: { scanned: number; deleted: number; cursor: string | null; isDone: boolean } =
                await ctx.runMutation(internal.matches.cleanupBatch, { cursor, batch: 400 });
            scanned += r.scanned;
            deleted += r.deleted;
            pages++;
            cursor = r.cursor;
            if (r.isDone) break;
        }

        console.log(`[cleanup] pages ${pages}, scanned ${scanned}, deleted ${deleted}`);
        return { scanned, deleted, pages };
    },
});
