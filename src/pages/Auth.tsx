import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, User, Eye, EyeOff, Tag, Shield, Star } from "lucide-react"; // Added Shield, Star
import { supabase } from "@/integrations/supabase/client";

const categories = [
  "Technology",
  "Crypto",
  "News", 
  "Business",
  "Health",
  "Sports",
  "Entertainment",
  "Science",
  "Politics",
  "Travel",
  "Lifestyle",
  "Religion"
];
const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "", // New: Added username field
    displayName: "",
    specializedCategory: "",
    // New: Fields for is_creator and is_admin, though usually set by admin or specific signup paths
    isCreator: false, 
    isAdmin: false 
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.username.trim()) { // New: Validate username
      toast({
        title: "Error",
        description: "Please enter a username.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!formData.specializedCategory) {
      toast({
        title: "Error",
        description: "Please select your specialized category.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Creating account with Supabase...');
      
      // Sign up with Supabase Auth
      // Pass username, display_name, specialized_category, is_creator, is_admin in metadata
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            username: formData.username.trim(), // New: Pass username in metadata
            display_name: formData.displayName.trim(),
            specialized_category: formData.specializedCategory,
            is_creator: formData.isCreator, // New: Pass is_creator in metadata
            is_admin: formData.isAdmin // New: Pass is_admin in metadata
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // The blog.user_profiles record is now automatically created by the handle_new_user trigger
        // so no explicit insert into 'profiles' table is needed here.
        // We only need to ensure the metadata passed to signUp is correct.

        toast({
          title: "Success",
          description: "Account created successfully! Please check your email to verify your account.",
        });
        
        // Reset form
        setFormData({
          email: "",
          password: "",
          username: "",
          displayName: "",
          specializedCategory: "",
          isCreator: false,
          isAdmin: false
        });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign up",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <p className="text-gray-600">Join our community</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Choose a unique username"
                  className="pl-10"
                  required
                  disabled={loading}
                  minLength={3}
                  maxLength={50}
                />
              </div>
              <p className="text-xs text-gray-500">
                Unique identifier, 3-50 characters.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Your public display name (optional)"
                  className="pl-10"
                  disabled={loading}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specializedCategory">Specialized Category *</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Select
                  value={formData.specializedCategory}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, specializedCategory: value }))}
                  disabled={loading}
                  required
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select your expertise category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500">
                Choose the category you'll be creating content for.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="pr-10"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
            </div>

            {/* New: Optional fields for Admin/Creator status for initial signup (use with caution) */}
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Optional Roles (for specific signups)</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isCreator"
                    checked={formData.isCreator}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCreator: checked }))}
                    disabled={loading || formData.isAdmin} // Cannot be creator if admin is true
                  />
                  <Label htmlFor="isCreator" className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Content Creator
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAdmin"
                    checked={formData.isAdmin}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAdmin: checked, isCreator: checked ? true : prev.isCreator }))} // If admin, also make creator
                    disabled={loading}
                  />
                  <Label htmlFor="isAdmin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    Super Admin
                  </Label>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Note: Admin/Creator roles are typically assigned by an existing admin. These options are for specific controlled sign-ups.
              </p>
            </div>


            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Already have an account?
            </p>
            <Button
              variant="link"
              onClick={() => navigate('/login')}
              className="text-sm font-medium"
              disabled={loading}
            >
              Sign in here
            </Button>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Are you a super admin?
              </p>
              <Button
                variant="link"
                onClick={() => navigate('/secure-admin')}
                className="text-sm font-medium"
                disabled={loading}
              >
                Super Admin Login
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
