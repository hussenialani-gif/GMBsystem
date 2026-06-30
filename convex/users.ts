import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./helpers";

export const updateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: identity.name ?? existing.name,
        email: identity.email ?? existing.email,
        avatar: identity.profileUrl ?? existing.avatar,
        lastSeenAt: new Date().toISOString(),
      });
      return existing._id;
    }

    const userCount = await ctx.db.query("users").collect();
    const role = userCount.length === 0 ? "admin" : "employee";

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name,
      email: identity.email,
      avatar: identity.profileUrl,
      role,
      isActive: true,
      lastSeenAt: new Date().toISOString(),
    });
    return userId;
  },
});

export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!["admin", "manager"].includes(user.role)) {
      throw new ConvexError({ message: "Insufficient permissions", code: "FORBIDDEN" });
    }
    return await ctx.db.query("users").collect();
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (me.role !== "admin") {
      throw new ConvexError({ message: "Only admins can change roles", code: "FORBIDDEN" });
    }
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (me.role !== "admin") {
      throw new ConvexError({ message: "Only admins can change user status", code: "FORBIDDEN" });
    }
    await ctx.db.patch(args.userId, { isActive: args.isActive });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await ctx.db.patch(user._id, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.department !== undefined && { department: args.department }),
    });
  },
});
