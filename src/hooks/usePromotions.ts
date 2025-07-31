import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Updated Promotion types to match the new 'blog.promotions' table
type Promotion = Database['blog']['Tables']['promotions']['Row'];
type PromotionInsert = Database['blog']['Tables']['promotions']['Insert'];
type PromotionUpdate = Database['blog']['Tables']['promotions']['Update'];

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching promotions from Supabase...');
      
      // Updated table name and schema to 'blog.promotions'
      // Updated order by 'created_at' (column name in new DB)
      const { data, error } = await supabase
        .from('blog.promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('✅ Promotions fetched successfully:', data);
      setPromotions(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching promotions:', error);
      toast({
        title: "Error",
        description: "Failed to load promotions",
        variant: "destructive",
      });
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivePromotions = async (page?: string) => {
    try {
      console.log('🔍 Getting active promotions for page:', page);
      
      // Updated table name and schema to 'blog.promotions'
      // Updated order by 'created_at' (column name in new DB)
      const { data, error } = await supabase
        .from('blog.promotions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching active promotions:', error);
        throw error;
      }

      console.log('📋 Active promotions from database:', data);

      // Filter by page and date rules on client side
      const now = new Date();
      const filteredPromotions = (data || []).filter(promotion => {
        const rules = promotion.display_rules as any || {};
        
        console.log('🔍 Filtering promotion:', promotion.title, {
          rules,
          currentPage: page,
          now: now.toISOString()
        });
        
        // Check page filter
        if (rules.pages && rules.pages.length > 0 && page) {
          const pageMatches = rules.pages.includes(page) || rules.pages.includes('all');
          if (!pageMatches) {
            console.log('❌ Page filter failed for:', promotion.title);
            return false;
          }
        }

        // Check date range
        if (rules.start_date && new Date(rules.start_date) > now) {
          console.log('❌ Start date filter failed for:', promotion.title);
          return false;
        }
        if (rules.end_date && new Date(rules.end_date) < now) {
          console.log('❌ End date filter failed for:', promotion.title);
          return false;
        }

        console.log('✅ Promotion passed filters:', promotion.title);
        return true;
      });

      console.log('✅ Filtered active promotions:', filteredPromotions);
      return filteredPromotions;
    } catch (error: any) {
      console.error('❌ Error fetching active promotions:', error);
      return [];
    }
  };

  const createPromotion = async (promotionData: PromotionInsert) => {
    try {
      console.log('📝 Creating promotion:', promotionData);

      // Updated table name and schema to 'blog.promotions'
      const { data, error } = await supabase
        .from('blog.promotions')
        .insert(promotionData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPromotions(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Promotion created successfully!",
      });

      console.log('✅ Promotion created:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Error creating promotion:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create promotion",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePromotion = async (id: string, updates: PromotionUpdate) => {
    try {
      console.log('📝 Updating promotion:', id, updates);

      // Updated table name and schema to 'blog.promotions'
      // Updated eq column to 'id' (assuming 'id' is still the PK for promotions)
      // Updated timestamp column to 'modified_at'
      const { data, error } = await supabase
        .from('blog.promotions')
        .update({ ...updates, modified_at: new Date().toISOString() }) 
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPromotions(prev => prev.map(promotion => 
        promotion.id === id ? data : promotion
      ));
      
      toast({
        title: "Success",
        description: "Promotion updated successfully!",
      });

      console.log('✅ Promotion updated:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Error updating promotion:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update promotion",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      console.log('🗑️ Deleting promotion:', id);

      // Updated table name and schema to 'blog.promotions'
      // Updated eq column to 'id'
      const { error } = await supabase
        .from('blog.promotions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setPromotions(prev => prev.filter(promotion => promotion.id !== id));
      
      toast({
        title: "Success",
        description: "Promotion deleted successfully",
      });

      console.log('✅ Promotion deleted');
    } catch (error: any) {
      console.error('❌ Error deleting promotion:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete promotion",
        variant: "destructive",
      });
      throw error;
    }
  };

  const trackPromotionView = async (promotionId: string, visitorId: string) => {
    try {
      console.log('📊 Tracking promotion view:', { promotionId, visitorId });
      // The new interactions table handles views. This function might need re-evaluation if it's meant to track promotion views specifically.
      // For now, leaving it as a placeholder or remove if not used elsewhere for promotion analytics.
    } catch (error) {
      console.error('❌ Error tracking promotion view:', error);
    }
  };

  const trackPromotionClick = async (promotionId: string, visitorId: string) => {
    try {
      console.log('📊 Tracking promotion click:', { promotionId, visitorId });
      // The new interactions table handles clicks. This function might need re-evaluation.
      // For now, leaving it as a placeholder or remove if not used elsewhere for promotion analytics.
    } catch (error) {
      console.error('❌ Error tracking promotion click:', error);
    }
  };

  useEffect(() => {
    fetchPromotions();

    // Set up realtime subscription for promotions
    // Updated schema and table name
    const channel = supabase
      .channel('promotions-realtime-hook')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'blog', // Updated schema
          table: 'promotions' // Updated table name
        },
        (payload) => {
          console.log('📡 Realtime promotion update in hook:', payload);
          
          if (payload.eventType === 'INSERT') {
            setPromotions(prev => [payload.new as Promotion, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPromotions(prev => prev.map(promotion => 
              // Key is 'id' for promotions table
              promotion.id === (payload.new as Promotion).id ? payload.new as Promotion : promotion
            ));
          } else if (payload.eventType === 'DELETE') {
            // Key is 'id' for promotions table
            setPromotions(prev => prev.filter(promotion => promotion.id !== (payload.old as Promotion).id));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Promotions hook realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    promotions, 
    loading, 
    createPromotion, 
    updatePromotion, 
    deletePromotion,
    getActivePromotions,
    trackPromotionView,
    trackPromotionClick,
    refetch: fetchPromotions 
  };
};
