import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  updated_at?: string;
}

export const useContactSettings = () => {
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContactSettings = async () => {
    try {
      console.log('Fetching contact settings from database...');
      
      const { data, error } = await supabase
        .from('contact_settings')
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
      const { data: existing } = await supabase
        .from('contact_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      let result;
      
      if (existing) {
        // Update existing settings
        result = await supabase
          .from('contact_settings')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Create new settings
        result = await supabase
          .from('contact_settings')
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
    const channel = supabase
      .channel('contact-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_settings'
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