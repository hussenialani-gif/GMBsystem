import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ message: "User not logged in", code: "UNAUTHENTICATED" });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (!user) {
    throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
  }

  return user;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<"admin" | "manager" | "employee">
) {
  const user = await getCurrentUser(ctx);
  if (!allowedRoles.includes(user.role)) {
    throw new ConvexError({ message: "Insufficient permissions", code: "FORBIDDEN" });
  }
  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["admin"]);
}

export async function requireManagerOrAbove(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["admin", "manager"]);
}
