import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Shield, Eye, EyeOff } from "lucide-react";

const SecureAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // useAuth now provides `profile` object matching `blog.user_profiles`
  const { signIn, user, loading: authLoading, profile } = useAuth(); 
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in and is admin
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // If user is logged in, and profile is loaded, check if they are an admin
        if (profile && profile.is_admin) { // New: Check profile.is_admin for redirection
          console.log('User already logged in and is admin, redirecting to admin dashboard...');
          navigate("/admin");
        } else if (profile && !profile.is_admin) {
          // If logged in but not admin, redirect to regular login or show message
          console.log('User logged in but is not an admin, redirecting to regular login...');
          toast({
            title: "Access Denied",
            description: "You do not have administrative privileges.",
            variant: "destructive",
          });
          navigate("/login", { replace: true }); // Redirect to regular login
        }
        // If profile is still loading for user, wait (handled by ProtectedRoute logic implicitly)
      }
    }
  }, [user, authLoading, profile, navigate, toast]); // Added profile and toast to dependencies

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.email.trim() || !credentials.password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Starting login process for:', credentials.email);
      
      await signIn(credentials.email.trim(), credentials.password);
      
      // Navigation will happen via useEffect when user/profile state updates
      console.log('Login successful, user/profile state will update and trigger navigation');
      
    } catch (error: any) {
      console.error('Login failed:', error);
      // Error toast is already shown in signIn function
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || authLoading;

  // Show loading if we're in the middle of auth initialization
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <p className="text-gray-600">Sign in to Nonce Firewall Blogs admin panel</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your admin email"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="pr-10"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              <Lock className="h-4 w-4 mr-2" />
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-sm text-gray-600">
              Are you a team member?{" "}
              <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Team member login
              </a>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600 mb-2">
                Don't have an account?
              </p>
              <a href="/auth" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up as team member
              </a>
            </div>
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
              <p>Form Loading: {loading ? 'Yes' : 'No'}</p>
              <p>User: {user ? user.email : 'None'}</p>
              <p>Profile Admin: {profile?.is_admin ? 'Yes' : 'No'}</p> {/* New: Display profile admin status */}
              <p>Email: {credentials.email}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureAdmin;
