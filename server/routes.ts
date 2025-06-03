import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertPodSchema, insertResponseSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { seedDatabase } from "./seed";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed database with demo data on startup
  await seedDatabase();

  // Session configuration
  const pgSession = connectPg(session);
  app.use(session({
    store: new pgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions',
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userToCreate = { ...userData, password: hashedPassword };

      const user = await storage.createUser(userToCreate);
      (req.session as any).user = { id: user.id, username: user.username };
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(loginData.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(loginData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      (req.session as any).user = { id: user.id, username: user.username };
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserWithPods((req.session as any).user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Pod routes
  app.get("/api/pods", requireAuth, async (req, res) => {
    try {
      const pods = await storage.getUserPods((req.session as any).user.id);
      res.json(pods);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/pods", requireAuth, async (req, res) => {
    try {
      const podData = insertPodSchema.parse({
        ...req.body,
        createdBy: (req.session as any).user.id,
      });
      
      const pod = await storage.createPod(podData);
      
      // Add creator as admin member
      await storage.addPodMember({
        podId: pod.id,
        userId: (req.session as any).user.id,
        isAdmin: true,
      });
      
      res.json(pod);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/pods/:podId/members", requireAuth, async (req, res) => {
    try {
      const podId = parseInt(req.params.podId);
      
      // Check if user is member of the pod
      const isMember = await storage.isPodMember(podId, (req.session as any).user.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this pod" });
      }
      
      const members = await storage.getPodMembers(podId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Prompt routes
  app.get("/api/prompts/current", requireAuth, async (req, res) => {
    try {
      const prompt = await storage.getCurrentPrompt();
      if (!prompt) {
        return res.status(404).json({ message: "No active prompt found" });
      }
      res.json(prompt);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/prompts/:promptId/stats/:podId", requireAuth, async (req, res) => {
    try {
      const promptId = parseInt(req.params.promptId);
      const podId = parseInt(req.params.podId);
      
      // Check if user is member of the pod
      const isMember = await storage.isPodMember(podId, (req.session as any).user.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this pod" });
      }
      
      const promptStats = await storage.getPromptWithStats(promptId, podId);
      if (!promptStats) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      res.json(promptStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Response routes
  app.post("/api/responses", requireAuth, async (req, res) => {
    try {
      const responseData = insertResponseSchema.parse({
        ...req.body,
        userId: (req.session as any).user.id,
      });
      
      // Check if user is member of the pod
      const isMember = await storage.isPodMember(responseData.podId, (req.session as any).user.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this pod" });
      }
      
      // Check if user already responded to this prompt in this pod
      const existingResponse = await storage.getUserResponseForPrompt(
        (req.session as any).user.id,
        responseData.promptId,
        responseData.podId
      );
      if (existingResponse) {
        return res.status(400).json({ message: "You have already responded to this prompt" });
      }
      
      const response = await storage.createResponse(responseData);
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/pods/:podId/responses", requireAuth, async (req, res) => {
    try {
      const podId = parseInt(req.params.podId);
      const promptId = req.query.promptId ? parseInt(req.query.promptId as string) : undefined;
      
      // Check if user is member of the pod
      const isMember = await storage.isPodMember(podId, (req.session as any).user.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this pod" });
      }
      
      const responses = await storage.getPodResponses(podId, promptId);
      
      // Add isLiked status for current user
      const responsesWithLikeStatus = await Promise.all(
        responses.map(async (response) => {
          const likes = await storage.getResponseLikes(response.id);
          const isLiked = likes.some(like => like.userId === (req.session as any).user.id);
          const comments = await storage.getResponseComments(response.id);
          
          return {
            ...response,
            isLiked,
            comments,
          };
        })
      );
      
      res.json(responsesWithLikeStatus);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Like routes
  app.post("/api/responses/:responseId/like", requireAuth, async (req, res) => {
    try {
      const responseId = parseInt(req.params.responseId);
      
      const response = await storage.getResponse(responseId);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }
      
      // Check if user is member of the pod
      const isMember = await storage.isPodMember(response.podId, (req.session as any).user.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this pod" });
      }
      
      const like = await storage.likeResponse(responseId, (req.session as any).user.id);
      res.json(like);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/responses/:responseId/like", requireAuth, async (req, res) => {
    try {
      const responseId = parseInt(req.params.responseId);
      
      const response = await storage.getResponse(responseId);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }
      
      // Check if user is member of the pod
      const isMember = await storage.isPodMember(response.podId, (req.session as any).user.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this pod" });
      }
      
      const success = await storage.unlikeResponse(responseId, (req.session as any).user.id);
      res.json({ success });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
