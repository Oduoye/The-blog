import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import BlogHeader from "@/components/BlogHeader";
import OptimizedCommentsSection from "@/components/OptimizedCommentsSection";
import SocialMediaLinks from "@/components/SocialMediaLinks";
import YouTubeModal from "@/components/YouTubeModal";
import EnhancedPromotionalPopup from "@/components/EnhancedPromotionalPopup";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { readingTimeTracker } from "@/lib/readingTimeTracker";
import { PerformanceLogger, ClientCache } from "@/utils/performanceLogger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Play } from "lucide-react";
import hljs from 'highlight.js';
import { safeSetTimeout, safeClearTimeout, safeSetInterval, safeClearInterval } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  author_id: string;
  author_name: string | null;
  category: string | null;
  tags: string[] | null;
  published_at: string | null;
  is_published: boolean | null;
  social_handles?: any;
  media_items?: any;
  created_at: string | null;
  updated_at: string | null;
}

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { trackPostEngagement } = useAnalytics();
  const { posts } = useBlogPosts();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [showNextPostSuggestion, setShowNextPostSuggestion] = useState(false);
  
  const [youtubeModal, setYoutubeModal] = useState<{isOpen: boolean, url: string, title?: string}>({
    isOpen: false,
    url: '',
    title: ''
  });

  useEffect(() => {
    const fetchPost = async () => {
      PerformanceLogger.startTimer('fetchPost');
      
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching post with ID:', id);
        setNavigationLoading(true);
        
        // Check cache first for better performance
        const cacheKey = `post-${id}`;
        const cachedPost = ClientCache.get(cacheKey);
        if (cachedPost) {
          PerformanceLogger.logInfo('Using cached post data', { id });
          setPost(cachedPost);
          setLoading(false);
          setNavigationLoading(false);
          return;
        }
        
        // Find post by ID or slug from the posts array
        const foundPost = posts.find(p => p.id === id || p.slug === id);
        
        if (!foundPost || !foundPost.is_published) {
          console.log('Post not found or not published');
          setPost(null);
        } else {
          console.log('Post fetched successfully:', foundPost);
          setPost(foundPost);
          
          // Cache the post for 5 minutes
          ClientCache.set(cacheKey, foundPost, 5 * 60 * 1000);
          
          // Start reading time tracking
          readingTimeTracker.startReading(foundPost.id);
          setReadingStartTime(Date.now());
          
          // Track post view with enhanced analytics
          await trackPostEngagement(foundPost.id, 'view', {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            referrer: document.referrer,
            page_url: window.location.href,
            post_title: foundPost.title,
            post_category: foundPost.category
          });
        }
      } catch (error) {
        console.error('Unexpected error fetching post:', error);
        toast({
          title: "Error",
          description: "Failed to load blog post. Please try refreshing the page.",
          variant: "destructive",
        });
        setPost(null);
      } finally {
        setLoading(false);
        setNavigationLoading(false);
        PerformanceLogger.endTimer('fetchPost');
      }
    };

    fetchPost();
  }, [id, posts, toast, trackPostEngagement]);

  // Track reading time and bounce rate on component unmount or navigation
  useEffect(() => {
    return () => {
      if (post && readingStartTime) {
        const readingSession = readingTimeTracker.endCurrentSession();
        
        if (readingSession && readingSession.duration && readingSession.duration > 0) {
          // Calculate bounce rate
          const isBounce = readingTimeTracker.calculateBounceRate(post.id);
          
          // Track reading time and bounce rate
          trackPostEngagement(post.id, 'reading_complete', {
            timestamp: new Date().toISOString(),
            reading_time: readingSession.duration,
            scroll_depth: readingSession.scrollDepth,
            interactions: readingSession.interactions,
            is_bounce: isBounce,
            session_data: readingTimeTracker.getSessionData()
          });
        }
      }
    };
  }, [post, readingStartTime, trackPostEngagement]);

  // Set up scroll listener for next post suggestion
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const threshold = 500; // Show suggestion when within 500px of bottom
      
      if (documentHeight - scrollPosition <= threshold) {
        setShowNextPostSuggestion(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize code highlighting and copy functionality
  useEffect(() => {
    if (post?.content) {
      // Highlight code blocks
      safeSetTimeout(() => {
        hljs.highlightAll();
      }, 100);

      // Add copy functionality to code blocks
      const addCopyFunctionality = () => {
        // Define the copy function globally so it can be called from onclick handlers
        (window as any).copyCodeToClipboard = async (button: HTMLButtonElement) => {
          try {
            const codeBlock = button.closest('.code-block-container')?.querySelector('code');
            if (codeBlock) {
              const codeText = codeBlock.textContent || '';
              await navigator.clipboard.writeText(codeText);
              
              // Visual feedback
              const originalContent = button.innerHTML;
              button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                Copied!
              `;
              button.classList.add('copied');
              
              setTimeout(() => {
                button.innerHTML = originalContent;
                button.classList.remove('copied');
              }, 2000);
              
              toast({
                title: "Copied!",
                description: "Code copied to clipboard",
              });
            }
          } catch (error) {
            console.error('Failed to copy code:', error);
            toast({
              title: "Copy failed",
              description: "Failed to copy code to clipboard",
              variant: "destructive",
            });
          }
        };
      };

      addCopyFunctionality();
    }
  }, [post?.content, toast]);

  // Track reading progress periodically
  useEffect(() => {
    if (!post) return;

    const interval = safeSetInterval(() => {
      const currentReadingTime = readingTimeTracker.getCurrentReadingTime();
      const scrollDepth = readingTimeTracker.getScrollDepth();
      
      // Send periodic updates every 30 seconds if user is actively reading
      if (currentReadingTime > 0 && currentReadingTime % 30000 < 1000) {
        trackPostEngagement(post.id, 'reading_progress', {
          timestamp: new Date().toISOString(),
          current_reading_time: currentReadingTime,
          scroll_depth: scrollDepth,
          is_active: document.visibilityState === 'visible'
        });
      }
    }, 1000); // Check every second

    return () => safeClearInterval(interval);
  }, [post, trackPostEngagement]);

  const handleLike = async () => {
    if (post) {
      await trackPostEngagement(post.id, 'like', {
        timestamp: new Date().toISOString(),
        action: 'like_button_click',
        post_title: post.title
      });
    }
  };

  const handleShare = async () => {
    if (post) {
      await trackPostEngagement(post.id, 'share', {
        timestamp: new Date().toISOString(),
        action: 'share_button_click',
        share_url: window.location.href,
        post_title: post.title
      });
    }
  };

  const handleComment = async () => {
    if (post) {
      await trackPostEngagement(post.id, 'comment', {
        timestamp: new Date().toISOString(),
        action: 'comment_added',
        post_title: post.title
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
          {navigationLoading && (
            <p className="mt-2 text-sm text-gray-500">This may take a moment on slower connections.</p>
          )}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
          <p className="text-gray-600 mb-6 sm:mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link to="/">
            <Button>← Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    // Check if date is in the future, use current date instead
    const now = new Date();
    const displayDate = date > now ? now : date;
    
    return displayDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMediaItem = (item: any) => {
    if (item.type === 'image') {
      return (
        <div className="my-4 sm:my-6">
          <img 
            src={item.url} 
            alt={item.caption || "Post image"} 
            className="w-full h-auto rounded-lg shadow-lg"
          />
          {item.caption && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">{item.caption}</p>
          )}
          {item.paragraphText && (
            <div 
              className="mt-4 prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: item.paragraphText }}
            />
          )}
        </div>
      );
    } else if (item.type === 'video') {
      const videoId = item.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return (
        <div className="my-4 sm:my-6">
          <div className="relative w-full group cursor-pointer" style={{ paddingBottom: '56.25%' }}>
            <div 
              className="absolute inset-0 bg-black rounded-lg overflow-hidden"
              onClick={() => setYoutubeModal({isOpen: true, url: item.url, title: item.caption})}
            >
              <img 
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 text-white fill-current" />
                </div>
              </div>
            </div>
          </div>
          {item.caption && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">{item.caption}</p>
          )}
          {item.paragraphText && (
            <div 
              className="mt-4 prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: item.paragraphText }}
            />
          )}
        </div>
      );
    }
    return null;
  };

  // Find next post in the same category
  const getNextPost = () => {
    if (!post || !posts.length) return null;
    
    // Filter posts by same category, excluding current post
    const sameCategoryPosts = posts.filter(p => 
      p.category === post.category && 
      p.id !== post.id &&
      p.is_published
    );
    
    if (sameCategoryPosts.length === 0) return null;
    
    // Sort by published date
    const sortedPosts = sameCategoryPosts.sort((a, b) => 
      new Date(a.published_at || a.created_at || '').getTime() - 
      new Date(b.published_at || b.created_at || '').getTime()
    );
    
    // Find current post index in sorted list
    const currentPostDate = new Date(post.published_at || post.created_at || '').getTime();
    const nextPost = sortedPosts.find(p => 
      new Date(p.published_at || p.created_at || '').getTime() > currentPostDate
    );
    
    // If no next post found, return the first post in category
    return nextPost || sortedPosts[0];
  };

  const nextPost = getNextPost();

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 sm:mb-8 transition-colors">
          ← Back to Blog
        </Link>

        {/* Article Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge variant="secondary">{post.category || "General"}</Badge>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500 text-sm">{formatDate(post.published_at || post.created_at)}</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-lg sm:text-xl text-gray-600 mb-4 sm:mb-6">
              {post.excerpt}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 sm:pb-6 gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-bold text-blue-800 text-sm sm:text-base hover:text-blue-900 transition-colors">
                    {post.author_name || "Unknown Author"}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Author
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  Published on {formatDate(post.published_at || post.created_at)}
                </p>
              </div>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Featured Image */}
        {post.image_url && (
          <div className="mb-6 sm:mb-8">
            <img 
              src={post.image_url} 
              alt={post.title}
              className="w-full h-48 sm:h-64 lg:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          {post.content ? (
            <div 
              className="prose prose-sm sm:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-h1:text-2xl prose-h1:font-bold prose-h1:mt-8 prose-h1:mb-4 prose-h2:text-xl prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-lg prose-h3:font-bold prose-h3:mt-4 prose-h3:mb-2 prose-table:w-full prose-table:border-collapse prose-table:my-6 prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:bg-gray-100 prose-th:font-semibold prose-th:text-left prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <p className="text-gray-600">No content available for this post.</p>
          )}
          
          {/* Additional Media Items */}
          {post.media_items && Array.isArray(post.media_items) && post.media_items.length > 0 && (
            <div className="mt-6 sm:mt-8">
              {post.media_items.map((item: any, index: number) => (
                <div key={item.id || index}>
                  {renderMediaItem(item)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Social Media Links */}
        {post.social_handles && (
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <SocialMediaLinks socialHandles={post.social_handles} />
          </div>
        )}

        {/* Comments and Social Interactions */}
        <OptimizedCommentsSection 
          postId={post.id} 
          onLike={handleLike}
          onShare={handleShare}
          onComment={handleComment}
        />

        {/* Article Footer */}
        <footer className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
          {/* Next Post Suggestion */}
          {showNextPostSuggestion && nextPost && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                📖 Continue Reading in {post.category}
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                    <Link to={`/post/${nextPost.id}`}>
                      {nextPost.title}
                    </Link>
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {nextPost.excerpt || "Continue exploring our content..."}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>By {nextPost.author_name || "Unknown Author"}</span>
                    <span>•</span>
                    <span>{formatDate(nextPost.published_at || nextPost.created_at)}</span>
                  </div>
                </div>
                {nextPost.image_url && (
                  <div className="w-full sm:w-24 h-16 sm:h-16 flex-shrink-0">
                    <img 
                      src={nextPost.image_url} 
                      alt={nextPost.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <Link to={`/post/${nextPost.id}`}>
                  <Button className="flex items-center gap-2">
                    📖 Read Next Post
                  </Button>
                </Link>
                <Link to={`/?category=${encodeURIComponent(post.category?.toLowerCase() || '')}`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    📂 More in {post.category}
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enjoyed this article?</h3>
              <div className="text-sm text-gray-600">
                Share it with your network and leave a comment below!
              </div>
            </div>
            <Link to="/">
              <Button className="w-full sm:w-auto">Read More Articles</Button>
            </Link>
          </div>
        </footer>
      </article>

      {/* YouTube Modal */}
      <YouTubeModal
        isOpen={youtubeModal.isOpen}
        onClose={() => setYoutubeModal({isOpen: false, url: '', title: ''})}
        videoUrl={youtubeModal.url}
        title={youtubeModal.title}
      />

      {/* Enhanced Promotional Popup */}
      <EnhancedPromotionalPopup currentPage="/post" />
    </div>
  );
};

export default BlogPost;