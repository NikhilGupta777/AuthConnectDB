import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { 
  PenTool, 
  Image, 
  Code, 
  Languages, 
  Mic, 
  TrendingUp 
} from "lucide-react";

const aiTools = [
  {
    id: "text-generation",
    title: "Text Generation",
    description: "Generate articles, emails, and spiritual content",
    icon: PenTool,
    color: "blue",
    testId: "button-text-generation"
  },
  {
    id: "image-creation", 
    title: "Image Creation",
    description: "Create spiritual art and promotional images",
    icon: Image,
    color: "purple",
    testId: "button-image-creation"
  },
  {
    id: "code-assistant",
    title: "Code Assistant", 
    description: "Help with website development and automation",
    icon: Code,
    color: "green",
    testId: "button-code-assistant"
  },
  {
    id: "translation",
    title: "Translation",
    description: "Translate content to multiple languages", 
    icon: Languages,
    color: "orange",
    testId: "button-translation"
  },
  {
    id: "voice-synthesis",
    title: "Voice Synthesis",
    description: "Generate audio for bhajans and teachings",
    icon: Mic,
    color: "pink", 
    testId: "button-voice-synthesis"
  },
  {
    id: "smart-analytics",
    title: "Smart Analytics",
    description: "AI-powered insights and reporting",
    icon: TrendingUp,
    color: "cyan",
    testId: "button-smart-analytics"
  }
];

const colorClasses = {
  blue: "bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30",
  purple: "bg-purple-500/20 border-purple-500/40 text-purple-400 hover:bg-purple-500/30", 
  green: "bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30",
  orange: "bg-orange-500/20 border-orange-500/40 text-orange-400 hover:bg-orange-500/30",
  pink: "bg-pink-500/20 border-pink-500/40 text-pink-400 hover:bg-pink-500/30",
  cyan: "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30"
};

const iconColorClasses = {
  blue: "text-blue-400",
  purple: "text-purple-400",
  green: "text-green-400", 
  orange: "text-orange-400",
  pink: "text-pink-400",
  cyan: "text-cyan-400"
};

export default function AITools() {
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

  const handleToolClick = (toolId: string) => {
    toast({
      title: "Coming Soon",
      description: `${toolId} tool will be available soon!`,
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
          <div className="p-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">AI in ONE</h2>
              <p className="text-muted-foreground">Consolidated AI tools and services for productivity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {aiTools.map((tool) => {
                const IconComponent = tool.icon;
                const colorClass = colorClasses[tool.color as keyof typeof colorClasses];
                const iconColorClass = iconColorClasses[tool.color as keyof typeof iconColorClasses];
                
                return (
                  <GlassCard key={tool.id} className="p-6">
                    <div className="text-center">
                      <div className={`h-16 w-16 rounded-2xl ${colorClass.split(' ')[0]} grid place-items-center mx-auto mb-4`}>
                        <IconComponent className={`h-8 w-8 ${iconColorClass} icon-pulse`} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{tool.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                      <Button 
                        onClick={() => handleToolClick(tool.title)}
                        className={`w-full ${colorClass} border transition-colors font-medium`}
                        variant="outline"
                        data-testid={tool.testId}
                      >
                        Launch Tool
                      </Button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
