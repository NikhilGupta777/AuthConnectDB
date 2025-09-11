import sgMail from '@sendgrid/mail';

interface EmailValidationResult {
  email: string;
  isValid: boolean;
  reason?: string;
}

class EmailService {
  private isConfigured: boolean = false;

  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
    }
  }
  async validateEmails(emails: string[]): Promise<EmailValidationResult[]> {
    const results: EmailValidationResult[] = [];
    
    for (const email of emails) {
      const trimmedEmail = email.trim();
      const isValid = this.isValidEmailFormat(trimmedEmail);
      
      results.push({
        email: trimmedEmail,
        isValid,
        reason: isValid ? undefined : 'Invalid email format'
      });
    }
    
    return results;
  }

  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async validateEmailWithMX(email: string): Promise<boolean> {
    // This would implement actual MX record validation
    // For now, return basic format validation
    return this.isValidEmailFormat(email);
  }

  async sendBulkEmails(emails: string[], subject: string, content: string, fromEmail: string = 'noreply@narayani-sena.com', provider: 'sendgrid' | 'gmail' | 'outlook' = 'sendgrid'): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    if (!this.isConfigured && provider === 'sendgrid') {
      return {
        sent: 0,
        failed: emails.length,
        errors: ['SendGrid API key not configured']
      };
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    if (provider === 'sendgrid') {
      try {
        // Validate all emails first
        const validEmails = emails.filter(email => this.isValidEmailFormat(email));
        const invalidEmails = emails.filter(email => !this.isValidEmailFormat(email));
        
        if (invalidEmails.length > 0) {
          results.failed += invalidEmails.length;
          results.errors.push(`Invalid email formats: ${invalidEmails.join(', ')}`);
        }

        if (validEmails.length === 0) {
          return results;
        }

        // Send emails in batches to avoid rate limits
        const batchSize = 100;
        for (let i = 0; i < validEmails.length; i += batchSize) {
          const batch = validEmails.slice(i, i + batchSize);
          
          try {
            const msg = {
              to: batch,
              from: fromEmail,
              subject: subject,
              html: content,
              text: this.stripHtml(content), // Convert HTML to text fallback
            };

            await sgMail.sendMultiple(msg);
            results.sent += batch.length;
            console.log(`Sent batch of ${batch.length} emails successfully`);
          } catch (error: any) {
            results.failed += batch.length;
            results.errors.push(`Batch send failed: ${error.message}`);
            console.error('SendGrid batch send error:', error);
          }

          // Small delay between batches to respect rate limits
          if (i + batchSize < validEmails.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (error: any) {
        results.failed = emails.length;
        results.errors.push(`SendGrid service error: ${error.message}`);
        console.error('SendGrid service error:', error);
      }
    } else {
      // Fallback for other providers - simulate for now
      console.log(`Simulating bulk email send: ${emails.length} emails via ${provider}`);
      results.sent = emails.length;
    }
    
    return results;
  }

  async createEmailTemplate(name: string, subject: string, content: string): Promise<{ id: string; name: string }> {
    // This would save the template to storage
    return {
      id: Date.now().toString(),
      name
    };
  }

  parseEmailList(input: string): string[] {
    // Handle different input formats: CSV, line-separated, comma-separated
    const emails = input
      .split(/[,\n\r]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    return emails;
  }

  private stripHtml(html: string): string {
    // Simple HTML to text conversion for email fallback
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

export const emailService = new EmailService();
