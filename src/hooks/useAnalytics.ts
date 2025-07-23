import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { visitorTracker } from '@/lib/visitorTracking';
import { commentsStore } from '@/lib/commentsStore';
import { safeJsonParse, safePropertyAccess } from '@/utils/safeEvalAlternatives';
import type { Database } from '@/integrations/supabase/types';
import { safeSetTimeout } from '@/lib/utils';

type PostAnalytics = Database['public']['Tables']['post_analytics']['Row'];
type PromotionAnalytics = Database['public']['Tables']['promotion_analytics']['Row'];
type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
type Comment = Database['public']['Tables']['comments']['Row'];

export interface AnalyticsSummary {
  total_posts: number;
  total_views: number;
  total_unique_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  avg_engagement_rate: number;
}

export interface PromotionSummary {
  total_promotions: number;
  total_views: number;
  total_unique_views: number;
  total_clicks: number;
  total_unique_clicks: number;
  avg_click_through_rate: number;
}

// Enhanced post analytics with real-time engagement data
export interface EnhancedPostAnalytics extends PostAnalytics {
  blog_posts?: {
    title: string;
    slug: string;
  };
  real_time_likes: number;
  real_time_shares: number;
  real_time_comments: number;
}

export const useAnalytics = () => {
  const [postAnalytics, setPostAnalytics] = useState<EnhancedPostAnalytics[]>([]);
  const [promotionAnalytics, setPromotionAnalytics] = useState<PromotionAnalytics[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [promotionSummary, setPromotionSummary] = useState<PromotionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPostAnalytics = async () => {
    try {
      console.log('📊 Fetching enhanced post analytics with real-time engagement...');
      
      // First, get all published blog posts
      const { data: blogPosts, error: postsError } = await supabase
        .from('blog_posts')
        .select('id, title, slug, is_published')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (postsError) {
        throw postsError;
      }

      console.log('📋 Found published posts:', blogPosts?.length || 0);

      // Get existing analytics data
      const { data, error } = await supabase
        .from('post_analytics')
        .select(`
          *,
          blog_posts (
            title,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('📊 Raw analytics data:', data?.length || 0);

      // Create enhanced analytics with real-time engagement data
      const enhancedAnalytics: EnhancedPostAnalytics[] = [];

      if (blogPosts) {
        for (const post of blogPosts) {
          // Find existing analytics for this post
          const existingAnalytics = data?.find(a => a.post_id === post.id);
          
          // Get real-time engagement counts from database
          const [likesResult, sharesResult, commentsResult] = await Promise.all([
            supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('post_shares').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id).eq('is_approved', true)
          ]);

          const realTimeLikes = likesResult.count || 0;
          const realTimeShares = sharesResult.count || 0;
          const realTimeComments = commentsResult.count || 0;

          // Create or update analytics entry
          const analyticsEntry: EnhancedPostAnalytics = {
            id: existingAnalytics?.id || `temp-${post.id}`,
            post_id: post.id,
            views: existingAnalytics?.views || 0,
            unique_views: existingAnalytics?.unique_views || 0,
            likes: realTimeLikes, // Use real-time data
            shares: realTimeShares, // Use real-time data
            comments_count: realTimeComments, // Use real-time data
            reading_time_avg: existingAnalytics?.reading_time_avg || 0,
            bounce_rate: existingAnalytics?.bounce_rate || 0,
            engagement_rate: existingAnalytics?.engagement_rate || 0,
            last_viewed: existingAnalytics?.last_viewed || new Date().toISOString(),
            created_at: existingAnalytics?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            blog_posts: {
              title: post.title,
              slug: post.slug
            },
            real_time_likes: realTimeLikes,
            real_time_shares: realTimeShares,
            real_time_comments: realTimeComments
          };

          // Recalculate engagement rate with real-time data
          const totalEngagements = realTimeLikes + realTimeShares + realTimeComments;
          const totalViews = analyticsEntry.views || 1;
          analyticsEntry.engagement_rate = (totalEngagements / totalViews) * 100;

          enhancedAnalytics.push(analyticsEntry);
        }
      }

      // Remove duplicates by post_id, keeping the most recent
      const uniqueAnalytics = enhancedAnalytics.reduce((acc: EnhancedPostAnalytics[], current) => {
        const existing = acc.find(item => item.post_id === current.post_id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);

      console.log('✅ Enhanced analytics prepared:', uniqueAnalytics.length);

      setPostAnalytics(uniqueAnalytics);
    } catch (error: any) {
      console.error('❌ Error fetching enhanced post analytics:', error);
      toast({
        title: "Analytics Error",
        description: "Failed to load post analytics. Please try refreshing.",
        variant: "destructive",
      });
    }
  };

  const fetchPromotionAnalytics = async () => {
    try {
      console.log('📊 Fetching promotion analytics...');
      
      const { data, error } = await supabase
        .from('promotion_analytics')
        .select(`
          *,
          promotions (
            title,
            message
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('📊 Raw promotion analytics data:', data);

      // Remove duplicates by promotion_id, keeping the most recent
      const uniqueAnalytics = data?.reduce((acc: PromotionAnalytics[], current) => {
        const existing = acc.find(item => item.promotion_id === current.promotion_id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []) || [];

      console.log('📊 Unique promotion analytics:', uniqueAnalytics);
      setPromotionAnalytics(uniqueAnalytics);
    } catch (error: any) {
      console.error('❌ Error fetching promotion analytics:', error);
    }
  };

  const calculateSummaries = () => {
    // Calculate post analytics summary
    const postSummary: AnalyticsSummary = {
      total_posts: postAnalytics.length,
      total_views: postAnalytics.reduce((sum, p) => sum + (p.views || 0), 0),
      total_unique_views: postAnalytics.reduce((sum, p) => sum + (p.unique_views || 0), 0),
      total_likes: postAnalytics.reduce((sum, p) => sum + (p.real_time_likes || p.likes || 0), 0),
      total_shares: postAnalytics.reduce((sum, p) => sum + (p.real_time_shares || p.shares || 0), 0),
      total_comments: postAnalytics.reduce((sum, p) => sum + (p.real_time_comments || p.comments_count || 0), 0),
      avg_engagement_rate: postAnalytics.length > 0 
        ? postAnalytics.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / postAnalytics.length
        : 0
    };

    // Calculate promotion analytics summary
    const promSummary: PromotionSummary = {
      total_promotions: promotionAnalytics.length,
      total_views: promotionAnalytics.reduce((sum, p) => sum + (p.total_views || 0), 0),
      total_unique_views: promotionAnalytics.reduce((sum, p) => sum + (p.unique_views || 0), 0),
      total_clicks: promotionAnalytics.reduce((sum, p) => sum + (p.total_clicks || 0), 0),
      total_unique_clicks: promotionAnalytics.reduce((sum, p) => sum + (p.unique_clicks || 0), 0),
      avg_click_through_rate: promotionAnalytics.length > 0
        ? promotionAnalytics.reduce((sum, p) => sum + (p.click_through_rate || 0), 0) / promotionAnalytics.length
        : 0
    };

    console.log('📊 Calculated summaries:', { postSummary, promSummary });
    setAnalyticsSummary(postSummary);
    setPromotionSummary(promSummary);
  };

  const trackPostEngagement = async (
    postId: string, 
    eventType: 'view' | 'like' | 'share' | 'comment' | 'reading_complete' | 'reading_progress',
    eventData: any = {}
  ) => {
    try {
      console.log('📊 Tracking post engagement:', { postId, eventType, eventData });
      
      // Get or create analytics record for this post
      let { data: analytics, error } = await supabase
        .from('post_analytics')
        .select('*')
        .eq('post_id', postId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      const visitorId = visitorTracker.getVisitorId();
      const fingerprint = visitorTracker.getVisitorFingerprint();

      // Get real-time counts from database
      const [likesResult, sharesResult, commentsResult] = await Promise.all([
        supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId),
        supabase.from('post_shares').select('*', { count: 'exact', head: true }).eq('post_id', postId),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', postId).eq('is_approved', true)
      ]);

      const currentLikes = likesResult.count || 0;
      const currentShares = sharesResult.count || 0;
      const currentComments = commentsResult.count || 0;

      if (!analytics) {
        // For view events, check if visitor has already viewed this post
        if (eventType === 'view') {
          const isNewView = visitorTracker.markPostAsViewed(postId);
          if (!isNewView) {
            console.log('📊 Visitor has already viewed this post, skipping duplicate view tracking');
            return;
          }
        }
        
        // Create new analytics record
        const { data: newAnalytics, error: createError } = await supabase
          .from('post_analytics')
          .insert({
            post_id: postId,
            views: eventType === 'view' ? 1 : 0,
            unique_views: eventType === 'view' ? 1 : 0,
            likes: currentLikes,
            shares: currentShares,
            comments_count: currentComments,
            reading_time_avg: eventType === 'reading_complete' && safePropertyAccess(eventData, 'reading_time') ? safePropertyAccess(eventData, 'reading_time') : 0,
            bounce_rate: eventType === 'reading_complete' && safePropertyAccess(eventData, 'is_bounce') !== undefined ? (safePropertyAccess(eventData, 'is_bounce') ? 100 : 0) : 0,
            last_viewed: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        analytics = newAnalytics;
        console.log('✅ Created new analytics record for post:', postId);
      } else {
        // Update existing analytics
        const updates: any = {
          last_viewed: new Date().toISOString(),
          comments_count: currentComments, // Always sync with database
          likes: currentLikes, // Always sync with database
          shares: currentShares // Always sync with database
        };

        switch (eventType) {
          case 'view':
            const isNewView = visitorTracker.markPostAsViewed(postId);
            if (!isNewView) {
              console.log('📊 Visitor has already viewed this post, skipping duplicate view tracking');
              return;
            }
            updates.views = (analytics.views || 0) + 1;
            // Only increment unique views for new visitors
            updates.unique_views = (analytics.unique_views || 0) + 1;
            break;
          case 'like':
            // Likes are handled by database, just sync the count
            break;
          case 'share':
            // Shares are handled by database, just sync the count
            break;
          case 'comment':
            // Comments are handled by database, just sync the count
            break;
          case 'reading_complete':
            // Update reading time average and bounce rate
            if (eventData.reading_time) {
              const currentAvg = analytics.reading_time_avg || 0;
              const currentViews = analytics.views || 1;
              // Calculate new average reading time
              updates.reading_time_avg = Math.round(
                (currentAvg * (currentViews - 1) + eventData.reading_time) / currentViews
              );
            }
            
            if (eventData.is_bounce !== undefined) {
              // Calculate bounce rate as percentage
              const currentBounceRate = analytics.bounce_rate || 0;
              const currentViews = analytics.views || 1;
              const currentBounces = Math.round((currentBounceRate / 100) * (currentViews - 1));
              const newBounces = currentBounces + (eventData.is_bounce ? 1 : 0);
              updates.bounce_rate = (newBounces / currentViews) * 100;
            }
            break;
          case 'reading_progress':
            // Optional: Update last_viewed timestamp for active reading sessions
            // Don't update other metrics for progress events
            break;
        }

        // Calculate engagement rate
        const totalEngagements = updates.likes + updates.shares + updates.comments_count;
        const totalViews = updates.views || analytics.views || 1;
        updates.engagement_rate = (totalEngagements / totalViews) * 100;

        const { data: updatedAnalytics, error: updateError } = await supabase
          .from('post_analytics')
          .update(updates)
          .eq('id', analytics.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        analytics = updatedAnalytics;
        console.log('✅ Updated analytics for post:', postId, updates);
      }

      // Refresh analytics to get updated real-time data
      safeSetTimeout(() => {
        fetchPostAnalytics();
      }, 500);

    } catch (error: any) {
      console.error('❌ Error tracking post engagement:', error);
    }
  };

  const trackPromotionEngagement = async (
    promotionId: string,
    eventType: 'view' | 'click' | 'close',
    eventData: any = {}
  ) => {
    try {
      console.log('📊 Tracking promotion engagement:', { promotionId, eventType, eventData });
      
      // For view events, check if visitor has already viewed this promotion
      if (eventType === 'view') {
        const isNewView = visitorTracker.markPromotionAsViewed(promotionId);
        if (!isNewView) {
          console.log('📊 Visitor has already viewed this promotion, skipping duplicate view tracking');
          return;
        }
      }
      
      // Get or create analytics record for this promotion
      let { data: analytics, error } = await supabase
        .from('promotion_analytics')
        .select('*')
        .eq('promotion_id', promotionId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      console.log('📊 Current promotion analytics:', analytics);

      if (!analytics) {
        // Create new analytics record
        const newRecord = {
          promotion_id: promotionId,
          total_views: eventType === 'view' ? 1 : 0,
          unique_views: eventType === 'view' ? 1 : 0,
          total_clicks: eventType === 'click' ? 1 : 0,
          unique_clicks: eventType === 'click' ? 1 : 0,
          click_through_rate: 0,
          conversion_rate: 0,
          bounce_rate: 0,
          avg_time_to_click: 0
        };

        console.log('📊 Creating new promotion analytics record:', newRecord);

        const { data: newAnalytics, error: createError } = await supabase
          .from('promotion_analytics')
          .insert(newRecord)
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating promotion analytics:', createError);
          throw createError;
        }

        analytics = newAnalytics;
        console.log('✅ Created new promotion analytics record:', analytics);
      } else {
        // Update existing analytics
        const updates: any = {};

        switch (eventType) {
          case 'view':
            updates.total_views = (analytics.total_views || 0) + 1;
            updates.unique_views = (analytics.unique_views || 0) + 1;
            break;
          case 'click':
            updates.total_clicks = (analytics.total_clicks || 0) + 1;
            updates.unique_clicks = (analytics.unique_clicks || 0) + 1;
            break;
          case 'close':
            // Just track the close event without updating counters
            break;
        }

        // Calculate click-through rate
        const totalClicks = updates.total_clicks || analytics.total_clicks || 0;
        const totalViews = updates.total_views || analytics.total_views || 1;
        updates.click_through_rate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

        console.log('📊 Updating promotion analytics with:', updates);

        const { data: updatedAnalytics, error: updateError } = await supabase
          .from('promotion_analytics')
          .update(updates)
          .eq('id', analytics.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating promotion analytics:', updateError);
          throw updateError;
        }

        analytics = updatedAnalytics;
        console.log('✅ Updated promotion analytics:', analytics);
      }

      // Update local state immediately
      setPromotionAnalytics(prev => {
        const filtered = prev.filter(p => p.promotion_id !== promotionId);
        return [analytics!, ...filtered];
      });

      // Recalculate summaries immediately
      safeSetTimeout(() => {
        calculateSummaries();
      }, 100);

    } catch (error: any) {
      console.error('❌ Error tracking promotion engagement:', error);
    }
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPostAnalytics(),
          fetchPromotionAnalytics()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();

    // Set up realtime subscriptions for analytics and engagement tables
    const postAnalyticsChannel = supabase
      .channel('post-analytics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_analytics'
        },
        (payload) => {
          console.log('📡 Realtime update for post analytics:', payload);
          // Refresh analytics when changes occur
          safeSetTimeout(() => {
            fetchPostAnalytics();
          }, 1000);
        }
      )
      .subscribe();

    // Subscribe to engagement tables for real-time updates
    const likesChannel = supabase
      .channel('post-likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes'
        },
        (payload) => {
          console.log('📡 Realtime update for post likes:', payload);
          safeSetTimeout(() => {
            fetchPostAnalytics();
          }, 500);
        }
      )
      .subscribe();

    const sharesChannel = supabase
      .channel('post-shares-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_shares'
        },
        (payload) => {
          console.log('📡 Realtime update for post shares:', payload);
          safeSetTimeout(() => {
            fetchPostAnalytics();
          }, 500);
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        (payload) => {
          console.log('📡 Realtime update for comments:', payload);
          safeSetTimeout(() => {
            fetchPostAnalytics();
          }, 500);
        }
      )
      .subscribe();

    const promotionAnalyticsChannel = supabase
      .channel('promotion-analytics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promotion_analytics'
        },
        (payload) => {
          console.log('📡 Realtime update for promotion analytics:', payload);
          
          if (payload.eventType === 'INSERT') {
            setPromotionAnalytics(prev => {
              const filtered = prev.filter(p => p.promotion_id !== (payload.new as PromotionAnalytics).promotion_id);
              return [payload.new as PromotionAnalytics, ...filtered];
            });
          } else if (payload.eventType === 'UPDATE') {
            setPromotionAnalytics(prev => prev.map(analytics => 
              analytics.id === payload.new.id ? payload.new as PromotionAnalytics : analytics
            ));
          } else if (payload.eventType === 'DELETE') {
            setPromotionAnalytics(prev => prev.filter(analytics => analytics.id !== payload.old.id));
          }
          
          // Recalculate summaries when promotion analytics change
          safeSetTimeout(() => {
            calculateSummaries();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postAnalyticsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(sharesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(promotionAnalyticsChannel);
    };
  }, []);

  useEffect(() => {
    calculateSummaries();
  }, [postAnalytics, promotionAnalytics]);

  return {
    postAnalytics,
    promotionAnalytics,
    analyticsSummary,
    promotionSummary,
    loading,
    trackPostEngagement,
    trackPromotionEngagement,
    refetch: async () => {
      console.log('🔄 Manual refresh of analytics data...');
      await Promise.all([
        fetchPostAnalytics(),
        fetchPromotionAnalytics()
      ]);
    }
  };
};