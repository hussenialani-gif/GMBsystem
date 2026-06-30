import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("employee")),
    avatar: v.optional(v.string()),
    isActive: v.boolean(),
    department: v.optional(v.string()),
    lastSeenAt: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  googleAccounts: defineTable({
    email: v.string(),
    accountName: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("pending"),
      v.literal("inactive")
    ),
    assignedUserId: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    profileCount: v.number(),
    lastActivityAt: v.optional(v.string()),
    createdBy: v.id("users"),
    tags: v.array(v.string()),
  })
    .index("by_assigned_user", ["assignedUserId"])
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  businessProfiles: defineTable({
    businessName: v.string(),
    googleAccountId: v.optional(v.id("googleAccounts")),
    assignedUserId: v.optional(v.id("users")),
    status: v.union(
      v.literal("new"),
      v.literal("pending_review"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("waiting_verification"),
      v.literal("verification_submitted"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("archived")
    ),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    category: v.optional(v.string()),
    placeId: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    notes: v.optional(v.string()),
    tags: v.array(v.string()),
    createdBy: v.id("users"),
    completedAt: v.optional(v.string()),
  })
    .index("by_assigned_user", ["assignedUserId"])
    .index("by_status", ["status"])
    .index("by_google_account", ["googleAccountId"])
    .index("by_priority", ["priority"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    businessProfileId: v.id("businessProfiles"),
    assignedUserId: v.optional(v.id("users")),
    createdBy: v.id("users"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    dueDate: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    isRecurring: v.boolean(),
    recurringInterval: v.optional(v.string()),
  })
    .index("by_business_profile", ["businessProfileId"])
    .index("by_assigned_user", ["assignedUserId"])
    .index("by_status", ["status"]),

  comments: defineTable({
    content: v.string(),
    authorId: v.id("users"),
    businessProfileId: v.optional(v.id("businessProfiles")),
    taskId: v.optional(v.id("tasks")),
    isInternal: v.boolean(),
  })
    .index("by_business_profile", ["businessProfileId"])
    .index("by_task", ["taskId"]),

  profileNotes: defineTable({
    businessProfileId: v.id("businessProfiles"),
    content: v.string(),
    authorId: v.id("users"),
    isPinned: v.boolean(),
  })
    .index("by_business_profile", ["businessProfileId"]),

  documents: defineTable({
    businessProfileId: v.id("businessProfiles"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
    label: v.optional(v.string()),
  })
    .index("by_business_profile", ["businessProfileId"]),

  activityLog: defineTable({
    entityType: v.union(
      v.literal("business_profile"),
      v.literal("google_account"),
      v.literal("task"),
      v.literal("user")
    ),
    entityId: v.string(),
    action: v.string(),
    description: v.string(),
    performedBy: v.id("users"),
    metadata: v.optional(v.string()),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_user", ["performedBy"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("assignment"),
      v.literal("status_change"),
      v.literal("comment"),
      v.literal("deadline"),
      v.literal("system")
    ),
    isRead: v.boolean(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),
});
