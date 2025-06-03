import { db } from "./db";
import { users, pods, podMembers, prompts } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Check if we already have users
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already seeded");
      return;
    }

    // Create demo users with hashed passwords
    const demoUsers = [
      {
        username: "demo",
        email: "demo@intouch.app", 
        password: await bcrypt.hash("demo123", 10),
        displayName: "Demo User"
      },
      {
        username: "sarah_chen",
        email: "sarah@example.com",
        password: await bcrypt.hash("password123", 10),
        displayName: "Sarah Chen"
      },
      {
        username: "marcus_j",
        email: "marcus@example.com", 
        password: await bcrypt.hash("password123", 10),
        displayName: "Marcus Johnson"
      },
      {
        username: "emma_r",
        email: "emma@example.com",
        password: await bcrypt.hash("password123", 10),
        displayName: "Emma Rodriguez"
      }
    ];

    const createdUsers = [];
    for (const userData of demoUsers) {
      const [user] = await db.insert(users).values(userData).returning();
      createdUsers.push(user);
    }

    // Create a demo pod
    const [demoPod] = await db.insert(pods).values({
      name: "College Friends",
      description: "Our awesome college friend group staying connected",
      createdBy: createdUsers[0].id
    }).returning();

    // Add all users to the pod
    for (let i = 0; i < createdUsers.length; i++) {
      await db.insert(podMembers).values({
        podId: demoPod.id,
        userId: createdUsers[i].id,
        isAdmin: i === 0 // First user is admin
      });
    }

    // Create current week's prompt
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of current week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of current week

    await db.insert(prompts).values({
      title: "What's your high and low this week?",
      description: "Share a moment that made you smile and something that challenged you.",
      type: "high-low",
      isActive: true,
      weekStart,
      weekEnd
    });

    console.log("Database seeded successfully!");
    console.log("Demo user credentials:");
    console.log("Username: demo");
    console.log("Password: demo123");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}