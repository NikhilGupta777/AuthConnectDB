import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  UserPlus, 
  Heart, 
  CheckSquare, 
  Users, 
  Check,
  X,
  FileText,
  Video,
  Edit,
  Shield,
  UserMinus,
  Ban
} from "lucide-react";

export default function AdminPanel() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ["/api/files"],
    retry: false,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const updateFileStatus = useMutation({
    mutationFn: async ({ fileId, status }: { fileId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/files/${fileId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "File status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
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
        description: "Failed to update file status",
        variant: "destructive",
      });
    },
  });

  const handleApproveFile = (fileId: string) => {
    updateFileStatus.mutate({ fileId, status: "approved" });
  };

  const handleRejectFile = (fileId: string) => {
    updateFileStatus.mutate({ fileId, status: "rejected" });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-blue-400" />;
    if (fileType.includes("video")) return <Video className="h-5 w-5 text-purple-400" />;
    return <FileText className="h-5 w-5 text-gray-400" />;
  };

  if (isLoading || user?.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-foreground">Loading...</div>
    </div>;
  }

  const pendingFiles = files.filter((file: any) => file.status === 'pending');

  return (
    <div className="h-screen w-full flex">
      <Sidebar />
      
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto custom-scrollbar bg-background/50">
          <div className="p-6 space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Admin Control Panel</h2>
              <p className="text-muted-foreground">Manage members, content approval, and system settings</p>
            </div>

            {/* Admin Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Approvals</p>
                    <p className="text-3xl font-bold text-yellow-400" data-testid="text-pending-approvals">
                      {statsLoading ? "..." : pendingFiles.length}
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-yellow-500/20 grid place-items-center">
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Members</p>
                    <p className="text-3xl font-bold text-green-400" data-testid="text-total-members-admin">
                      {statsLoading ? "..." : stats?.totalMembers || 0}
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-green-500/20 grid place-items-center">
                    <UserPlus className="h-8 w-8 text-green-400" />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">System Health</p>
                    <p className="text-3xl font-bold text-green-400" data-testid="text-system-health">99%</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-green-500/20 grid place-items-center">
                    <Heart className="h-8 w-8 text-green-400" />
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Content Approval Workflow */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <CheckSquare className="h-5 w-5 text-green-400 mr-2" />
                Content Approval Queue
              </h3>
              <div className="space-y-4" data-testid="approval-queue">
                {filesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : pendingFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending approvals
                  </div>
                ) : (
                  pendingFiles.map((file: any) => (
                    <div 
                      key={file.id}
                      className="p-4 rounded-lg bg-white/5 border border-border"
                      data-testid={`approval-item-${file.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted/30 grid place-items-center">
                            {getFileIcon(file.fileType)}
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{file.originalName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Uploaded by User • {file.fileType} • {new Date(file.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleApproveFile(file.id)}
                            disabled={updateFileStatus.isPending}
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/40"
                            data-testid={`button-approve-${file.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectFile(file.id)}
                            disabled={updateFileStatus.isPending}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/40"
                            data-testid={`button-reject-${file.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            {/* Member Management */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <Users className="h-5 w-5 text-blue-400 mr-2" />
                  Member Management
                </h3>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Search members..." 
                    className="bg-muted/30 border-input w-64"
                    data-testid="input-search-members"
                  />
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    data-testid="button-add-member"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-members">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-foreground">Member</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          Loading users...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user: any) => (
                        <tr key={user.id} className="border-b border-border/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={user.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"}
                                alt={user.firstName}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">
                            <Select 
                              value={user.role} 
                              onValueChange={(role) => updateUserRole.mutate({ userId: user.id, role })}
                              disabled={updateUserRole.isPending}
                            >
                              <SelectTrigger className="w-32 bg-muted/30 border-input">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-green-400 border-green-400/40">
                              Active
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                                data-testid={`button-edit-user-${user.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 border-red-500/40 text-red-400 hover:bg-red-500/10"
                                data-testid={`button-remove-user-${user.id}`}
                                disabled={false}
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        </main>
      </div>
    </div>
  );
}
