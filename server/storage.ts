import {
  users,
  files,
  emailTemplates,
  emailCampaigns,
  chatMessages,
  type User,
  type UpsertUser,
  type File,
  type InsertFile,
  type EmailTemplate,
  type InsertEmailTemplate,
  type EmailCampaign,
  type InsertEmailCampaign,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  
  // File operations
  getFiles(userId?: string): Promise<File[]>;
  getFileById(id: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFileStatus(id: string, status: string, approvedBy?: string): Promise<File>;
  
  // Email template operations
  getEmailTemplates(): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  
  // Email campaign operations
  getEmailCampaigns(userId?: string): Promise<EmailCampaign[]>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaignStats(id: string, stats: { sentCount?: number; deliveredCount?: number; bouncedCount?: number; status?: string }): Promise<EmailCampaign>;
  
  // Chat operations
  getChatMessages(userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Analytics
  getDashboardStats(): Promise<{
    totalMembers: number;
    pendingContent: number;
    emailsSent: number;
    activeProjects: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // File operations
  async getFiles(userId?: string): Promise<File[]> {
    const query = db.select().from(files).orderBy(desc(files.createdAt));
    
    if (userId) {
      return await query.where(eq(files.uploadedBy, userId));
    }
    
    return await query;
  }

  async getFileById(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }

  async updateFileStatus(id: string, status: string, approvedBy?: string): Promise<File> {
    const updateData: any = { status };
    if (approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }
    
    const [updatedFile] = await db
      .update(files)
      .set(updateData)
      .where(eq(files.id, id))
      .returning();
    return updatedFile;
  }

  // Email template operations
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  // Email campaign operations
  async getEmailCampaigns(userId?: string): Promise<EmailCampaign[]> {
    const query = db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
    
    if (userId) {
      return await query.where(eq(emailCampaigns.createdBy, userId));
    }
    
    return await query;
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [newCampaign] = await db.insert(emailCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateEmailCampaignStats(id: string, stats: { sentCount?: number; deliveredCount?: number; bouncedCount?: number; status?: string }): Promise<EmailCampaign> {
    const [updatedCampaign] = await db
      .update(emailCampaigns)
      .set(stats)
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  // Chat operations
  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalMembers: number;
    pendingContent: number;
    emailsSent: number;
    activeProjects: number;
  }> {
    const [memberCount] = await db.select({ count: count() }).from(users);
    const [pendingFiles] = await db.select({ count: count() }).from(files).where(eq(files.status, 'pending'));
    const [emailStats] = await db.select({ 
      total: count(),
      sent: count(emailCampaigns.sentCount)
    }).from(emailCampaigns).where(eq(emailCampaigns.status, 'completed'));
    
    return {
      totalMembers: memberCount.count,
      pendingContent: pendingFiles.count,
      emailsSent: emailStats.sent || 0,
      activeProjects: 12, // This would be calculated based on active campaigns/projects
    };
  }
}

export const storage = new DatabaseStorage();
