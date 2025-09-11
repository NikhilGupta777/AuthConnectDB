import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ProfileModal } from "@/components/modals/profile-modal";
import { Bell } from "lucide-react";

export function Header() {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <>
      <header className="h-16 glass flex items-center justify-between px-6 border-b border-primary/20">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-wide shimmer">Narayani Sena</h2>
          <p className="text-xs md:text-sm text-primary/90">A Workspace for Mahaprabhuji Devotees</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 rounded-lg hover:bg-white/5 focus-ring"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
              3
            </span>
          </Button>

          {/* User Profile */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="focus-ring rounded-full bg-white/5 hover:bg-white/10 p-1"
              data-testid="button-user-profile"
            >
              <img 
                className="h-9 w-9 rounded-full object-cover border border-primary/30"
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"}
                alt={user?.firstName || "User"}
              />
            </Button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 glass rounded-lg border border-primary/20 shadow-xl z-50"
                onBlur={() => setProfileDropdownOpen(false)}
              >
                <div className="p-3 border-b border-primary/20">
                  <p className="text-sm font-medium text-foreground">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email || "User"
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  {user?.role && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary mt-1">
                      {user.role}
                    </span>
                  )}
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileModalOpen(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5"
                    data-testid="button-profile-settings-dropdown"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5"
                    data-testid="button-logout"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ProfileModal 
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </>
  );
}
