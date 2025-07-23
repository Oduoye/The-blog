import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import BlogHeader from "@/components/BlogHeader";
import BlogPostCard from "@/components/BlogPostCard";
import FeaturedPostsCarousel from "@/components/FeaturedPostsCarousel";
import ContactForm from "@/components/ContactForm";
import BlogFooter from "@/components/BlogFooter";
import EnhancedPromotionalPopup from "@/components/EnhancedPromotionalPopup";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { PerformanceLogger, ClientCache, debounce } from "@/utils/performanceLogger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { posts, loading } = useBlogPosts();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [displayedPosts, setDisplayedPosts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const categories = ["all", ...Array.from(new Set(posts.map(post => post.category || "").filter(Boolean)))];
  
  // Posts per page based on device
  const postsPerPage = isMobile ? 10 : 15;
  
  // Handle URL category parameter
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);
  
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.excerpt || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.content || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || 
                           (post.category && post.category.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // Optimized category change handler
  const handleCategoryChange = (category: string) => {
    PerformanceLogger.logInfo('Category changed', { from: selectedCategory, to: category });
    setSelectedCategory(category);
    
    // Update URL parameter
    if (category === "all") {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  // Update displayed posts when filters change
  useEffect(() => {
    const startIndex = 0;
    const endIndex = currentPage * postsPerPage;
    setDisplayedPosts(filteredPosts.slice(startIndex, endIndex));
  }, [filteredPosts, currentPage, postsPerPage]);

  // Reset pagination when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Handle initial load completion to prevent carousel delay on mobile
  useEffect(() => {
    PerformanceLogger.startTimer('initial-load');
    
    if (!loading && posts.length > 0) {
      // Small delay to ensure DOM is ready, especially on mobile
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        PerformanceLogger.endTimer('initial-load');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, posts.length]);

  const loadMorePosts = () => {
    setCurrentPage(prev => prev + 1);
  };

  const hasMorePosts = displayedPosts.length < filteredPosts.length;

  // Show loading with timeout protection
  if (loading || isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
          {loading && (
            <p className="mt-2 text-sm text-gray-500">If this takes too long, there might be a connection issue.</p>
          )}
          {loading && (
            <p className="mt-2 text-sm text-gray-500">If this takes too long, there might be a database connection issue.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-bounce-in enhanced-gradient-text animate-pulse-glow">
            Welcome to Nonce Firewall Blogs
          </h1>
          <p className="text-base sm:text-lg md:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 animate-fade-in px-4">
            Stay secure with cybersecurity insights, tech news, and industry updates
          </p>
          <div className="max-w-sm sm:max-w-md mx-auto px-4">
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/70 backdrop-blur-sm w-full"
            />
          </div>
        </div>
      </section>

      {/* Featured Posts Carousel - Only show if there are featured posts */}
      <FeaturedPostsCarousel posts={posts.map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt || "",
        content: post.content || "",
        author: post.author_name || "Unknown",
        authorId: post.author_id,
        category: post.category || "General",
        tags: post.tags || [],
        imageUrl: post.image_url || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop",
        publishedAt: post.published_at || post.created_at || new Date().toISOString(),
        published: post.is_published || false,
        featured: post.featured || false,
        mediaItems: post.media_items || [],
        socialHandles: post.social_handles || {}
      }))} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Category Filter - Only show if there are posts */}
        {posts.length > 0 && (
          <div className="mb-6 sm:mb-8 animate-fade-in">
            {categories.length > 7 ? (
              // Scrollable horizontal layout for many categories
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pb-2 min-w-max">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategoryChange(category)}
                      className="capitalize text-xs sm:text-sm transition-all duration-200 hover:scale-105 whitespace-nowrap flex-shrink-0"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              // Flex wrap layout for fewer categories
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryChange(category)}
                    className="capitalize text-xs sm:text-sm transition-all duration-200 hover:scale-105"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posts Grid or Empty State */}
        {posts.length === 0 ? (
          <div className="text-center py-16 sm:py-24 px-4">
            <div className="max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No posts yet</h3>
              <p className="text-gray-600 mb-8">
                Welcome to Nonce Firewall Blogs! We're just getting started. 
                Check back soon for cybersecurity insights, tech news, and industry updates.
              </p>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <strong>Admin:</strong> Ready to publish your first post? 
                  <br />
                  <a href="/secure-admin" className="underline hover:text-blue-600">
                    Sign in to the admin panel
                  </a> to get started.
                </p>
              </div>
            </div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-8">
            {/* Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 animate-fade-in">
              {displayedPosts.map((post) => (
                <div key={post.id} className="animate-fade-in hover:scale-105 transition-transform duration-300">
                  <BlogPostCard post={post} />
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMorePosts && (
              <div className="text-center animate-fade-in">
                <Button 
                  onClick={loadMorePosts}
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 transition-all duration-200 hover:scale-105"
                >
                  Load More Posts ({filteredPosts.length - displayedPosts.length} remaining)
                </Button>
              </div>
            )}

            {/* Posts Counter */}
            <div className="text-center text-sm text-gray-500 animate-fade-in">
              Showing {displayedPosts.length} of {filteredPosts.length} posts
              {isMobile ? ' (10 per load on mobile)' : ' (15 per load on desktop)'}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 px-4 animate-fade-in">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
            {searchTerm && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-blue-800 text-sm">
                  <strong>Search tip:</strong> Try searching for keywords in titles, content, or tags. 
                  You can also filter by category using the buttons above.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Contact Form */}
      <ContactForm />

      {/* Blog Footer */}
      <BlogFooter />

      {/* Enhanced Promotional Popup */}
      <EnhancedPromotionalPopup currentPage="/" />
    </div>
  );
};

export default Index;