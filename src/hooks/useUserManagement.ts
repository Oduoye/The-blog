import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Updated Profile type to match the new 'blog.user_profiles' table
type Profile = Database['blog']['Tables']['user_profiles']['Row'];
type ProfileUpdate = Database['blog']['Tables']['user_profiles']['Update'];

export const useUserManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching all user profiles...');
      
      // Updated table name and schema to 'blog.user_profiles'
      // Updated order by 'created_at' (new column name in DB)
      const { data, error } = await supabase
        .from('blog.user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('✅ User profiles fetched:', data?.length || 0);
      setUsers(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: ProfileUpdate) => {
    try {
      console.log('📝 Updating user:', userId, updates);

      // Updated table name and schema to 'blog.user_profiles'
      // Updated eq column to 'user_id'
      const { data, error } = await supabase
        .from('blog.user_profiles')
        .update(updates)
        .eq('user_id', userId) 
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state, key is now 'user_id'
      setUsers(prev => prev.map(user => 
        user.user_id === userId ? data : user
      ));
      
      toast({
        title: "Success",
        description: "User updated successfully!",
      });

      return data;
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      console.log('🗑️ Deleting user:', userId);

      // First, delete the user's auth account
      // Supabase auth.admin.deleteUser still uses 'id'
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.warn('Auth deletion failed, proceeding with profile deletion:', authError);
      }

      // Delete the profile record
      // Updated table name and schema to 'blog.user_profiles'
      // Updated eq column to 'user_id'
      const { error: profileError } = await supabase
        .from('blog.user_profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        throw profileError;
      }

      // Update local state, key is now 'user_id'
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error: any) {
      console.error('❌ Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const suspendUser = async (userId: string, suspend: boolean) => {
    try {
      console.log(`${suspend ? '🚫' : '✅'} ${suspend ? 'Suspending' : 'Unsuspending'} user:`, userId);

      // Updated table name and schema to 'blog.user_profiles'
      // Updated eq column to 'user_id'
      const { data, error } = await supabase
        .from('blog.user_profiles')
        .update({ is_suspended: suspend })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state, key is now 'user_id'
      setUsers(prev => prev.map(user => 
        user.user_id === userId ? data : user
      ));
      
      toast({
        title: "Success",
        description: `User ${suspend ? 'suspended' : 'unsuspended'} successfully!`,
      });

      return data;
    } catch (error: any) {
      console.error(`❌ Error ${suspend ? 'suspending' : 'unsuspending'} user:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${suspend ? 'suspend' : 'unsuspend'} user`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getUserById = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('🔍 Fetching user by ID:', userId);

      // Updated table name and schema to 'blog.user_profiles'
      // Updated eq column to 'user_id'
      const { data, error } = await supabase
        .from('blog.user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ User fetched successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching user:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchUsers();

    // Set up realtime subscription for user profiles
    // Updated schema and table name
    const channel = supabase
      .channel('user-management-profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'blog', // Updated schema
          table: 'user_profiles' // Updated table name
        },
        (payload) => {
          console.log('📡 Realtime update for user profiles:', payload);
          
          if (payload.eventType === 'INSERT') {
            setUsers(prev => [payload.new as Profile, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Key is now 'user_id'
            setUsers(prev => prev.map(user => 
              user.user_id === payload.new.user_id ? payload.new as Profile : user
            ));
          } else if (payload.eventType === 'DELETE') {
            // Key is now 'user_id'
            setUsers(prev => prev.filter(user => user.user_id !== payload.old.user_id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    users, 
    loading, 
    updateUser, 
    deleteUser, 
    suspendUser,
    getUserById,
    refetch: fetchUsers 
  };
};
