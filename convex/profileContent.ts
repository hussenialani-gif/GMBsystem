import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./helpers";

export const listNotes = query({
  args: { businessProfileId: v.id("businessProfiles") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const notes = await ctx.db
      .query("profileNotes")
      .withIndex("by_business_profile", (q) => q.eq("businessProfileId", args.businessProfileId))
      .order("desc")
      .collect();
    return await Promise.all(notes.map(async (note) => {
      const author = await ctx.db.get(note.authorId);
      return { ...note, author };
    }));
  },
});

export const createNote = mutation({
  args: {
    businessProfileId: v.id("businessProfiles"),
    content: v.string(),
    isPinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db.insert("profileNotes", {
      businessProfileId: args.businessProfileId,
      content: args.content,
      authorId: user._id,
      isPinned: args.isPinned ?? false,
    });
  },
});

export const updateNote = mutation({
  args: {
    id: v.id("profileNotes"),
    content: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const note = await ctx.db.get(args.id);
    if (!note) throw new ConvexError({ message: "Note not found", code: "NOT_FOUND" });
    if (note.authorId !== user._id && user.role !== "admin") {
      throw new ConvexError({ message: "Not authorized", code: "FORBIDDEN" });
    }
    const { id, ...fields } = args;
    await ctx.db.patch(id, Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)));
  },
});

export const deleteNote = mutation({
  args: { id: v.id("profileNotes") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const note = await ctx.db.get(args.id);
    if (!note) throw new ConvexError({ message: "Note not found", code: "NOT_FOUND" });
    if (note.authorId !== user._id && user.role !== "admin") {
      throw new ConvexError({ message: "Not authorized", code: "FORBIDDEN" });
    }
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveDocument = mutation({
  args: {
    businessProfileId: v.id("businessProfiles"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db.insert("documents", {
      ...args,
      uploadedBy: user._id,
    });
  },
});

export const listDocuments = query({
  args: { businessProfileId: v.id("businessProfiles") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_business_profile", (q) => q.eq("businessProfileId", args.businessProfileId))
      .order("desc")
      .collect();
    return await Promise.all(docs.map(async (doc) => {
      const url = await ctx.storage.getUrl(doc.storageId);
      const uploader = await ctx.db.get(doc.uploadedBy);
      return { ...doc, url, uploader };
    }));
  },
});

export const deleteDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new ConvexError({ message: "Document not found", code: "NOT_FOUND" });
    await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(args.id);
  },
});
