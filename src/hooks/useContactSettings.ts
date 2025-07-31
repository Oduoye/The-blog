import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Updated ContactSettings type to match the new 'blog.contact_settings' table
export interface ContactSettings {
  id?: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  social_media: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
  };
  created_at?: string;
  modified_at?: string; // Updated from updated_at
}

export const useContactSettings = () => {
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContactSettings = async () => {
    try {
      console.log('Fetching contact settings from database...');
      
      // Updated table name and schema to 'blog.contact_settings'
      // Updated order by 'created_at' (column name in new DB)
      const { data, error } = await supabase
        .from('blog.contact_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        console.log('Contact settings fetched:', data);
        setContactSettings(data);
      } else {
        console.log('No contact settings found, using defaults');
        // Set default values if no settings exist
        setContactSettings({
          email: 'noncefirewall@gmail.com',
          phone: '',
          address: '',
          website: 'https://noncefirewall.com',
          description: 'Tech based educational blogs and multipurpose blogging arena. We provide cybersecurity insights, tech news, and industry updates.',
          social_media: {
            twitter: '',
            facebook: '',
            linkedin: '',
            instagram: ''
          }
        });
      }
    } catch (error: any) {
      console.error('Error fetching contact settings:', error);
      toast({
        title: "Error",
        description: "Failed to load contact settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateContactSettings = async (updates: Partial<ContactSettings>) => {
    try {
      console.log('Updating contact settings:', updates);

      // Check if settings exist
      // Updated table name and schema to 'blog.contact_settings'
      const { data: existing } = await supabase
        .from('blog.contact_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      let result;
      
      if (existing) {
        // Update existing settings
        // Updated table name and schema to 'blog.contact_settings'
        // Updated timestamp column to 'modified_at'
        result = await supabase
          .from('blog.contact_settings')
          .update({ ...updates, modified_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Create new settings
        // Updated table name and schema to 'blog.contact_settings'
        result = await supabase
          .from('blog.contact_settings')
          .insert(updates)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      console.log('Contact settings updated successfully:', result.data);
      setContactSettings(result.data);
      
      toast({
        title: "Success",
        description: "Contact settings updated successfully!",
      });

      return result.data;
    } catch (error: any) {
      console.error('Error updating contact settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update contact settings",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchContactSettings();

    // Set up realtime subscription for contact settings
    // Updated schema and table name
    const channel = supabase
      .channel('contact-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'blog', // Updated schema
          table: 'contact_settings' // Updated table name
        },
        (payload) => {
          console.log('Realtime update for contact settings:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setContactSettings(payload.new as ContactSettings);
            console.log('Contact settings updated via realtime:', payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    contactSettings,
    loading,
    updateContactSettings,
    refetch: fetchContactSettings
  };
};
