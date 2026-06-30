import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./helpers";
import { paginationOptsValidator } from "convex/server";

export const listByProfile = query({
  args: { businessProfileId: v.id("businessProfiles"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_business_profile", (q) => q.eq("businessProfileId", args.businessProfileId))
      .order("desc")
      .paginate(args.paginationOpts);

    const enriched = await Promise.all(
      comments.page.map(async (c) => {
        const author = await ctx.db.get(c.authorId);
        return { ...c, author };
      })
    );
    return { ...comments, page: enriched };
  },
});

export const create = mutation({
  args: {
    content: v.string(),
    businessProfileId: v.optional(v.id("businessProfiles")),
    taskId: v.optional(v.id("tasks")),
    isInternal: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db.insert("comments", {
      ...args,
      authorId: user._id,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const comment = await ctx.db.get(args.id);
    if (!comment) return;
    if (comment.authorId !== user._id && user.role !== "admin") return;
    await ctx.db.delete(args.id);
  },
});
