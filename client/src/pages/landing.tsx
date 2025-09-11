import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="mb-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 border border-primary/30 grid place-items-center mx-auto mb-4">
              <span className="text-primary text-xl font-bold">NS</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground shimmer mb-2">NARAYANI SENA</h1>
            <p className="text-muted-foreground">A Workspace for Mahaprabhuji Devotees</p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleLogin}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
              data-testid="button-login"
            >
              Sign In to Continue
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Secure authentication powered by Replit
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Narayani Sena. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
