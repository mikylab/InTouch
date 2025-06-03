import { 
  users, pods, podMembers, prompts, responses, responseLikes, responseComments,
  type User, type InsertUser, type Pod, type InsertPod, type PodMember, type InsertPodMember,
  type Prompt, type InsertPrompt, type Response, type InsertResponse,
  type ResponseLike, type InsertResponseLike, type ResponseComment, type InsertResponseComment,
  type UserWithPods, type ResponseWithDetails, type PromptWithStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserWithPods(userId: number): Promise<UserWithPods | undefined>;

  // Pod methods
  getPod(id: number): Promise<Pod | undefined>;
  createPod(pod: InsertPod): Promise<Pod>;
  getUserPods(userId: number): Promise<(Pod & { memberCount: number; isAdmin: boolean })[]>;
  addPodMember(podMember: InsertPodMember): Promise<PodMember>;
  removePodMember(podId: number, userId: number): Promise<boolean>;
  getPodMembers(podId: number): Promise<(PodMember & { user: User })[]>;
  isPodMember(podId: number, userId: number): Promise<boolean>;

  // Prompt methods
  getCurrentPrompt(): Promise<Prompt | undefined>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  getPromptWithStats(promptId: number, podId: number): Promise<PromptWithStats | undefined>;

  // Response methods
  createResponse(response: InsertResponse): Promise<Response>;
  getResponse(id: number): Promise<Response | undefined>;
  getUserResponseForPrompt(userId: number, promptId: number, podId: number): Promise<Response | undefined>;
  getPodResponses(podId: number, promptId?: number): Promise<ResponseWithDetails[]>;

  // Like methods
  likeResponse(responseId: number, userId: number): Promise<ResponseLike>;
  unlikeResponse(responseId: number, userId: number): Promise<boolean>;
  getResponseLikes(responseId: number): Promise<ResponseLike[]>;

  // Comment methods
  addComment(comment: InsertResponseComment): Promise<ResponseComment>;
  getResponseComments(responseId: number): Promise<(ResponseComment & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserWithPods(userId: number): Promise<UserWithPods | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const userPods = await this.getUserPods(userId);
    return { ...user, pods: userPods };
  }

  // Pod methods
  async getPod(id: number): Promise<Pod | undefined> {
    const [pod] = await db.select().from(pods).where(eq(pods.id, id));
    return pod || undefined;
  }

  async createPod(insertPod: InsertPod): Promise<Pod> {
    const [pod] = await db
      .insert(pods)
      .values(insertPod)
      .returning();
    return pod;
  }

  async getUserPods(userId: number): Promise<(Pod & { memberCount: number; isAdmin: boolean })[]> {
    const userMemberships = await db
      .select({
        pod: pods,
        member: podMembers
      })
      .from(podMembers)
      .innerJoin(pods, eq(podMembers.podId, pods.id))
      .where(eq(podMembers.userId, userId));

    const result = [];
    for (const membership of userMemberships) {
      const memberCountResult = await db
        .select()
        .from(podMembers)
        .where(eq(podMembers.podId, membership.pod.id));

      result.push({
        ...membership.pod,
        memberCount: memberCountResult.length,
        isAdmin: membership.member.isAdmin || false,
      });
    }

    return result;
  }

  async addPodMember(insertPodMember: InsertPodMember): Promise<PodMember> {
    const [podMember] = await db
      .insert(podMembers)
      .values(insertPodMember)
      .returning();
    return podMember;
  }

  async removePodMember(podId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(podMembers)
      .where(and(eq(podMembers.podId, podId), eq(podMembers.userId, userId)));
    return (result as any).rowCount > 0;
  }

  async getPodMembers(podId: number): Promise<(PodMember & { user: User })[]> {
    const members = await db
      .select({
        member: podMembers,
        user: users
      })
      .from(podMembers)
      .innerJoin(users, eq(podMembers.userId, users.id))
      .where(eq(podMembers.podId, podId));

    return members.map(member => ({
      ...member.member,
      user: member.user,
    }));
  }

  async isPodMember(podId: number, userId: number): Promise<boolean> {
    const [member] = await db
      .select()
      .from(podMembers)
      .where(and(eq(podMembers.podId, podId), eq(podMembers.userId, userId)));
    return !!member;
  }

  // Prompt methods
  async getCurrentPrompt(): Promise<Prompt | undefined> {
    const now = new Date();
    const [prompt] = await db
      .select()
      .from(prompts)
      .where(eq(prompts.isActive, true))
      .orderBy(desc(prompts.weekStart))
      .limit(1);
    return prompt || undefined;
  }

  async createPrompt(insertPrompt: InsertPrompt): Promise<Prompt> {
    const [prompt] = await db
      .insert(prompts)
      .values(insertPrompt)
      .returning();
    return prompt;
  }

  async getPromptWithStats(promptId: number, podId: number): Promise<PromptWithStats | undefined> {
    const prompt = await db.select().from(prompts).where(eq(prompts.id, promptId));
    if (!prompt[0]) return undefined;

    const responseCountResult = await db
      .select()
      .from(responses)
      .where(and(eq(responses.promptId, promptId), eq(responses.podId, podId)));

    const totalMembersResult = await db
      .select()
      .from(podMembers)
      .where(eq(podMembers.podId, podId));

    return {
      ...prompt[0],
      responseCount: responseCountResult.length,
      totalMembers: totalMembersResult.length,
    };
  }

  // Response methods
  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const [response] = await db
      .insert(responses)
      .values(insertResponse)
      .returning();
    return response;
  }

  async getResponse(id: number): Promise<Response | undefined> {
    const [response] = await db.select().from(responses).where(eq(responses.id, id));
    return response || undefined;
  }

  async getUserResponseForPrompt(userId: number, promptId: number, podId: number): Promise<Response | undefined> {
    const [response] = await db
      .select()
      .from(responses)
      .where(and(
        eq(responses.userId, userId),
        eq(responses.promptId, promptId),
        eq(responses.podId, podId)
      ));
    return response || undefined;
  }

  async getPodResponses(podId: number, promptId?: number): Promise<ResponseWithDetails[]> {
    const query = db
      .select({
        response: responses,
        user: users,
        pod: pods
      })
      .from(responses)
      .innerJoin(users, eq(responses.userId, users.id))
      .innerJoin(pods, eq(responses.podId, pods.id))
      .where(and(
        eq(responses.podId, podId),
        eq(responses.isVisible, true),
        promptId ? eq(responses.promptId, promptId) : undefined
      ))
      .orderBy(desc(responses.createdAt));

    const responseResults = await query;

    const responseDetails = [];
    for (const result of responseResults) {
      const likesResult = await db
        .select()
        .from(responseLikes)
        .where(eq(responseLikes.responseId, result.response.id));

      const commentsResult = await db
        .select({
          comment: responseComments,
          user: users
        })
        .from(responseComments)
        .innerJoin(users, eq(responseComments.userId, users.id))
        .where(eq(responseComments.responseId, result.response.id));

      responseDetails.push({
        ...result.response,
        user: result.user,
        pod: result.pod,
        likesCount: likesResult.length,
        commentsCount: commentsResult.length,
        isLiked: false, // Would need current user context
        comments: commentsResult.map(c => ({
          ...c.comment,
          user: c.user
        })),
      });
    }

    return responseDetails;
  }

  // Like methods
  async likeResponse(responseId: number, userId: number): Promise<ResponseLike> {
    const [like] = await db
      .insert(responseLikes)
      .values({ responseId, userId })
      .returning();
    return like;
  }

  async unlikeResponse(responseId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(responseLikes)
      .where(and(eq(responseLikes.responseId, responseId), eq(responseLikes.userId, userId)));
    return (result as any).rowCount > 0;
  }

  async getResponseLikes(responseId: number): Promise<ResponseLike[]> {
    return await db
      .select()
      .from(responseLikes)
      .where(eq(responseLikes.responseId, responseId));
  }

  // Comment methods
  async addComment(insertComment: InsertResponseComment): Promise<ResponseComment> {
    const [comment] = await db
      .insert(responseComments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getResponseComments(responseId: number): Promise<(ResponseComment & { user: User })[]> {
    const comments = await db
      .select({
        comment: responseComments,
        user: users
      })
      .from(responseComments)
      .innerJoin(users, eq(responseComments.userId, users.id))
      .where(eq(responseComments.responseId, responseId));

    return comments.map(c => ({
      ...c.comment,
      user: c.user,
    }));
  }
}

export const storage = new DatabaseStorage();
