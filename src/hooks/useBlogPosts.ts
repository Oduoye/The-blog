import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PerformanceLogger, ClientCache } from '@/utils/performanceLogger';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

// Updated BlogPost type to match the new 'blog.posts' table
type BlogPost = Database['blog']['Tables']['posts']['Row'];
type BlogPostInsert = Database['blog']['Tables']['posts']['Insert'];
type BlogPostUpdate = Database['blog']['Tables']['posts']['Update'];

export const useBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      PerformanceLogger.startTimer('fetchPosts');
      
      // Check cache first
      const cacheKey = 'published-posts';
      const cachedPosts = ClientCache.get(cacheKey);
      if (cachedPosts) {
        PerformanceLogger.logInfo('Using cached posts data');
        setPosts(cachedPosts);
        setLoading(false);
        PerformanceLogger.endTimer('fetchPosts');
        return;
      }
      
      console.log('Fetching published posts from Supabase...');
      
      // Updated table name and schema to 'blog.posts'
      // Updated order by 'published_at' (column name in new DB)
      // Select all columns and join with user_profiles to get author_name
      const { data, error } = await supabase
        .from('blog.posts')
        .select(`
            *,
            author:blog_user_profiles(display_name)
        `) // Select all from posts, and author's display_name from user_profiles
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
        return;
      }

      console.log('Fetched posts:', data);
      
      // Map data to ensure author_name is directly on the post object for consistency
      const mappedData: BlogPost[] = data.map((post: any) => ({
        ...post,
        author_name: post.author?.display_name || 'Unknown Author' // Extract display_name
      }));

      // Cache posts for 3 minutes
      ClientCache.set(cacheKey, mappedData || [], 3 * 60 * 1000);
      setPosts(mappedData || []);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
      PerformanceLogger.endTimer('fetchPosts');
    }
  };

  useEffect(() => {
    fetchPosts();

    // Set up realtime subscription for published posts
    // Updated schema and table name
    const channel = supabase
      .channel('public-blog-posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'blog', // Updated schema
          table: 'posts', // Updated table name
          filter: 'is_published=eq.true'
        },
        (payload) => {
          console.log('Realtime update for published posts:', payload);
          
          if (payload.eventType === 'INSERT' && (payload.new as BlogPost).is_published) {
            setPosts(prev => [payload.new as BlogPost, ...prev]);
            // Clear cache when new posts are added
            ClientCache.delete('published-posts');
          } else if (payload.eventType === 'UPDATE') {
            if ((payload.new as BlogPost).is_published) {
              setPosts(prev => {
                // Key is now 'post_id'
                const index = prev.findIndex(p => p.post_id === (payload.new as BlogPost).post_id);
                if (index >= 0) {
                  const newPosts = [...prev];
                  newPosts[index] = payload.new as BlogPost;
                  return newPosts;
                } else {
                  return [payload.new as BlogPost, ...prev];
                }
              });
            } else {
              // Post was unpublished, remove it
              // Key is now 'post_id'
              setPosts(prev => prev.filter(p => p.post_id !== (payload.old as BlogPost).post_id));
            }
            // Clear cache when posts are updated
            ClientCache.delete('published-posts');
          } else if (payload.eventType === 'DELETE') {
            // Key is now 'post_id'
            setPosts(prev => prev.filter(p => p.post_id !== (payload.old as BlogPost).post_id));
            // Clear cache when posts are deleted
            ClientCache.delete('published-posts');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { posts, loading, refetch: fetchPosts };
};

export const useAdminBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth(); // Assuming user is needed for author_id

  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      console.log('Fetching all posts for admin...');
      
      // Updated table name and schema to 'blog.posts'
      // Updated order by 'created_at' (column name in new DB)
      // Select all columns and join with user_profiles to get author_name
      const { data, error } = await supabase
        .from('blog.posts')
        .select(`
            *,
            author:blog_user_profiles(display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin posts:', error);
        toast({
          title: "Error",
          description: "Failed to load posts",
          variant: "destructive",
        });
        setPosts([]);
        return;
      }

      console.log('Fetched admin posts:', data);
      const mappedData: BlogPost[] = data.map((post: any) => ({
        ...post,
        author_name: post.author?.display_name || 'Unknown Author'
      }));
      setPosts(mappedData || []);
    } catch (error: any) {
      console.error('Error fetching admin posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: BlogPostInsert) => {
    try {
      console.log('Creating post:', postData);

      // Slug generation is now handled by a database trigger (blog.update_post_metadata)
      // Ensure author_id is explicitly passed based on the logged-in user
      const { data, error } = await supabase
        .from('blog.posts') // Updated table name and schema
        .insert({ 
          ...postData,
          author_id: user?.id // Assign logged-in user's ID as author_id
         })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPosts(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Blog post created successfully!",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePost = async (postId: string, updates: BlogPostUpdate) => {
    try {
      console.log('Updating post:', postId, updates);

      // Updated table name and schema to 'blog.posts'
      // Updated eq column to 'post_id'
      const { data, error } = await supabase
        .from('blog.posts')
        .update(updates)
        .eq('post_id', postId) // Updated column name
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state, key is now 'post_id'
      setPosts(prev => prev.map(post => 
        post.post_id === postId ? data : post
      ));
      
      toast({
        title: "Success",
        description: "Blog post updated successfully!",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update post",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      console.log('Deleting post:', postId);

      // Updated table name and schema to 'blog.posts'
      // Updated eq column to 'post_id'
      const { error } = await supabase
        .from('blog.posts')
        .delete()
        .eq('post_id', postId);

      if (error) {
        throw error;
      }

      // Update local state, key is now 'post_id'
      setPosts(prev => prev.filter(post => post.post_id !== postId));
      
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getPostById = async (postId: string): Promise<BlogPost | null> => {
    try {
      console.log('Fetching post by ID or slug:', postId);

      // Updated table name and schema to 'blog.posts'
      // Updated or condition to use 'post_id' or 'slug'
      // Select all columns and join with user_profiles to get author_name
      const { data, error } = await supabase
        .from('blog.posts')
        .select(`
            *,
            author:blog_user_profiles(display_name)
        `)
        .or(`post_id.eq.${postId},slug.eq.${postId}`)
        .single();

      if (error) {
        // PGRST116 means no rows found, which is fine, just return null
        if (error.code === 'PGRST116') {
          console.log('Post not found:', postId);
          return null;
        }
        throw error;
      }

      console.log('Post fetched successfully:', data);
      const mappedData: BlogPost = {
        ...data,
        author_name: (data as any).author?.display_name || 'Unknown Author'
      };
      return mappedData;
    } catch (error: any) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch post",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchAllPosts();

    // Set up realtime subscription for all posts (admin view)
    // Updated schema and table name
    const channel = supabase
      .channel('admin-blog-posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'blog', // Updated schema
          table: 'posts' // Updated table name
        },
        (payload) => {
          console.log('Realtime update for admin posts:', payload);
          
          if (payload.eventType === 'INSERT') {
            setPosts(prev => [payload.new as BlogPost, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Key is now 'post_id'
            setPosts(prev => prev.map(post => 
              post.post_id === (payload.new as BlogPost).post_id ? payload.new as BlogPost : post
            ));
          } else if (payload.eventType === 'DELETE') {
            // Key is now 'post_id'
            setPosts(prev => prev.filter(post => post.post_id !== (payload.old as BlogPost).post_id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    posts, 
    loading, 
    createPost, 
    updatePost, 
    deletePost, 
    getPostById,
    refetch: fetchAllPosts 
  };
};
