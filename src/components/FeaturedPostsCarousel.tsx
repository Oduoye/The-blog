import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlogPost } from "@/lib/blogStore";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

interface FeaturedPostsCarouselProps {
  posts: BlogPost[];
}

const FeaturedPostsCarousel = ({ posts }: FeaturedPostsCarouselProps) => {
  // Create autoplay plugin with faster 2-second interval
  const plugin = useRef(
    Autoplay({ 
      delay: 2000, // 2 seconds instead of 5
      stopOnInteraction: true,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    })
  );

  const formatDate = (dateString: string) => {
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

  // Filter only featured posts
  const featuredPosts = posts.filter(post => post.featured);

  // If no featured posts, don't render the carousel
  if (featuredPosts.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-br from-blue-50 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Featured Posts</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Discover our latest insights and trending topics
          </p>
        </div>
        
        <Carousel 
          className="w-full max-w-5xl mx-auto"
          plugins={[plugin.current]}
          opts={{
            align: "start",
            loop: true,
            skipSnaps: false,
            dragFree: false,
            duration: 20, // Faster transition duration
          }}
          onMouseEnter={() => plugin.current.stop()}
          onMouseLeave={() => plugin.current.play()}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {featuredPosts.slice(0, 8).map((post) => (
              <CarouselItem key={post.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <Card className="group hover:shadow-xl transition-all duration-300 h-full">
                  <Link to={`/post/${post.id}`}>
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="eager" // Prioritize loading for featured images
                      />
                    </div>
                  </Link>
                  
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                      <Badge variant="default" className="text-xs bg-yellow-500 text-yellow-900">
                        Featured
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                    
                    <Link to={`/post/${post.id}`}>
                      <h3 className="text-base sm:text-lg font-bold leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                    </Link>
                    
                    <p className="text-gray-600 line-clamp-3 text-sm mb-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="text-sm text-blue-700 font-bold truncate hover:text-blue-800 transition-colors">
                          {post.author}
                        </span>
                      </div>
                      <Link 
                        to={`/post/${post.id}`}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors whitespace-nowrap ml-2"
                      >
                        Read more →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden sm:block">
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default FeaturedPostsCarousel;