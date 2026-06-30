import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./helpers";
import { paginationOptsValidator } from "convex/server";

export const listByEntity = query({
  args: {
    entityType: v.union(
      v.literal("business_profile"),
      v.literal("google_account"),
      v.literal("task"),
      v.literal("user")
    ),
    entityId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const logs = await ctx.db
      .query("activityLog")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const enriched = await Promise.all(
      logs.page.map(async (l) => {
        const performer = await ctx.db.get(l.performedBy);
        return { ...l, performer };
      })
    );
    return { ...logs, page: enriched };
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const logs = await ctx.db
      .query("activityLog")
      .order("desc")
      .take(args.limit ?? 20);

    return await Promise.all(
      logs.map(async (l) => {
        const performer = await ctx.db.get(l.performedBy);
        return { ...l, performer };
      })
    );
  },
});
