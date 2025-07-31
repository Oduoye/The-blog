import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { visitorTracker } from '@/lib/visitorTracking';
import { PerformanceLogger, ClientCache } from '@/utils/performanceLogger';
import { safeSetTimeout, safeClearTimeout } from '@/lib/utils'; // Import safe timers
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext'; // New: Import useAuth to get user_id

// Updated Comment type to match the new 'blog.comments' table
type Comment = Database['blog']['Tables']['comments']['Row'];
type CommentInsert = Database['blog']['Tables']['comments']['Insert'];

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
  const { user } = useAuth(); // Get authenticated user for 'user_id' in interactions
  const abortControllerRef = useRef<AbortController | null>(null);
  const visitorId = visitorTracker.getVisitorId();
  const GLOBAL_COMMENTER_NAME_KEY = 'nf_global_commenter_name';
  const LOCAL_COMMENT_OWNERSHIP_KEY = 'nf_local_comment_ownership'; 

  const getLocalCommentOwnership = (): Record<string, string> => {
    try {
      const stored = localStorage.getItem(LOCAL_COMMENT_OWNERSHIP_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error parsing local comment ownership:', e);
      return {};
    }
  };

  const saveLocalCommentOwnership = (map: Record<string, string>) => {
    try {
      localStorage.setItem(LOCAL_COMMENT_OWNERSHIP_KEY, JSON.stringify(map));
    } catch (e) {
      console.error('Error saving local comment ownership:', e);
    }
  };

  // Optimized data loading with caching and error handling
  const loadEngagement = useCallback(async (useCache = true) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    PerformanceLogger.startTimer(`loadEngagement-${postId}`);
    
    try {
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

      // New: Fetch post details to get direct counts (likes_count, views_count, comments_count)
      const { data: postData, error: postError } = await supabase
        .from('blog.posts') // Updated table name and schema
        .select('likes_count, views_count, comments_count')
        .eq('post_id', postId) // Updated column name
        .single()
        .abortSignal(signal);

      if (postError) throw postError;

      // New: Check if the current user has liked this post from 'blog.interactions'
      const { data: userLike, error: userLikeError } = await supabase
        .from('blog.interactions') // Updated table name and schema
        .select('interaction_id') // Updated column name
        .eq('post_id', postId)
        .eq('interaction_type', 'like') // New: filter by interaction_type
        .eq('user_id', user?.id || null) // Use user_id from auth, or null for anon
        .maybeSingle()
        .abortSignal(signal);

      // PGRST116 means no rows returned, which is not an error for maybeSingle
      if (userLikeError && userLikeError.code !== 'PGRST116') {
        throw userLikeError;
      }

      // New: Fetch comments with author_name from 'blog.comments'
      const { data: commentsData, error: commentsError } = await supabase
        .from('blog.comments') // Updated table name and schema
        .select(`
            *,
            author:blog_user_profiles(display_name, email)
        `) // New: Join to get author display name and email
        .eq('post_id', postId) // Updated column name
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .abortSignal(signal);

      if (commentsError) throw commentsError;

      // Map comments data to include author_name directly
      const mappedComments: Comment[] = commentsData.map((comment: any) => ({
        ...comment,
        author_name: comment.author?.display_name || comment.author?.email || 'Anonymous' // Use display_name or email
      }));

      const globalCommentName = localStorage.getItem(GLOBAL_COMMENTER_NAME_KEY);

      const engagementData = {
        likes: postData.likes_count || 0, // Get count directly from blog.posts
        shares: 0, // Shares are tracked separately, not a direct count on posts table
        comments: mappedComments || [],
        hasUserLiked: !!userLike,
        globalCommentName: globalCommentName || undefined,
        isLoading: false,
        isError: false,
        errorMessage: undefined
      };

      // Since shares are not directly counted on posts, we might need a separate query or update the view if share count is crucial here.
      // For now, setting to 0 or keeping it as it was if there's no direct equivalent.
      // Assuming views_count and likes_count are the main real-time engagement metrics from blog.posts.

      // Cache the data for 2 minutes
      ClientCache.set(cacheKey, engagementData, 2 * 60 * 1000);
      
      setEngagement(prev => ({ ...prev, ...engagementData }));
      
      PerformanceLogger.logInfo('Engagement data loaded successfully', {
        postId,
        likes: engagementData.likes,
        shares: engagementData.shares, // This will be 0 as per current implementation
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
  }, [postId, visitorId, user, toast]); // Added 'user' dependency

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
      
      // New: Insert into 'blog.interactions' table with type 'like'
      const { error } = await supabase
        .from('blog.interactions') // Updated table name and schema
        .insert({
          post_id: postId,
          user_id: user?.id || null, // Pass user_id for authenticated likes, null for anonymous (if allowed by RLS)
          interaction_type: 'like', // New: Specify interaction type
          visitor_id: visitorId, // Keep visitor_id for tracking anonymous likes/deduplication
          // ip_address and user_agent are not on the new interactions table, if needed, add to DB
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation for user_id/post_id/interaction_type
          toast({
            title: "Already Liked",
            description: "You have already liked this post.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

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
  }, [engagement.hasUserLiked, engagement.isLoading, postId, visitorId, user, toast]); // Added 'user' dependency

  // Optimized share function
  const sharePost = useCallback(async (shareType: string = 'unknown') => {
    // Optimistic update
    setEngagement(prev => ({
      ...prev,
      shares: prev.shares + 1 // This count is frontend only for now
    }));

    try {
      PerformanceLogger.startTimer(`sharePost-${postId}`);
      
      // New: Insert into 'blog.interactions' table with type 'share'
      const { error } = await supabase
        .from('blog.interactions') // Updated table name and schema
        .insert({
          post_id: postId,
          user_id: user?.id || null, // Pass user_id for authenticated shares, null for anonymous
          interaction_type: 'share', // New: Specify interaction type
          visitor_id: visitorId,
          // share_type specific to old model, can be included in metadata if needed
        });

      if (error) throw error;

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
  }, [postId, visitorId, user, toast]); // Added 'user' dependency

  // Optimized add comment function
  const addComment = useCallback(async (authorName: string, content: string, authorEmail?: string) => {
    try {
      PerformanceLogger.startTimer(`addComment-${postId}`);
      
      const finalAuthorName = engagement.globalCommentName || authorName;
      const finalAuthorEmail = authorEmail || null;
      const finalAuthorId = user?.id || null; // New: Pass user_id if authenticated

      const commentData: CommentInsert = {
        post_id: postId,
        author_id: finalAuthorId, // New: Use user_id if authenticated
        author_name: finalAuthorName, // This column might not exist anymore, if so, map display_name from user_profiles
        author_email: finalAuthorEmail,
        content: content.trim(),
        is_approved: true
      };

      // Note: The new 'blog.comments' table does not have an 'author_name' column.
      // It relies on 'author_id' and joining with 'blog.user_profiles' for display_name.
      // Ensure 'author_name' and 'author_email' are handled correctly if they are not actual columns.
      // If 'author_name' and 'author_email' are NOT database columns, they should be removed from CommentInsert.
      // For now, assuming they are still used. If you get errors, check your DB schema and remove them from `commentData`.

      const { data, error } = await supabase
        .from('blog.comments') // Updated table name and schema
        .insert(commentData)
        .select()
        .single();

      if (error) throw error;

      // Store the author name globally
      localStorage.setItem(GLOBAL_COMMENTER_NAME_KEY, finalAuthorName);
      
      // Store ownership of this specific comment locally
      const currentOwnership = getLocalCommentOwnership();
      currentOwnership[data.comment_id] = finalAuthorEmail ? `${finalAuthorEmail}|${finalAuthorName}` : finalAuthorName; // Use comment_id
      saveLocalCommentOwnership(currentOwnership);

      // Optimistic update for comments: Fetch the full comment with author details after insert
      // Or, if using realtime, let realtime handle it.
      // For now, we'll optimistically add it as is, knowing realtime will correct it.
      // To get author name, we need to join after insert, or rely on realtime to provide it.
      const newCommentWithAuthor: Comment = {
        ...data,
        author_name: finalAuthorName // Optimistically add author_name for display
      };

      setEngagement(prev => ({
        ...prev,
        comments: [newCommentWithAuthor, ...prev.comments], // Use newCommentWithAuthor
        globalCommentName: finalAuthorName
      }));

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
  }, [engagement.globalCommentName, postId, user, toast]); // Added 'user' dependency

  // Update comment function
  const updateComment = useCallback(async (commentId: string, newContent: string) => {
    try {
      PerformanceLogger.startTimer(`updateComment-${commentId}`);
      
      const { data, error } = await supabase
        .from('blog.comments') // Updated table name and schema
        .update({ 
          content: newContent.trim(),
          modified_at: new Date().toISOString() // Updated column name
        })
        .eq('comment_id', commentId) // Updated column name
        .select()
        .single();

      if (error) throw error;

      // Update local state
      // Key is now 'comment_id'
      setEngagement(prev => ({
        ...prev,
        comments: prev.comments.map(comment =>
          comment.comment_id === commentId ? data : comment
        )
      }));

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
        .from('blog.comments') // Updated table name and schema
        .delete()
        .eq('comment_id', commentId); // Updated column name

      if (error) throw error;

      // Update local state
      // Key is now 'comment_id'
      setEngagement(prev => ({
        ...prev,
        comments: prev.comments.filter(comment => comment.comment_id !== commentId)
      }));

      // Remove ownership from local storage
      const currentOwnership = getLocalCommentOwnership();
      delete currentOwnership[commentId];
      saveLocalCommentOwnership(currentOwnership);

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

  // Check if user can edit a comment (based on stored commenter name or locally stored ownership)
  const canEditComment = useCallback((comment: Comment) => {
    const globalCommentName = localStorage.getItem(GLOBAL_COMMENTER_NAME_KEY);
    const localOwnership = getLocalCommentOwnership();

    // New: Check for authenticated user's ID
    const isAuthoredByUser = user && comment.author_id === user.id;

    // Check if the current user is the author of this specific comment based on local ownership
    // This handles cases where user might clear global name but still has local ownership record
    // localOwnership[comment.comment_id] could be email|name or just name
    const storedAuthInfo = localOwnership[comment.comment_id];
    const isLocalAuthor = storedAuthInfo && (
      storedAuthInfo.includes(comment.author_email || '') || // Check if stored info contains comment's email
      storedAuthInfo.includes(comment.author_name || '') // Check if stored info contains comment's name
    );

    // Also allow editing if the comment author name matches the globally stored name
    const matchesGlobalName = globalCommentName && comment.author_name === globalCommentName;
    
    // An authenticated user who is the author OR an admin can edit.
    // Assuming admin check will be higher up in component if needed.
    return isAuthoredByUser || isLocalAuthor || matchesGlobalName;
  }, [user]);

  // Clear global commenter name
  const clearGlobalCommentName = useCallback(() => {
    localStorage.removeItem(GLOBAL_COMMENTER_NAME_KEY);
    localStorage.removeItem(LOCAL_COMMENT_OWNERSHIP_KEY); // Also clear comment ownership map
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
      // Updated schema and table name
      const commentsChannel = supabase
        .channel(`optimized-comments-${postId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'blog', // Updated schema
            table: 'comments', // Updated table name
            filter: `post_id=eq.${postId}`
          },
          (payload) => {
            PerformanceLogger.logInfo('Real-time comment update', payload);
            
            if (payload.eventType === 'INSERT' && (payload.new as Comment).is_approved) {
              // For new inserts, refetch to get author name via join if not provided directly
              loadEngagement(false); // Force reload to get full comment data
            } else if (payload.eventType === 'UPDATE') {
              // Key is now 'comment_id'
              setEngagement(prev => ({
                ...prev,
                comments: prev.comments.map(comment =>
                  comment.comment_id === (payload.new as Comment).comment_id ? payload.new as Comment : comment
                )
              }));
            } else if (payload.eventType === 'DELETE') {
              // Key is now 'comment_id'
              setEngagement(prev => ({
                ...prev,
                comments: prev.comments.filter(comment => comment.comment_id !== (payload.old as Comment).comment_id)
              }));
            }
            
            // Clear cache when real-time updates occur
            ClientCache.delete(`engagement-${postId}`);
          }
        )
        .subscribe();

      channels.push(commentsChannel);

      // Likes subscription - now from 'blog.interactions'
      // Updated schema and table name
      const likesChannel = supabase
        .channel(`optimized-likes-${postId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'blog', // Updated schema
            table: 'interactions', // Updated table name
            filter: `post_id=eq.${postId}` // Still filter by post_id
          },
          (payload) => {
            PerformanceLogger.logInfo('Real-time like/interaction update', payload);
            
            // Only react to 'like' interactions for this channel
            if ((payload.new as any)?.interaction_type === 'like' || (payload.old as any)?.interaction_type === 'like') {
              if (payload.eventType === 'INSERT') {
                setEngagement(prev => ({
                  ...prev,
                  likes: prev.likes + 1,
                  // Check if this new like is from the current visitor based on visitor_id or user_id
                  hasUserLiked: (payload.new as any).visitor_id === visitorId || (user && (payload.new as any).user_id === user.id) ? true : prev.hasUserLiked
                }));
              } else if (payload.eventType === 'DELETE') {
                setEngagement(prev => ({
                  ...prev,
                  likes: Math.max(0, prev.likes - 1),
                  // Check if the deleted like was from the current visitor
                  hasUserLiked: (payload.old as any).visitor_id === visitorId || (user && (payload.old as any).user_id === user.id) ? false : prev.hasUserLiked
                }));
              }
            }
            
            ClientCache.delete(`engagement-${postId}`);
          }
        )
        .subscribe();

      channels.push(likesChannel);

    } catch (error) {
      PerformanceLogger.logError('Real-time subscription setup', error, { postId });
    }

    return () => {
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
  }, [postId, visitorId, user, loadEngagement]); // Added 'user' dependency

  return {
    engagement,
    likePost,
    sharePost,
    addComment,
    updateComment,
    deleteComment,
    canEditComment,
    clearGlobalCommentName,
    refetch: () => loadEngagement(false)
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
