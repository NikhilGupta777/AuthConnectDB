import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { openaiService } from "./services/openaiService";
import { emailService } from "./services/emailService";
import { 
  insertFileSchema, 
  insertEmailTemplateSchema, 
  insertEmailCampaignSchema, 
  insertChatMessageSchema,
  fileStatusUpdateSchema,
  userRoleUpdateSchema,
  emailValidationSchema,
  bulkEmailSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";

// Configure multer for file uploads with security restrictions
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Whitelist of allowed MIME types
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
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
      
      // Validate status with Zod
      const validationResult = fileStatusUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid status", 
          errors: validationResult.error.errors 
        });
      }
      
      const { status } = validationResult.data;
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
      // Validate emails with Zod
      const validationResult = emailValidationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid email format", 
          errors: validationResult.error.errors 
        });
      }

      const { emails } = validationResult.data;
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

      // Validate email data with Zod
      const emailValidationResult = bulkEmailSchema.safeParse(req.body);
      if (!emailValidationResult.success) {
        return res.status(400).json({ 
          message: "Invalid email data", 
          errors: emailValidationResult.error.errors 
        });
      }

      const { campaignId } = req.body;
      const { emails, subject, content, fromEmail } = emailValidationResult.data;
      
      if (!campaignId) {
        return res.status(400).json({ message: "Campaign ID is required" });
      }

      // Update campaign status to sending
      await storage.updateEmailCampaignStats(campaignId, { status: 'sending' });
      
      try {
        // Send emails using SendGrid
        const results = await emailService.sendBulkEmails(emails, subject, content, fromEmail);
        
        // Update campaign with results
        await storage.updateEmailCampaignStats(campaignId, {
          status: results.failed === 0 ? 'completed' : 'partially_completed',
          sentCount: results.sent,
          // Note: We'd need to add these fields to the schema for full tracking
        });

        res.json({
          message: "Campaign completed",
          results: {
            sent: results.sent,
            failed: results.failed,
            errors: results.errors
          }
        });
      } catch (error: any) {
        // Update campaign status to failed
        await storage.updateEmailCampaignStats(campaignId, { status: 'failed' });
        
        console.error("Email sending error:", error);
        res.status(500).json({ 
          message: "Failed to send emails", 
          error: error.message 
        });
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });

  // Add bulk email sending endpoint for direct sending (not campaign-based)
  app.post('/api/email/send-bulk', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Validate bulk email data with Zod
      const validationResult = bulkEmailSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid email data", 
          errors: validationResult.error.errors 
        });
      }

      const { emails, subject, content, fromEmail } = validationResult.data;
      const results = await emailService.sendBulkEmails(emails, subject, content, fromEmail);
      
      res.json({
        message: "Bulk email sending completed",
        results: {
          sent: results.sent,
          failed: results.failed,
          errors: results.errors
        }
      });
    } catch (error: any) {
      console.error("Bulk email sending error:", error);
      res.status(500).json({ 
        message: "Failed to send bulk emails", 
        error: error.message 
      });
    }
  });

  // User management routes (admin only)
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:userId/role', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      
      // Validate role with Zod
      const validationResult = userRoleUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid role", 
          errors: validationResult.error.errors 
        });
      }
      
      const { role } = validationResult.data;
      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
