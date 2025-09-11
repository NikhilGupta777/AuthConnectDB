import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlassCard } from "@/components/ui/glass-card";
import { ToolCard } from "@/components/ui/tool-card";
import { Users, Clock, NotebookPen, Activity } from "lucide-react";

type DashboardStats = {
  totalMembers: number;
  pendingContent: number;
  emailsSent: number;
  activeProjects: number;
};

export default function Dashboard() {
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

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

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
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Members</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-members">
                      {statsLoading ? "..." : stats?.totalMembers || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-500/20 grid place-items-center">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Content</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-pending-content">
                      {statsLoading ? "..." : stats?.pendingContent || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-yellow-500/20 grid place-items-center">
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Emails Sent</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-emails-sent">
                      {statsLoading ? "..." : stats?.emailsSent || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-green-500/20 grid place-items-center">
                    <NotebookPen className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-active-projects">
                      {statsLoading ? "..." : stats?.activeProjects || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-purple-500/20 grid place-items-center">
                    <Activity className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ToolCard 
                    href="/email"
                    icon={<NotebookPen className="h-6 w-6" />}
                    title="Send Email"
                    className="p-4 text-center bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20"
                    data-testid="button-send-email"
                  />
                  <ToolCard 
                    href="/files"
                    icon={<Users className="h-6 w-6" />}
                    title="Upload File"
                    className="p-4 text-center bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20"
                    data-testid="button-upload-file"
                  />
                  <ToolCard 
                    href="/ask"
                    icon={<Activity className="h-6 w-6" />}
                    title="Ask AI"
                    className="p-4 text-center bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20"
                    data-testid="button-ask-ai"
                  />
                  <ToolCard 
                    href="/admin"
                    icon={<Clock className="h-6 w-6" />}
                    title="Admin"
                    className="p-4 text-center bg-red-500/10 hover:bg-red-500/20 border-red-500/20"
                    data-testid="button-admin"
                  />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No recent activity to display
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
