import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pods = pgTable("pods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
  isActive: boolean("is_active").default(true),
});

export const podMembers = pgTable("pod_members", {
  id: serial("id").primaryKey(),
  podId: integer("pod_id").notNull(),
  userId: integer("user_id").notNull(),
  isAdmin: boolean("is_admin").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'high-low', 'photo', 'question', etc.
  isActive: boolean("is_active").default(true),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  promptId: integer("prompt_id").notNull(),
  podId: integer("pod_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(), // JSON string for flexible content
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  isVisible: boolean("is_visible").default(true),
});

export const responseLikes = pgTable("response_likes", {
  id: serial("id").primaryKey(),
  responseId: integer("response_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const responseComments = pgTable("response_comments", {
  id: serial("id").primaryKey(),
  responseId: integer("response_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isActive: true,
});

export const insertPodSchema = createInsertSchema(pods).omit({
  id: true,
  isActive: true,
});

export const insertPodMemberSchema = createInsertSchema(podMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertPromptSchema = createInsertSchema(prompts).omit({
  id: true,
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  createdAt: true,
});

export const insertResponseLikeSchema = createInsertSchema(responseLikes).omit({
  id: true,
  createdAt: true,
});

export const insertResponseCommentSchema = createInsertSchema(responseComments).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;

export type Pod = typeof pods.$inferSelect;
export type InsertPod = z.infer<typeof insertPodSchema>;

export type PodMember = typeof podMembers.$inferSelect;
export type InsertPodMember = z.infer<typeof insertPodMemberSchema>;

export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;

export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;

export type ResponseLike = typeof responseLikes.$inferSelect;
export type InsertResponseLike = z.infer<typeof insertResponseLikeSchema>;

export type ResponseComment = typeof responseComments.$inferSelect;
export type InsertResponseComment = z.infer<typeof insertResponseCommentSchema>;

// Extended types for API responses
export type UserWithPods = User & {
  pods: (Pod & { memberCount: number; isAdmin: boolean })[];
};

export type ResponseWithDetails = Response & {
  user: User;
  pod: Pod;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  comments: (ResponseComment & { user: User })[];
};

export type PromptWithStats = Prompt & {
  responseCount: number;
  totalMembers: number;
};
