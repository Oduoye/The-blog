import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BlogHeader from "@/components/BlogHeader";
import EnhancedPostEditor from "@/components/EnhancedPostEditor";
import { useAdminBlogPosts } from "@/hooks/useBlogPosts";
import { uploadBlogImage } from "@/lib/imageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Star, Eye, EyeOff } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const categories = [
  "Technology",
  "Crypto",
  "News", 
  "Business",
  "Health",
  "Sports",
  "Entertainment",
  "Science",
  "Politics",
  "Travel",
  "Lifestyle",
  "Religion"
];

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
  paragraphText?: string;
}

const EditPost = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { updatePost, getPostById, deletePost } = useAdminBlogPosts();
  const isMobile = useIsMobile();
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    tags: "",
    image_url: "",
    is_published: false,
    featured: false,
    social_handles: {
      twitter: "",
      youtube: "",
      facebook: "",
      telegram: ""
    }
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "No post ID provided.",
          variant: "destructive",
        });
        navigate("/admin");
        return;
      }

      try {
        console.log('Fetching post for editing:', id);
        const post = await getPostById(id);
        
        if (!post) {
          toast({
            title: "Error",
            description: "Post not found.",
            variant: "destructive",
          });
          navigate("/admin");
          return;
        }

        console.log('Post fetched for editing:', post);
        
        // Populate form with existing post data
        setFormData({
          title: post.title,
          content: post.content || "",
          excerpt: post.excerpt || "",
          category: post.category || "",
          tags: post.tags ? post.tags.join(", ") : "",
          image_url: post.image_url || "",
          is_published: Boolean(post.is_published),
          featured: Boolean(post.featured),
          social_handles: {
            twitter: post.social_handles?.twitter || "",
            youtube: post.social_handles?.youtube || "",
            facebook: post.social_handles?.facebook || "",
            telegram: post.social_handles?.telegram || ""
          }
        });

        // Set media items if they exist
        if (post.media_items && Array.isArray(post.media_items)) {
          setMediaItems(post.media_items);
        }

      } catch (error) {
        console.error('Error fetching post:', error);
        toast({
          title: "Error",
          description: "Failed to load post for editing.",
          variant: "destructive",
        });
        navigate("/admin");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, getPostById, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in title and content.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !profile || !id) {
      toast({
        title: "Error",
        description: "Missing required information to update post.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Updating post with data:', {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        category: formData.category,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        image_url: formData.image_url,
        is_published: formData.is_published,
        featured: formData.featured,
        social_handles: formData.social_handles,
        media_items: mediaItems
      });

      const updates = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200) + "...",
        category: formData.category || "General",
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        image_url: formData.image_url,
        is_published: formData.is_published,
        featured: formData.featured,
        social_handles: Object.fromEntries(
          Object.entries(formData.social_handles).filter(([_, value]) => value.trim() !== "")
        ),
        media_items: mediaItems,
        updated_at: new Date().toISOString(),
        // Update published_at when publishing
        published_at: formData.is_published ? new Date().toISOString() : null
      };

      console.log('Sending update request for post ID:', id);
      await updatePost(id, updates);
      console.log('Post updated successfully, navigating to admin');
      
      // Reset hasChanges after successful save
      setHasChanges(false);
      
      toast({
        title: "Success",
        description: "Post updated successfully!",
      });
      
      navigate("/admin");
    } catch (error) {
      console.error('Error updating post:', error);
      // Error is already handled in the updatePost function
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        await deletePost(id);
        navigate("/admin");
      } catch (error) {
        // Error is already handled in the deletePost function
      }
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    console.log('Changing field:', field, 'to value:', value);
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_handles: {
        ...prev.social_handles,
        [platform]: value
      }
    }));
    setHasChanges(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input value so the same file can be selected again
    event.target.value = '';

    setIsUploading(true);
    try {
      const imageUrl = await uploadBlogImage(file);
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
      setHasChanges(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleContentChange = (content: string) => {
    console.log('Content changed, length:', content.length);
    setFormData(prev => ({ ...prev, content }));
    setHasChanges(true);
  };

  const handleMediaChange = (items: MediaItem[]) => {
    console.log('Media items changed, count:', items.length);
    setMediaItems(items);
    setHasChanges(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={item.caption || "YouTube video"}
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              allowFullScreen
            />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      <div className={`${!isMobile && showPreview ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Post</h1>
              <p className="text-gray-600">Update your blog post</p>
            </div>
            {!isMobile && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            )}
          </div>
          {hasChanges && (
            <div className="mt-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
              ⚠️ You have unsaved changes
            </div>
          )}
        </div>

        <div className={`${!isMobile && showPreview ? 'grid grid-cols-2 gap-8' : ''}`}>
          {/* Editor Section */}
          <Card className={`${showPreview && !isMobile ? 'h-fit relative z-10' : ''}`}>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Enter post title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  {profile?.is_admin ? (
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={formData.category}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500">
                        Category is locked to your specialization. Contact an admin to change it.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  placeholder="Separate tags with commas"
                />
              </div>

              {/* Featured Image Upload */}
              <div className="space-y-2">
                <Label>Featured Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {formData.image_url ? (
                    <div className="space-y-4">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => handleChange("image_url", "")}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <Button 
                            type="button" 
                            variant="outline" 
                            disabled={isUploading}
                            className="cursor-pointer"
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploading ? "Uploading..." : "Upload Image"}
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media Handles */}
              <div className="space-y-4">
                <Label>Social Media Handles (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="X (Twitter) handle"
                    value={formData.social_handles.twitter}
                    onChange={(e) => handleSocialChange("twitter", e.target.value)}
                  />
                  <Input
                    placeholder="YouTube channel"
                    value={formData.social_handles.youtube}
                    onChange={(e) => handleSocialChange("youtube", e.target.value)}
                  />
                  <Input
                    placeholder="Facebook profile"
                    value={formData.social_handles.facebook}
                    onChange={(e) => handleSocialChange("facebook", e.target.value)}
                  />
                  <Input
                    placeholder="Telegram username"
                    value={formData.social_handles.telegram}
                    onChange={(e) => handleSocialChange("telegram", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleChange("excerpt", e.target.value)}
                  placeholder="Brief description of the post"
                  rows={3}
                />
              </div>

              {/* Enhanced Post Editor */}
              <EnhancedPostEditor
                content={formData.content}
                mediaItems={mediaItems}
                onContentChange={handleContentChange}
                onMediaChange={handleMediaChange}
              />

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => {
                      console.log('Publish switch toggled to:', checked);
                      handleChange("is_published", checked);
                    }}
                    className="relative z-20"
                  />
                  <Label htmlFor="published" className="relative z-20">Published</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => {
                      console.log('Featured switch toggled to:', checked);
                      handleChange("featured", checked);
                    }}
                    className="relative z-20"
                  />
                  <Label htmlFor="featured" className="flex items-center gap-2 relative z-20">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Mark as Featured
                  </Label>
                </div>
              </div>

                <div className="flex gap-4 pt-4 border-t relative z-20">
                  <Button type="submit" disabled={isSubmitting || !hasChanges}>
                    {isSubmitting ? "Updating..." : hasChanges ? "Update Post" : "No Changes"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/admin")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    Delete Post
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview Section - Desktop Only */}
          {!isMobile && showPreview && (
            <Card className="sticky top-8 h-fit max-h-[calc(100vh-4rem)] overflow-y-auto relative z-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-0">
                <article className="prose prose-sm max-w-none">
                  {/* Post Header */}
                  <div className="mb-6">
                    {formData.category && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {formData.category}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500 text-sm">{formatDate(new Date().toISOString())}</span>
                      </div>
                    )}
                    
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">
                      {formData.title || "Your Post Title"}
                    </h1>
                    
                    {formData.excerpt && (
                      <p className="text-lg text-gray-600 mb-4">
                        {formData.excerpt}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-bold text-blue-800 text-sm">
                            {profile?.display_name || profile?.email || "Author"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Published on {formatDate(new Date().toISOString())}
                          </p>
                        </div>
                      </div>
                      
                      {formData.tags && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.split(",").map((tag, index) => (
                            tag.trim() && (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {tag.trim()}
                              </span>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Featured Image */}
                  {formData.image_url && (
                    <div className="mb-6">
                      <img 
                        src={formData.image_url} 
                        alt={formData.title || "Featured image"}
                        className="w-full h-48 object-cover rounded-lg shadow-lg"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="bg-white rounded-lg border p-4 mb-6">
                    {formData.content ? (
                      <div 
                        className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600"
                        dangerouslySetInnerHTML={{ __html: formData.content }}
                      />
                    ) : (
                      <p className="text-gray-500 italic">Start writing your content to see the preview...</p>
                    )}
                    
                    {/* Media Items Preview */}
                    {mediaItems && mediaItems.length > 0 && (
                      <div className="mt-6">
                        {mediaItems.map((item, index) => (
                          <div key={item.id || index}>
                            {renderMediaItem(item)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Social Media Links Preview */}
                  {(formData.social_handles.twitter || formData.social_handles.youtube || 
                    formData.social_handles.facebook || formData.social_handles.telegram) && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect with the Author</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.social_handles.twitter && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            Twitter: @{formData.social_handles.twitter}
                          </span>
                        )}
                        {formData.social_handles.youtube && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                            YouTube: {formData.social_handles.youtube}
                          </span>
                        )}
                        {formData.social_handles.facebook && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            Facebook: {formData.social_handles.facebook}
                          </span>
                        )}
                        {formData.social_handles.telegram && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            Telegram: @{formData.social_handles.telegram}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Indicators */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${formData.is_published ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span>{formData.is_published ? 'Published' : 'Draft'}</span>
                    </div>
                    {formData.featured && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>Featured post</span>
                      </div>
                    )}
                  </div>
                </article>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditPost;