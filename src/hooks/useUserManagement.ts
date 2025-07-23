import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const useUserManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching all user profiles...');
      
      const { data, error } = await supabase
        .from('profiles')
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

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setUsers(prev => prev.map(user => 
        user.id === userId ? data : user
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
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.warn('Auth deletion failed, proceeding with profile deletion:', authError);
      }

      // Delete the profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      setUsers(prev => prev.filter(user => user.id !== userId));
      
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

      const { data, error } = await supabase
        .from('profiles')
        .update({ is_suspended: suspend })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setUsers(prev => prev.map(user => 
        user.id === userId ? data : user
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

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
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
    const channel = supabase
      .channel('user-management-profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('📡 Realtime update for user profiles:', payload);
          
          if (payload.eventType === 'INSERT') {
            setUsers(prev => [payload.new as Profile, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers(prev => prev.map(user => 
              user.id === payload.new.id ? payload.new as Profile : user
            ));
          } else if (payload.eventType === 'DELETE') {
            setUsers(prev => prev.filter(user => user.id !== payload.old.id));
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