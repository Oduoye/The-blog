import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Mail, Eye, EyeOff, Shield } from "lucide-react";

const Login = () => {
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

  // Redirect if already logged in or if user is suspended
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // If profile is loaded and user is suspended, redirect to a different page or show message
        if (profile?.is_suspended) { // New: Check profile.is_suspended
          toast({
            title: "Account Suspended",
            description: "Your account is suspended. Please contact an administrator.",
            variant: "destructive",
          });
          // Do not navigate to /admin if suspended, perhaps to a generic suspended page or just stay here
          // For now, if suspended, remain on login page to see toast.
        } else {
          console.log('User already logged in and not suspended, redirecting to admin...');
          navigate("/admin");
        }
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
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-700 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-700 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <LogIn className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Team Member Login</CardTitle>
          <p className="text-gray-600">Sign in to your content creator dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
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
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <div className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/auth" className="text-green-600 hover:text-green-700 font-medium">
                Sign up here
              </Link>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600 mb-2">
                Are you a super admin?
              </p>
              <Link to="/secure-admin">
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Shield className="h-4 w-4" />
                  Super Admin Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
              <p>Form Loading: {loading ? 'Yes' : 'No'}</p>
              <p>User: {user ? user.email : 'None'}</p>
              <p>Profile Suspended: {profile?.is_suspended ? 'Yes' : 'No'}</p> {/* New: Display profile suspended status */}
              <p>Email: {credentials.email}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
