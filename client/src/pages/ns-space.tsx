import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Mail, FileText, Upload, Rocket, History } from "lucide-react";

export default function NSSpace() {
  const [emailsToValidate, setEmailsToValidate] = useState("");
  const [campaignData, setCampaignData] = useState({
    name: "",
    subject: "",
    recipients: "all",
    schedule: "now"
  });
  
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: templates = [] } = useQuery({
    queryKey: ["/api/email/templates"],
    retry: false,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/email/campaigns"],
    retry: false,
  });

  const validateEmails = useMutation({
    mutationFn: async (emails: string[]) => {
      const response = await apiRequest("POST", "/api/email/validate", { emails });
      return response.json();
    },
    onSuccess: (data) => {
      const validCount = data.filter((result: any) => result.isValid).length;
      toast({
        title: "Validation Complete",
        description: `${validCount} out of ${data.length} emails are valid`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to validate emails",
        variant: "destructive",
      });
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/email/campaigns", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email campaign created successfully",
      });
      setCampaignData({ name: "", subject: "", recipients: "all", schedule: "now" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const handleValidateEmails = () => {
    if (!emailsToValidate.trim()) return;
    
    const emails = emailsToValidate
      .split(/[,\n\r]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    if (emails.length === 0) {
      toast({
        title: "Error",
        description: "Please enter valid email addresses",
        variant: "destructive",
      });
      return;
    }
    
    validateEmails.mutate(emails);
  };

  const handleCreateCampaign = () => {
    if (!campaignData.name || !campaignData.subject) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createCampaign.mutate({
      ...campaignData,
      content: "Campaign content here", // This would come from a rich text editor
      recipientCount: 1000, // This would be calculated based on recipient selection
    });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-foreground">Loading...</div>
    </div>;
  }

  return (
    <div className="h-screen w-full flex">
      <Sidebar />
      
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto custom-scrollbar bg-background/50">
          <div className="p-6 space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">NS Space - Email Management</h2>
              <p className="text-muted-foreground">Validate, send, and manage email communications</p>
            </div>

            {/* Email Tools Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email Validator */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
                  Email Validator
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Validate Email Addresses</label>
                    <Textarea
                      value={emailsToValidate}
                      onChange={(e) => setEmailsToValidate(e.target.value)}
                      placeholder="Enter email addresses (one per line, CSV, or bulk paste)..."
                      className="w-full h-32 bg-muted/30 border-input resize-none"
                      data-testid="textarea-emails-validate"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      data-testid="button-upload-csv"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV
                    </Button>
                    <Button 
                      onClick={handleValidateEmails}
                      disabled={validateEmails.isPending || !emailsToValidate.trim()}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid="button-validate-emails"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {validateEmails.isPending ? "Validating..." : "Validate"}
                    </Button>
                  </div>
                </div>
              </GlassCard>

              {/* Email Templates */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <FileText className="h-5 w-5 text-blue-400 mr-2" />
                  Email Templates
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                  {templates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No email templates available
                    </div>
                  ) : (
                    templates.map((template: any) => (
                      <div 
                        key={template.id}
                        className="p-3 rounded-lg bg-white/5 border border-border hover:border-primary/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">{template.subject}</p>
                          </div>
                          <Button size="sm" variant="ghost" data-testid={`button-download-template-${template.id}`}>
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button 
                  className="w-full mt-4 border-blue-500/40 text-blue-400 hover:bg-blue-500/10" 
                  variant="outline"
                  data-testid="button-create-template"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </GlassCard>
            </div>

            {/* Bulk Email Sending */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Mail className="h-5 w-5 text-purple-400 mr-2" />
                Bulk Email Campaign
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Campaign Name</label>
                    <Input
                      value={campaignData.name}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Monthly Newsletter - December 2024"
                      className="bg-muted/30 border-input"
                      data-testid="input-campaign-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Subject Line</label>
                    <Input
                      value={campaignData.subject}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject"
                      className="bg-muted/30 border-input"
                      data-testid="input-campaign-subject"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Email Integration</label>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-red-500/40 text-red-400 hover:bg-red-500/10"
                        data-testid="button-gmail-integration"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Gmail
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                        data-testid="button-outlook-integration"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Outlook
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Recipients</label>
                    <Select value={campaignData.recipients} onValueChange={(value) => setCampaignData(prev => ({ ...prev, recipients: value }))}>
                      <SelectTrigger className="bg-muted/30 border-input" data-testid="select-recipients">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Members (1,247)</SelectItem>
                        <SelectItem value="active">Active Members (892)</SelectItem>
                        <SelectItem value="admins">Admins Only (5)</SelectItem>
                        <SelectItem value="custom">Custom List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Send Schedule</label>
                    <Select value={campaignData.schedule} onValueChange={(value) => setCampaignData(prev => ({ ...prev, schedule: value }))}>
                      <SelectTrigger className="bg-muted/30 border-input" data-testid="select-schedule">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Send Now</SelectItem>
                        <SelectItem value="later">Schedule for Later</SelectItem>
                        <SelectItem value="draft">Send as Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreateCampaign}
                    disabled={createCampaign.isPending || !campaignData.name || !campaignData.subject}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    data-testid="button-launch-campaign"
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    {createCampaign.isPending ? "Creating..." : "Launch Campaign"}
                  </Button>
                </div>
              </div>
            </GlassCard>

            {/* Email History */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <History className="h-5 w-5 text-orange-400 mr-2" />
                Email History & Analytics
              </h3>
              <div className="overflow-x-auto">
                {campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No email campaigns found
                  </div>
                ) : (
                  <table className="w-full text-sm" data-testid="table-email-history">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-foreground">Campaign</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Recipients</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Sent</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Delivered</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Bounced</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      {campaigns.map((campaign: any) => (
                        <tr key={campaign.id} className="border-b border-border/50">
                          <td className="py-3 px-4">{campaign.name}</td>
                          <td className="py-3 px-4">{campaign.recipientCount}</td>
                          <td className="py-3 px-4">{campaign.sentCount}</td>
                          <td className="py-3 px-4">{campaign.deliveredCount}</td>
                          <td className="py-3 px-4">{campaign.bouncedCount}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              campaign.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              campaign.status === 'sending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {campaign.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </GlassCard>
          </div>
        </main>
      </div>
    </div>
  );
}
