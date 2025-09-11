import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { openaiService } from "./services/openaiService";
import { emailService } from "./services/emailService";
import { insertFileSchema, insertEmailTemplateSchema, insertEmailCampaignSchema, insertChatMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // If user doesn't exist in DB yet, create them from claims
      if (!user) {
        const claims = req.user.claims;
        user = await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name,
          lastName: claims.last_name,
          profileImageUrl: claims.profile_image_url,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Chat/Ask Anything routes
  app.get('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/chat/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get AI response
      const aiResponse = await openaiService.getChatResponse(message);
      
      // Save chat message with response
      const chatMessage = await storage.createChatMessage({
        userId,
        message,
        response: aiResponse,
      });

      res.json(chatMessage);
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // File management routes
  app.get('/api/files', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const files = user?.role === 'admin' 
        ? await storage.getFiles()
        : await storage.getFiles(req.user.claims.sub);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post('/api/files/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploadedFile = req.file;

      if (!uploadedFile) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileData = {
        fileName: uploadedFile.filename,
        originalName: uploadedFile.originalname,
        fileType: uploadedFile.mimetype,
        fileSize: uploadedFile.size,
        uploadedBy: userId,
        status: 'pending',
      };

      const file = await storage.createFile(fileData);
      res.json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.patch('/api/files/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { status } = req.body;
      
      const updatedFile = await storage.updateFileStatus(id, status, req.user.claims.sub);
      res.json(updatedFile);
    } catch (error) {
      console.error("Error updating file status:", error);
      res.status(500).json({ message: "Failed to update file status" });
    }
  });

  // Email template routes
  app.get('/api/email/templates', isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.post('/api/email/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateData = insertEmailTemplateSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      const template = await storage.createEmailTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  // Email campaign routes
  app.get('/api/email/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const campaigns = user?.role === 'admin' 
        ? await storage.getEmailCampaigns()
        : await storage.getEmailCampaigns(req.user.claims.sub);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching email campaigns:", error);
      res.status(500).json({ message: "Failed to fetch email campaigns" });
    }
  });

  app.post('/api/email/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignData = insertEmailCampaignSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      const campaign = await storage.createEmailCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating email campaign:", error);
      res.status(500).json({ message: "Failed to create email campaign" });
    }
  });

  app.post('/api/email/validate', isAuthenticated, async (req, res) => {
    try {
      const { emails } = req.body;
      
      if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ message: "Valid email array is required" });
      }

      const validationResults = await emailService.validateEmails(emails);
      res.json(validationResults);
    } catch (error) {
      console.error("Error validating emails:", error);
      res.status(500).json({ message: "Failed to validate emails" });
    }
  });

  app.post('/api/email/send-campaign', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { campaignId } = req.body;
      
      // This would integrate with email service for actual sending
      // For now, we'll update the campaign status
      await storage.updateEmailCampaignStats(campaignId, { status: 'sending' });
      
      res.json({ message: "Campaign sending initiated" });
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });

  // User management routes (admin only)
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // This would be implemented with proper user listing
      res.json({ message: "User management endpoint" });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
