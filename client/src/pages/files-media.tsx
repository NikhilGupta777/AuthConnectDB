import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CloudUpload, 
  FileText, 
  Presentation, 
  Image as ImageIcon, 
  Video, 
  Download,
  MoreVertical,
  Clock,
  Grid,
  List
} from "lucide-react";

export default function FilesMedia() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ["/api/files"],
    retry: false,
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "File uploaded successfully",
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
        description: "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "Error",
          description: "File size must be less than 50MB",
          variant: "destructive",
        });
        return;
      }
      uploadFile.mutate(file);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="h-6 w-6 text-red-400" />;
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return <Presentation className="h-6 w-6 text-orange-400" />;
    if (fileType.includes("image")) return <ImageIcon className="h-6 w-6 text-green-400" />;
    if (fileType.includes("video")) return <Video className="h-6 w-6 text-purple-400" />;
    return <FileText className="h-6 w-6 text-gray-400" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400">Approved</Badge>;
      case "pending": 
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
              <h2 className="text-3xl font-bold text-foreground mb-2">Files & Media</h2>
              <p className="text-muted-foreground">Manage and share spiritual content with the community</p>
            </div>

            {/* Upload Section */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <CloudUpload className="h-5 w-5 text-blue-400 mr-2" />
                Upload Content
              </h3>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadFile.isPending}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                  data-testid="input-file-upload"
                />
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <CloudUpload className="h-12 w-12 text-primary/50 mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-2">
                    {uploadFile.isPending ? "Uploading..." : "Drag & drop files here, or click to browse"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">Support for PDFs, PPTs, images, videos up to 50MB</p>
                  <Button 
                    disabled={uploadFile.isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    data-testid="button-browse-files"
                  >
                    <CloudUpload className="h-4 w-4 mr-2" />
                    Browse Files
                  </Button>
                </div>
              </div>
            </GlassCard>

            {/* Content Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassCard className="p-4 text-center tool">
                <div className="glow"></div>
                <FileText className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="font-medium text-foreground">PDFs</p>
                <p className="text-sm text-muted-foreground" data-testid="text-pdf-count">
                  {files.filter((f: any) => f.fileType.includes("pdf")).length} files
                </p>
              </GlassCard>
              
              <GlassCard className="p-4 text-center tool">
                <div className="glow"></div>
                <Presentation className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <p className="font-medium text-foreground">Presentations</p>
                <p className="text-sm text-muted-foreground" data-testid="text-presentation-count">
                  {files.filter((f: any) => f.fileType.includes("presentation") || f.fileType.includes("powerpoint")).length} files
                </p>
              </GlassCard>
              
              <GlassCard className="p-4 text-center tool">
                <div className="glow"></div>
                <ImageIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="font-medium text-foreground">Images</p>
                <p className="text-sm text-muted-foreground" data-testid="text-image-count">
                  {files.filter((f: any) => f.fileType.includes("image")).length} files
                </p>
              </GlassCard>
              
              <GlassCard className="p-4 text-center tool">
                <div className="glow"></div>
                <Video className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <p className="font-medium text-foreground">Videos</p>
                <p className="text-sm text-muted-foreground" data-testid="text-video-count">
                  {files.filter((f: any) => f.fileType.includes("video")).length} files
                </p>
              </GlassCard>
            </div>

            {/* Recent Files */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <Clock className="h-5 w-5 text-yellow-400 mr-2" />
                  Recent Files
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    data-testid="button-grid-view"
                  >
                    <Grid className="h-4 w-4 mr-1" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    data-testid="button-list-view"
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                </div>
              </div>

              <div className="space-y-3" data-testid="files-list">
                {filesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading files...</div>
                ) : files.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No files uploaded yet</div>
                ) : (
                  files.map((file: any) => (
                    <div 
                      key={file.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      data-testid={`file-item-${file.id}`}
                    >
                      <div className="h-12 w-12 rounded-lg bg-muted/30 grid place-items-center flex-shrink-0">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{file.originalName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(file.status)}
                        <Button size="sm" variant="ghost" data-testid={`button-download-${file.id}`}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" data-testid={`button-menu-${file.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </main>
      </div>
    </div>
  );
}
