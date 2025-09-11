import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ProfileModal } from "@/components/modals/profile-modal";
import { 
  LayoutDashboard, 
  MessageCircleQuestion, 
  Mail, 
  Bot, 
  FolderOpen, 
  Settings, 
  User,
  Menu,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      href: "/",
      icon: LayoutDashboard,
      label: "Dashboard",
      color: "text-indigo-300"
    },
    {
      href: "/ask",
      icon: MessageCircleQuestion,
      label: "Ask Anything",
      color: "text-sky-300"
    },
    {
      href: "/email",
      icon: Mail,
      label: "NS Space",
      color: "text-emerald-300"
    },
    {
      href: "/ai",
      icon: Bot,
      label: "AI in ONE",
      color: "text-purple-300"
    },
    {
      href: "/files",
      icon: FolderOpen,
      label: "Files & Media",
      color: "text-orange-300"
    }
  ];

  // Add admin panel for admin users
  if (user?.role === 'admin') {
    navigationItems.push({
      href: "/admin",
      icon: Settings,
      label: "Admin Panel",
      color: "text-red-300"
    });
  }

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      <aside 
        className={`z-30 glass h-full flex-shrink-0 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
        data-testid="sidebar"
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/30 grid place-items-center">
              <span className="text-primary font-bold">NS</span>
            </div>
            <h1 
              className={`text-lg font-extrabold tracking-wide shimmer transition-opacity ${
                sidebarOpen ? 'opacity-100' : 'opacity-0'
              }`}
            >
              NARAYANI SENA
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/5 focus-ring"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            data-testid="button-toggle-sidebar"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 focus-ring ${
                  sidebarOpen ? 'justify-start' : 'justify-center'
                } ${
                  active 
                    ? 'bg-primary/15 border border-primary/30 text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground hover:border-primary/20 border border-transparent'
                }`}
                data-testid={`nav-link-${item.href.replace('/', '') || 'dashboard'}`}
              >
                <div className="h-9 w-9 grid place-items-center rounded-md bg-white/5 border border-white/10 group-hover:border-primary/40">
                  <IconComponent className={`h-5 w-5 ${active ? 'text-primary' : item.color}`} />
                </div>
                <span 
                  className={`text-sm font-medium transition-opacity ${
                    sidebarOpen ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="border-t border-border my-2"></div>

          {/* Profile Settings */}
          <Button
            variant="ghost"
            onClick={() => setProfileModalOpen(true)}
            className={`group flex items-center gap-3 p-3 rounded-lg transition-colors focus-ring text-muted-foreground hover:bg-primary/10 hover:text-foreground w-full ${
              sidebarOpen ? 'justify-start' : 'justify-center'
            }`}
            data-testid="button-profile-settings"
          >
            <div className="h-9 w-9 grid place-items-center rounded-md bg-white/5 border border-white/10 group-hover:border-primary/40">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <span 
              className={`text-sm font-medium transition-opacity ${
                sidebarOpen ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Profile
            </span>
          </Button>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-primary/20">
          <div 
            className={`text-[11px] text-muted-foreground ${
              sidebarOpen ? 'block' : 'hidden'
            }`}
          >
            © {new Date().getFullYear()} Narayani Sena
          </div>
        </div>
      </aside>

      <ProfileModal 
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </>
  );
}
