import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { visitorTracker } from '@/lib/visitorTracking';
import { PerformanceLogger, ClientCache } from '@/utils/performanceLogger';
import type { Database } from '@/integrations/supabase/types';

type Comment = Database['public']['Tables']['comments']['Row'];
type CommentInsert = Database['public']['Tables']['comments']['Insert'];

export interface OptimizedPostEngagement {
  likes: number;
  shares: number;
  comments: Comment[];
  hasUserLiked: boolean;
  globalCommentName?: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

export const useOptimizedComments = (postId: string) => {
  const [engagement, setEngagement] = useState<OptimizedPostEngagement>({
    likes: 0,
    shares: 0,
    comments: [],
    hasUserLiked: false,
    globalCommentName: undefined,
    isLoading: true,
    isError: false,
    errorMessage: undefined
  });
  
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const visitorId = visitorTracker.getVisitorId();
  const GLOBAL_COMMENTER_NAME_KEY = 'nf_global_commenter_name';
  // New: Key for storing comment ownership locally
  const LOCAL_COMMENT_OWNERSHIP_KEY = 'nf_local_comment_ownership'; 

  // New: Helper to get local comment ownership map
  const getLocalCommentOwnership = (): Record<string, string> => {
    try {
      const stored = localStorage.getItem(LOCAL_COMMENT_OWNERSHIP_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error parsing local comment ownership:', e);
      return {};
    }
  };

  // New: Helper to save local comment ownership map
  const saveLocalCommentOwnership = (map: Record<string, string>) => {
    try {
      localStorage.setItem(LOCAL_COMMENT_OWNERSHIP_KEY, JSON.stringify(map));
    } catch (e) {
      console.error('Error saving local comment ownership:', e);
    }
  };

  // Optimized data loading with caching and error handling
  const loadEngagement = useCallback(async (useCache = true) => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    PerformanceLogger.startTimer(`loadEngagement-${postId}`);
    
    try {
      // Check cache first
      const cacheKey = `engagement-${postId}`;
      if (useCache) {
        const cachedData = ClientCache.get(cacheKey);
        if (cachedData) {
          PerformanceLogger.logInfo('Using cached engagement data', { postId });
          setEngagement(prev => ({ ...prev, ...cachedData, isLoading: false, isError: false }));
          PerformanceLogger.endTimer(`loadEngagement-${postId}`);
          return;
        }
      }

      setEngagement(prev => ({ ...prev, isLoading: true, isError: false }));

      // Load all data in parallel for better performance
      const [commentsResult, likesResult, sharesResult, userLikeResult] = await Promise.all([
        supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .abortSignal(signal),
        
        supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId)
          .abortSignal(signal),
        
        supabase
          .from('post_shares')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId)
          .abortSignal(signal),
        
        supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('visitor_id', visitorId)
          .maybeSingle()
          .abortSignal(signal)
      ]);

      // Check for errors
      if (commentsResult.error) throw commentsResult.error;
      if (likesResult.error) throw likesResult.error;
      if (sharesResult.error) throw sharesResult.error;
      if (userLikeResult.error && userLikeResult.error.code !== 'PGRST116') {
        throw userLikeResult.error;
      }

      const globalCommentName = localStorage.getItem(GLOBAL_COMMENTER_NAME_KEY);

      const engagementData = {
        likes: likesResult.count || 0,
        shares: sharesResult.count || 0,
        comments: commentsResult.data || [],
        hasUserLiked: !!userLikeResult.data,
        globalCommentName: globalCommentName || undefined,
        isLoading: false,
        isError: false,
        errorMessage: undefined
      };

      // Cache the data for 2 minutes
      ClientCache.set(cacheKey, engagementData, 2 * 60 * 1000);
      
      setEngagement(prev => ({ ...prev, ...engagementData }));
      
      PerformanceLogger.logInfo('Engagement data loaded successfully', {
        postId,
        likes: engagementData.likes,
        shares: engagementData.shares,
        comments: engagementData.comments.length
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        PerformanceLogger.logInfo('Request aborted', { postId });
        return;
      }
      
      PerformanceLogger.logError('loadEngagement', error, { postId });
      
      setEngagement(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        errorMessage: 'Failed to load engagement data. Please try refreshing the page.'
      }));
      
      toast({
        title: "Loading Error",
        description: "Failed to load comments and engagement data.",
        variant: "destructive",
      });
    } finally {
      PerformanceLogger.endTimer(`loadEngagement-${postId}`);
    }
  }, [postId, visitorId, toast]);

  // Optimized like function with immediate UI feedback
  const likePost = useCallback(async () => {
    if (engagement.hasUserLiked || engagement.isLoading) {
      toast({
        title: "Already Liked",
        description: "You have already liked this post.",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update
    setEngagement(prev => ({
      ...prev,
      likes: prev.likes + 1,
      hasUserLiked: true
    }));

    try {
      PerformanceLogger.startTimer(`likePost-${postId}`);
      
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          visitor_id: visitorId,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Liked",
            description: "You have already liked this post.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Clear cache to force refresh on next load
      ClientCache.delete(`engagement-${postId}`);
      
      toast({
        title: "Liked!",
        description: "You liked this post.",
      });

    } catch (error: any) {
      PerformanceLogger.logError('likePost', error, { postId });
      
      // Revert optimistic update
      setEngagement(prev => ({
        ...prev,
        likes: Math.max(0, prev.likes - 1),
        hasUserLiked: false
      }));
      
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    } finally {
      PerformanceLogger.endTimer(`likePost-${postId}`);
    }
  }, [engagement.hasUserLiked, engagement.isLoading, postId, visitorId, toast]);

  // Optimized share function
  const sharePost = useCallback(async (shareType: string = 'unknown') => {
    // Optimistic update
    setEngagement(prev => ({
      ...prev,
      shares: prev.shares + 1
    }));

    try {
      PerformanceLogger.startTimer(`sharePost-${postId}`);
      
      const { error } = await supabase
        .from('post_shares')
        .insert({
          post_id: postId,
          visitor_id: visitorId,
          share_type: shareType
        });

      if (error) throw error;

      // Clear cache to force refresh on next load
      ClientCache.delete(`engagement-${postId}`);

    } catch (error: any) {
      PerformanceLogger.logError('sharePost', error, { postId, shareType });
      
      // Revert optimistic update
      setEngagement(prev => ({
        ...prev,
        shares: Math.max(0, prev.shares - 1)
      }));
      
      toast({
        title: "Error",
        description: "Failed to record share. The link was still copied/shared.",
        variant: "destructive",
      });
    } finally {
      PerformanceLogger.endTimer(`sharePost-${postId}`);
    }
  }, [postId, visitorId, toast]);

  // Optimized add comment function
  const addComment = useCallback(async (authorName: string, content: string, authorEmail?: string) => {
    try {
      PerformanceLogger.startTimer(`addComment-${postId}`);
      
      const finalAuthorName = engagement.globalCommentName || authorName;
      const finalAuthorEmail = authorEmail || null; // Ensure email is null if not provided

      const commentData: CommentInsert = {
        post_id: postId,
        author_name: finalAuthorName,
        author_email: finalAuthorEmail, // New: Pass the email to the database
        content: content.trim(),
        is_approved: true
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select()
        .single();

      if (error) throw error;

      // Store the author name globally
      localStorage.setItem(GLOBAL_COMMENTER_NAME_KEY, finalAuthorName);
      
      // New: Store ownership of this specific comment locally using a unique identifier
      const currentOwnership = getLocalCommentOwnership();
      // Use a combination of email and name for better identification if email is provided, else just name
      currentOwnership[data.id] = finalAuthorEmail ? `${finalAuthorEmail}|${finalAuthorName}` : finalAuthorName;
      saveLocalCommentOwnership(currentOwnership);

      // Optimistic update
      setEngagement(prev => ({
        ...prev,
        comments: [data, ...prev.comments],
        globalCommentName: finalAuthorName
      }));

      // Clear cache to force refresh on next load
      ClientCache.delete(`engagement-${postId}`);

      toast({
        title: "Comment added!",
        description: "Your comment has been posted.",
      });

      return data;

    } catch (error: any) {
      PerformanceLogger.logError('addComment', error, { postId });
      
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      PerformanceLogger.endTimer(`addComment-${postId}`);
    }
  }, [engagement.globalCommentName, postId, toast]);

  // Update comment function
  const updateComment = useCallback(async (commentId: string, newContent: string) => {
    try {
      PerformanceLogger.startTimer(`updateComment-${commentId}`);
      
      const { data, error } = await supabase
        .from('comments')
        .update({ 
          content: newContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setEngagement(prev => ({
        ...prev,
        comments: prev.comments.map(comment =>
          comment.id === commentId ? data : comment
        )
      }));

      // Clear cache to force refresh on next load
      ClientCache.delete(`engagement-${postId}`);

      toast({
        title: "Comment updated!",
        description: "Your comment has been updated.",
      });

      return data;

    } catch (error: any) {
      PerformanceLogger.logError('updateComment', error, { commentId });
      
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      PerformanceLogger.endTimer(`updateComment-${commentId}`);
    }
  }, [postId, toast]);

  // Delete comment function
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      PerformanceLogger.startTimer(`deleteComment-${commentId}`);
      
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Update local state
      setEngagement(prev => ({
        ...prev,
        comments: prev.comments.filter(comment => comment.id !== commentId)
      }));

      // New: Remove ownership from local storage
      const currentOwnership = getLocalCommentOwnership();
      delete currentOwnership[commentId];
      saveLocalCommentOwnership(currentOwnership);

      // Clear cache to force refresh on next load
      ClientCache.delete(`engagement-${postId}`);

      toast({
        title: "Comment deleted!",
        description: "Your comment has been removed.",
      });

    } catch (error: any) {
      PerformanceLogger.logError('deleteComment', error, { commentId });
      
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      PerformanceLogger.endTimer(`deleteComment-${commentId}`);
    }
  }, [postId, toast]);

  // New: Check if user can edit a comment (based on stored commenter name or locally stored ownership)
  const canEditComment = useCallback((comment: Comment) => {
    const globalCommentName = localStorage.getItem(GLOBAL_COMMENTER_NAME_KEY);
    const localOwnership = getLocalCommentOwnership();

    // Check if the current user is the author of this specific comment based on local ownership
    // This handles cases where user might clear global name but still has local ownership record
    const isLocalAuthor = localOwnership[comment.id] === comment.author_email ||
                          localOwnership[comment.id] === comment.author_name ||
                          localOwnership[comment.id] === `${comment.author_email}|${comment.author_name}`;

    // Also allow editing if the comment author name matches the globally stored name
    const matchesGlobalName = globalCommentName && comment.author_name === globalCommentName;
    
    // An authenticated user (admin or author_id owner) can also edit if you introduce checks here
    // For now, based on anonymous commenting:
    return isLocalAuthor || matchesGlobalName;
  }, []);

  // Clear global commenter name
  const clearGlobalCommentName = useCallback(() => {
    localStorage.removeItem(GLOBAL_COMMENTER_NAME_KEY);
    localStorage.removeItem(LOCAL_COMMENT_OWNERSHIP_KEY); // New: Also clear comment ownership map
    setEngagement(prev => ({
      ...prev,
      globalCommentName: undefined
    }));
    toast({
      title: "Name Cleared",
      description: "Your commenter name and local comment ownership have been reset.",
    });
  }, [toast]);

  // Initial load and real-time subscriptions
  useEffect(() => {
    loadEngagement();

    // Set up real-time subscriptions with error handling
    const channels: any[] = [];

    try {
      // Comments subscription
      const commentsChannel = supabase
        .channel(`optimized-comments-${postId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `post_id=eq.${postId}`
          },
          (payload) => {
            PerformanceLogger.logInfo('Real-time comment update', payload);
            
            if (payload.eventType === 'INSERT' && payload.new.is_approved) {
              setEngagement(prev => ({
                ...prev,
                comments: [payload.new as Comment, ...prev.comments]
              }));
            } else if (payload.eventType === 'UPDATE') {
              setEngagement(prev => ({
                ...prev,
                comments: prev.comments.map(comment =>
                  comment.id === payload.new.id ? payload.new as Comment : comment
                )
              }));
            } else if (payload.eventType === 'DELETE') {
              setEngagement(prev => ({
                ...prev,
                comments: prev.comments.filter(comment => comment.id !== payload.old.id)
              }));
            }
            
            // Clear cache when real-time updates occur
            ClientCache.delete(`engagement-${postId}`);
          }
        )
        .subscribe();

      channels.push(commentsChannel);

      // Likes subscription
      const likesChannel = supabase
        .channel(`optimized-likes-${postId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'post_likes',
            filter: `post_id=eq.${postId}`
          },
          (payload) => {
            PerformanceLogger.logInfo('Real-time like update', payload);
            
            if (payload.eventType === 'INSERT') {
              setEngagement(prev => ({
                ...prev,
                likes: prev.likes + 1,
                hasUserLiked: payload.new.visitor_id === visitorId ? true : prev.hasUserLiked
              }));
            } else if (payload.eventType === 'DELETE') {
              setEngagement(prev => ({
                ...prev,
                likes: Math.max(0, prev.likes - 1),
                hasUserLiked: payload.old.visitor_id === visitorId ? false : prev.hasUserLiked
              }));
            }
            
            // Clear cache when real-time updates occur
            ClientCache.delete(`engagement-${postId}`);
          }
        )
        .subscribe();

      channels.push(likesChannel);

    } catch (error) {
      PerformanceLogger.logError('Real-time subscription setup', error, { postId });
    }

    return () => {
      // Cleanup: abort pending requests and remove subscriptions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      channels.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          PerformanceLogger.logError('Channel cleanup', error);
        }
      });
    };
  }, [postId, visitorId, loadEngagement]);

  return {
    engagement,
    likePost,
    sharePost,
    addComment,
    updateComment,
    deleteComment,
    canEditComment,
    clearGlobalCommentName,
    refetch: () => loadEngagement(false) // Force refresh without cache
  };
};

// Helper function to get client IP
const getClientIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    PerformanceLogger.logWarning('Could not get client IP', error);
    return null;
  }
};
