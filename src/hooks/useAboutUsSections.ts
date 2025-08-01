import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Updated AboutUsSection types to match the new 'blog.about_us_sections' table
type AboutUsSection = Database['blog']['Tables']['about_us_sections']['Row'];
type AboutUsSectionInsert = Database['blog']['Tables']['about_us_sections']['Insert'];
type AboutUsSectionUpdate = Database['blog']['Tables']['about_us_sections']['Update'];

export const useAboutUsSections = () => {
  const [sections, setSections] = useState<AboutUsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching about us sections...');
      
      // Updated table name and schema to 'blog.about_us_sections'
      // Updated order by 'display_order'
      const { data, error } = await supabase
        .from('blog.about_us_sections')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        throw error;
      }

      console.log('✅ About us sections fetched:', data?.length || 0);
      setSections(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching about us sections:', error);
      setError(error.message || 'Failed to load about us sections');
      toast({
        title: "Error",
        description: "Failed to load about us sections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSection = async (sectionData: AboutUsSectionInsert) => {
    try {
      console.log('📝 Creating about us section:', sectionData);

      // Updated table name and schema to 'blog.about_us_sections'
      const { data, error } = await supabase
        .from('blog.about_us_sections')
        .insert(sectionData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSections(prev => [...prev, data].sort((a, b) => a.display_order - b.display_order));
      
      toast({
        title: "Success",
        description: "Section created successfully!",
      });

      return data;
    } catch (error: any) {
      console.error('❌ Error creating section:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create section",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSection = async (id: string, updates: AboutUsSectionUpdate) => {
    try {
      console.log('📝 Updating about us section:', id, updates);

      // Updated table name and schema to 'blog.about_us_sections'
      // Updated eq column to 'id' (assuming 'id' is still PK)
      // Updated timestamp column to 'modified_at'
      const { data, error } = await supabase
        .from('blog.about_us_sections')
        .update({ ...updates, modified_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSections(prev => 
        prev.map(section => 
          section.id === id ? data : section
        ).sort((a, b) => a.display_order - b.display_order)
      );
      
      toast({
        title: "Success",
        description: "Section updated successfully!",
      });

      return data;
    } catch (error: any) {
      console.error('❌ Error updating section:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update section",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSection = async (id: string) => {
    try {
      console.log('🗑️ Deleting about us section:', id);

      // Updated table name and schema to 'blog.about_us_sections'
      // Updated eq column to 'id'
      const { error } = await supabase
        .from('blog.about_us_sections')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setSections(prev => prev.filter(section => section.id !== id));
      
      toast({
        title: "Success",
        description: "Section deleted successfully",
      });
    } catch (error: any) {
      console.error('❌ Error deleting section:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete section",
        variant: "destructive",
      });
      throw error;
    }
  };

  const reorderSections = async (reorderedSections: AboutUsSection[]) => {
    try {
      console.log('🔄 Reordering sections...');

      // Update display_order for each section
      const updates = reorderedSections.map((section, index) => ({
        id: section.id,
        display_order: index + 1,
        modified_at: new Date().toISOString() // Update timestamp for consistency
      }));

      for (const update of updates) {
        // Updated table name and schema to 'blog.about_us_sections'
        // Updated eq column to 'id'
        await supabase
          .from('blog.about_us_sections')
          .update({ display_order: update.display_order, modified_at: update.modified_at })
          .eq('id', update.id);
      }

      // Update local state
      setSections(reorderedSections);
      
      toast({
        title: "Success",
        description: "Sections reordered successfully!",
      });
    } catch (error: any) {
      console.error('❌ Error reordering sections:', error);
      toast({
        title: "Error",
        description: "Failed to reorder sections",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSections();

    // Set up realtime subscription
    // Updated schema and table name
    const channel = supabase
      .channel('about-us-sections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'blog', // Updated schema
          table: 'about_us_sections' // Updated table name
        },
        (payload) => {
          console.log('📡 Realtime update for about us sections:', payload);
          
          if (payload.eventType === 'INSERT') {
            setSections(prev => [...prev, payload.new as AboutUsSection].sort((a, b) => a.display_order - b.display_order));
          } else if (payload.eventType === 'UPDATE') {
            // Key is 'id' for about_us_sections table
            setSections(prev => 
              prev.map(section => 
                section.id === (payload.new as AboutUsSection).id ? payload.new as AboutUsSection : section
              ).sort((a, b) => a.display_order - b.display_order)
            );
          } else if (payload.eventType === 'DELETE') {
            // Key is 'id' for about_us_sections table
            setSections(prev => prev.filter(section => section.id !== (payload.old as AboutUsSection).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    sections,
    loading,
    error,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    refetch: fetchSections
  };
};

// Hook for public access (only active sections)
export const usePublicAboutUsSections = () => {
  const [sections, setSections] = useState<AboutUsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicSections = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching public about us sections...');
        
        // Updated table name and schema to 'blog.about_us_sections'
        // Updated order by 'display_order'
        const { data, error } = await supabase
          .from('blog.about_us_sections')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) {
          throw error;
        }

        console.log('✅ Public about us sections fetched:', data?.length || 0);
        setSections(data || []);
      } catch (error: any) {
        console.error('❌ Error fetching public about us sections:', error);
        setError(error.message || 'Failed to load about us sections');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicSections();

    // Set up realtime subscription for public sections
    // Updated schema and table name
    const channel = supabase
      .channel('public-about-us-sections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'blog', // Updated schema
          table: 'about_us_sections', // Updated table name
          filter: 'is_active=eq.true'
        },
        (payload) => {
          console.log('📡 Realtime update for public about us sections:', payload);
          fetchPublicSections(); // Refetch to ensure we only get active sections
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { sections, loading, error };
};
