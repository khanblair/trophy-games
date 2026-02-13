# Convex AGENTS Guide

Guidelines for AI agents interacting with Convex backends.

## Best Practice Patterns
1. **Schema Design**: Always check `convex/schema.ts` before creating new queries or mutations.
2. **Indexing**: If a query is slow, verify that an appropriate index exists.
3. **Helper Functions**: Extract shared authorization or validation logic into helper functions within the `convex/` directory.

## Common Pitfalls
- **Actions in Loops**: Never call actions (which have side effects) inside a loop if it can be avoided.
- **Mutable State**: Remember that mutations are the only place you can modify data. Queries are read-only.

## Code Snippet Pattern
```typescript
// Example of a performant query with indexing
import { v } from "convex/values";
import { query } from "./_generated/server";

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
```
