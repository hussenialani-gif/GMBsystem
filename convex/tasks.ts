import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./helpers";
import { paginationOptsValidator } from "convex/server";

export const listByProfile = query({
  args: { businessProfileId: v.id("businessProfiles"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    return await ctx.db
      .query("tasks")
      .withIndex("by_business_profile", (q) => q.eq("businessProfileId", args.businessProfileId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const listAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    assignedUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    if (args.status) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) =>
          q.eq("status", args.status as "open" | "in_progress" | "completed" | "cancelled")
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }
    if (args.assignedUserId) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_assigned_user", (q) => q.eq("assignedUserId", args.assignedUserId))
        .order("desc")
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("tasks").order("desc").paginate(args.paginationOpts);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const all = await ctx.db.query("tasks").collect();
    return {
      total: all.length,
      open: all.filter((t) => t.status === "open").length,
      inProgress: all.filter((t) => t.status === "in_progress").length,
      completed: all.filter((t) => t.status === "completed").length,
      overdue: all.filter((t) => {
        if (!t.dueDate || t.status === "completed" || t.status === "cancelled") return false;
        return new Date(t.dueDate) < new Date();
      }).length,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    businessProfileId: v.id("businessProfiles"),
    assignedUserId: v.optional(v.id("users")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    dueDate: v.optional(v.string()),
    isRecurring: v.boolean(),
    recurringInterval: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const id = await ctx.db.insert("tasks", {
      ...args,
      status: "open",
      createdBy: user._id,
    });
    if (args.assignedUserId) {
      await ctx.db.insert("notifications", {
        userId: args.assignedUserId,
        title: "Task assigned",
        message: `New task "${args.title}" assigned to you`,
        type: "assignment",
        isRead: false,
        entityType: "task",
        entityId: id,
      });
    }
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    assignedUserId: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("open"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...fields } = args;
    const filtered = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (fields.status === "completed") {
      Object.assign(filtered, { completedAt: new Date().toISOString() });
    }
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await ctx.db.delete(args.id);
  },
});
