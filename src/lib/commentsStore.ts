// This file previously managed client-side local storage for comments and post interactions.
// With the new database schema and direct Supabase interactions via hooks (e.g., useOptimizedComments),
// most of this client-side persistence logic is now DEPRECATED.
// It is primarily kept here to facilitate cleanup of old local storage data.

import { safeJsonParse } from '@/utils/safeEvalAlternatives';

export interface Comment {
  id: string; // This might be comment_id from DB now, but keeping 'id' for local compatibility
  postId: string;
  author: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface PostInteractions {
  postId: string;
  likes: number;
  shares: number;
  comments: Comment[];
  likedBy: Set<string>; // Track who liked the post
}

const STORAGE_KEY = 'blog_post_interactions';

// This function is still used by useOptimizedComments to clear old local data.
export const commentsStore = {
  // Method to get all interactions (for data migration) - now largely for legacy data viewing
  getAllInteractions: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data = stored ? safeJsonParse(stored, []) : [];
      
      // Convert likedBy arrays back to Sets
      return (Array.isArray(data) ? data : []).map((interaction: any) => ({
        ...interaction,
        likedBy: new Set(interaction.likedBy || [])
      }));
    } catch (error) {
      console.error('Error loading interactions from localStorage:', error);
      return [];
    }
  },

  // Method to clear all interactions (for post-migration cleanup)
  clearAllInteractions: () => {
    console.log('🧹 Clearing all localStorage interactions after migration (DEPRECATED)');
    localStorage.removeItem(STORAGE_KEY);
    // Also remove any old visitor_id directly managed by this file
    localStorage.removeItem('visitor_id'); 
  },

  // Deprecated methods - these should no longer be called by new code
  // They remain here only for completeness of the original structure, but are no-ops or log warnings.
  getPostInteractions: (postId: string) => {
    console.warn('⚠️ DEPRECATED: getPostInteractions called. Interactions are now managed via database.');
    return { postId, likes: 0, shares: 0, comments: [], likedBy: new Set() };
  },
  
  addComment: (postId: string, author: string, content: string) => {
    console.warn('⚠️ DEPRECATED: addComment called. Comments should now be added via database.');
    return { id: '', postId, author, content, createdAt: '', likes: 0 };
  },
  
  likePost: (postId: string) => {
    console.warn('⚠️ DEPRECATED: likePost called. Likes should now be added via database.');
    return 0;
  },
  
  hasUserLiked: (postId: string) => {
    console.warn('⚠️ DEPRECATED: hasUserLiked called. Like status should now be checked via database.');
    return false;
  },
  
  sharePost: (postId: string) => {
    console.warn('⚠️ DEPRECATED: sharePost called. Shares should now be added via database.');
    return 0;
  }
};
