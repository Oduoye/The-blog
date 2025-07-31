import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Updated Profile type to match the new 'blog.user_profiles' table
type Profile = Database['blog']['Tables']['user_profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // New: Simplified profile fetching to align with 'blog.user_profiles' table and 'user_id'
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('blog.user_profiles') // Updated table name and schema
        .select('*')
        .eq('user_id', userId) // Updated column name
        .single();

      if (error) {
        // If profile not found, it might be a new user where handle_new_user hasn't run yet,
        // or a manual user where profile wasn't created.
        if (error.code === 'PGRST116') { // No rows returned
          console.warn('No profile found for user, attempting to create default profile:', userId);
          return await createDefaultProfile(userId); // Attempt to create a default profile
        }
        console.error('Error fetching profile:', error);
        throw error;
      }

      console.log('Profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  // New: Create default profile for new user if handle_new_user didn't set all metadata
  const createDefaultProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('Creating default profile for user (fallback):', userId);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        throw new Error('No authenticated user found for profile creation.');
      }

      const defaultUsername = authUser.email ? authUser.email.split('@')[0] : 'user';
      
      const { data, error } = await supabase
        .from('blog.user_profiles') // Updated table name and schema
        .insert({
          user_id: userId, // Updated column name
          email: authUser.email || '',
          username: defaultUsername, // New: Set a default username
          display_name: authUser.user_metadata?.display_name || defaultUsername,
          is_admin: false,
          is_creator: false,
          is_suspended: false
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation if profile already exists (e.g., from handle_new_user trigger)
        if (error.code === '23505') { 
          console.warn('Default profile creation skipped: profile already exists (likely from trigger). Fetching existing profile.');
          return await fetchProfile(userId); // Fetch the existing one if conflict
        }
        console.error('Error creating default profile:', error);
        return null;
      }

      console.log('Default profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating default profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user && mounted) {
          console.log('Session found for user:', session.user.email);
          setUser(session.user);
          
          fetchProfile(session.user.id).then(userProfile => {
            if (mounted) {
              setProfile(userProfile);
            }
          });
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id).then(userProfile => {
            if (mounted) {
              setProfile(userProfile);
            }
          });
        } else {
          setUser(null);
          setProfile(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log('Sign in successful for user:', data.user.email);
        setUser(data.user);
        
        fetchProfile(data.user.id).then(userProfile => {
          setProfile(userProfile);
          
          // Check if user is suspended
          if (userProfile?.is_suspended) {
            console.log('User account is suspended');
            toast({
              title: "Account Suspended",
              description: "Your account has been suspended. Please contact an administrator.",
              variant: "destructive",
            });
            signOut(); // Sign out suspended user
            return;
          }
          
          if (!userProfile) {
            console.warn('No profile found for user, but sign in was successful');
          }
        });
        
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setProfile(null);
      
      toast({
        title: "Success",
        description: "Signed out successfully!",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      console.log('Updating profile:', updates);
      
      const { data, error } = await supabase
        .from('blog.user_profiles') // Updated table name and schema
        .update(updates)
        .eq('user_id', user.id) // Updated column name
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
