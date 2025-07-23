export interface Comment {
  id: string;
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

// Persistent storage key
import { safeJsonParse } from '@/utils/safeEvalAlternatives';

const STORAGE_KEY = 'blog_post_interactions';

// Generate visitor ID for tracking
const getVisitorId = () => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

// Load interactions from localStorage
const loadInteractions = (): PostInteractions[] => {
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
};

// Save interactions to localStorage
const saveInteractions = (interactions: PostInteractions[]) => {
  try {
    // Convert Sets to arrays for JSON serialization
    const dataToSave = interactions.map(interaction => ({
      ...interaction,
      likedBy: Array.from(interaction.likedBy)
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving interactions to localStorage:', error);
  }
};

// Initialize with persistent data
let interactions: PostInteractions[] = loadInteractions();

// Legacy support: If no stored data, add some sample data for migration testing
if (interactions.length === 0) {
  console.log('📝 No existing localStorage data found - this is expected for new installations');
}

export const commentsStore = {
  getPostInteractions: (postId: string) => {
    const found = interactions.find(i => i.postId === postId);
    return found || { postId, likes: 0, shares: 0, comments: [], likedBy: new Set() };
  },
  
  addComment: (postId: string, author: string, content: string) => {
    console.log('⚠️ DEPRECATED: addComment called - comments should now be added via database');
    
    const comment: Comment = {
      id: Date.now().toString(),
      postId,
      author,
      content,
      createdAt: new Date().toISOString(),
      likes: 0
    };
    
    let postInteractions = interactions.find(i => i.postId === postId);
    if (!postInteractions) {
      postInteractions = { postId, likes: 0, shares: 0, comments: [], likedBy: new Set() };
      interactions.push(postInteractions);
    }
    
    postInteractions.comments.unshift(comment);
    saveInteractions(interactions);
    return comment;
  },
  
  likePost: (postId: string) => {
    console.log('⚠️ DEPRECATED: likePost called - likes should now be added via database');
    
    const visitorId = getVisitorId();
    
    let postInteractions = interactions.find(i => i.postId === postId);
    if (!postInteractions) {
      postInteractions = { postId, likes: 0, shares: 0, comments: [], likedBy: new Set() };
      interactions.push(postInteractions);
    }
    
    // Check if visitor already liked this post
    if (postInteractions.likedBy.has(visitorId)) {
      console.log('👤 Visitor already liked this post');
      return postInteractions.likes; // Return current likes without incrementing
    }
    
    // Add like and track visitor
    postInteractions.likes++;
    postInteractions.likedBy.add(visitorId);
    saveInteractions(interactions);
    
    console.log('❤️ New like added by visitor:', visitorId);
    return postInteractions.likes;
  },
  
  hasUserLiked: (postId: string) => {
    console.log('⚠️ DEPRECATED: hasUserLiked called - like status should now be checked via database');
    
    const visitorId = getVisitorId();
    const postInteractions = interactions.find(i => i.postId === postId);
    return postInteractions ? postInteractions.likedBy.has(visitorId) : false;
  },
  
  sharePost: (postId: string) => {
    console.log('⚠️ DEPRECATED: sharePost called - shares should now be added via database');
    
    let postInteractions = interactions.find(i => i.postId === postId);
    if (!postInteractions) {
      postInteractions = { postId, likes: 0, shares: 0, comments: [], likedBy: new Set() };
      interactions.push(postInteractions);
    }
    postInteractions.shares++;
    saveInteractions(interactions);
    return postInteractions.shares;
  },

  // Method to get all interactions (for data migration)
  getAllInteractions: () => {
    return [...interactions];
  },

  // Method to clear all interactions (for post-migration cleanup)
  clearAllInteractions: () => {
    console.log('🧹 Clearing all localStorage interactions after migration');
    interactions = [];
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('visitor_id');
  }
};