import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedComments } from "@/hooks/useOptimizedComments"; // This hook is already updated
import { useAnalytics } from "@/hooks/useAnalytics"; // This hook is already updated
import { PerformanceLogger, debounce } from "@/utils/performanceLogger";
import { User, Heart, Share, MessageSquare, Loader2, AlertCircle, RefreshCw, Edit, Trash2, Save, X } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext'; // New: Import useAuth to check current user for editing/author_id

interface OptimizedCommentsSectionProps {
  postId: string; // This is the blog.posts.post_id
  onLike?: () => void;
  onShare?: () => void;
  onComment?: () => void;
}

const OptimizedCommentsSection = ({ postId, onLike, onShare, onComment }: OptimizedCommentsSectionProps) => {
  const { toast } = useToast();
  const { user } = useAuth(); // Get current authenticated user
  const { trackPostEngagement } = useAnalytics();
  // useOptimizedComments hook is already updated to new schema
  const { engagement, likePost, sharePost, addComment, updateComment, deleteComment, canEditComment, clearGlobalCommentName, refetch } = useOptimizedComments(postId);
  
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null); // comment_id now
  const [editingContent, setEditingContent] = useState("");

  // Pre-fill author name if user has a global commenter name
  useState(() => {
    if (engagement.globalCommentName) {
      setAuthorName(engagement.globalCommentName);
    }
  });

  // Debounced handlers to prevent rapid clicking
  const debouncedLike = debounce(async () => {
    PerformanceLogger.startTimer('handleLike');
    try {
      await likePost();
      
      // Track like engagement in analytics
      await trackPostEngagement(postId, 'like', {
        timestamp: new Date().toISOString(),
        action: 'like_button_click',
        total_likes: engagement.likes + 1
      });
      
      if (onLike) onLike();
    } catch (error) {
      PerformanceLogger.logError('handleLike', error);
    } finally {
      PerformanceLogger.endTimer('handleLike');
    }
  }, 300);

  const debouncedShare = debounce(async () => {
    PerformanceLogger.startTimer('handleShare');
    try {
      await sharePost('button_click');
      
      // Track share engagement in analytics
      await trackPostEngagement(postId, 'share', {
        timestamp: new Date().toISOString(),
        action: 'share_button_click',
        total_shares: engagement.shares + 1,
        share_url: window.location.href
      });
      
      // Improved sharing with better error handling
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Check out this blog post",
            url: window.location.href
          });
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            // Fallback to clipboard
            await navigator.clipboard.writeText(window.location.href);
            toast({
              title: "Link copied!",
              description: "Post link copied to clipboard.",
            });
          }
        }
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Post link copied to clipboard.",
        });
      }
      
      if (onShare) onShare();
    } catch (error) {
      PerformanceLogger.logError('handleShare', error);
      toast({
        title: "Share completed",
        description: "The share action was recorded.",
      });
    } finally {
      PerformanceLogger.endTimer('handleShare');
    }
  }, 500);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }

    // New: If user is authenticated, we don't need authorName/Email input
    const isUserAuthenticated = !!user;

    if (!isUserAuthenticated && !authorName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass the user's ID if authenticated, otherwise authorName/Email for anonymous
      await addComment(
        isUserAuthenticated ? user.id : authorName.trim(), // Pass user.id if authenticated
        newComment.trim(),
        isUserAuthenticated ? user.email : (authorEmail.trim() || undefined) // Pass user.email if authenticated
      );
      
      // Track comment engagement in analytics
      await trackPostEngagement(postId, 'comment', {
        timestamp: new Date().toISOString(),
        action: 'comment_added',
        total_comments: engagement.comments.length + 1,
        comment_length: newComment.length
      });
      
      setNewComment("");
      if (!isUserAuthenticated && !engagement.globalCommentName) { // Only clear if not authenticated and not using global name
        setAuthorName("");
        setAuthorEmail("");
      }
      
      if (onComment) onComment();
    } catch (error) {
      // Error already handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment: any) => {
    setEditingCommentId(comment.comment_id); // Use comment_id
    setEditingContent(comment.content);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingContent.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateComment(commentId, editingContent);
      setEditingCommentId(null);
      setEditingContent("");
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      try {
        await deleteComment(commentId);
      } catch (error) {
        // Error already handled in hook
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const formatDate = (dateString: string) => {
    // New: Use modified_at if present for display, otherwise created_at
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state with better UX
  if (engagement.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading comments and engagement...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state with retry option
  if (engagement.isError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{engagement.errorMessage || 'Failed to load comments and engagement data.'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="ml-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Social Actions - Always responsive */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button 
                variant={engagement.hasUserLiked ? "default" : "ghost"} 
                onClick={debouncedLike}
                className={`flex items-center space-x-2 transition-all duration-200 ${
                  engagement.hasUserLiked ? 'bg-red-500 hover:bg-red-600 text-white' : ''
                }`}
                disabled={engagement.hasUserLiked}
              >
                <Heart className={`h-5 w-5 ${engagement.hasUserLiked ? 'fill-current' : ''}`} />
                <span>{engagement.likes}</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={debouncedShare}
                className="flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              >
                <Share className="h-5 w-5" />
                <span>{engagement.shares}</span>
              </Button>
              <div className="flex items-center space-x-2 text-gray-600">
                <MessageSquare className="h-5 w-5" />
                <span>{engagement.comments.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Comment - Always functional */}
      <Card>
        <CardHeader>
          <CardTitle>Leave a Comment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New: Only show name/email input if user is NOT authenticated and no global name is set */}
          {!user && !engagement.globalCommentName && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="authorName">Name *</Label>
                <Input
                  id="authorName"
                  type="text"
                  placeholder="Your name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorEmail">Email (optional)</Label>
                <Input
                  id="authorEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}
          
          {/* New: Display user's display_name if authenticated, otherwise use globalCommentName */}
          {user ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Commenting as:</strong> {user.user_metadata?.display_name || user.email}
                <span className="text-xs text-blue-600 ml-2">(Authenticated)</span>
              </p>
            </div>
          ) : (engagement.globalCommentName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Commenting as:</strong> {engagement.globalCommentName}
                <span className="text-xs text-blue-600 ml-2">(across all posts)</span>
              </p>
            </div>
          ))}
          
          <div className="space-y-2">
            <Label htmlFor="comment">Comment *</Label>
            <Textarea
              id="comment"
              placeholder="Write your comment here..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <Button 
            onClick={handleAddComment} 
            // New: Adjust disabled condition based on authenticated user or anonymous name/email
            disabled={isSubmitting || !newComment.trim() || (!user && !authorName.trim() && !engagement.globalCommentName)}
            className="flex items-center space-x-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isSubmitting ? "Posting..." : "Post Comment"}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Comments List */}
      {engagement.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comments ({engagement.comments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagement.comments.map((comment) => (
                // Comment ID is now comment_id
                <div key={comment.comment_id} className="flex space-x-3 pb-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-sm text-green-700 hover:text-green-800 transition-colors">
                        {/* Use author_name field from the mapped comment */}
                        {comment.author_name} 
                      </span>
                      {comment.author_id ? ( // New: Badge for authenticated users
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Reader
                        </span>
                      )}
                      {/* Use created_at or modified_at, modified_at is new */}
                      <span className="text-xs text-gray-500">{formatDate(comment.modified_at || comment.created_at!)}</span> 
                      {/* New: Display (edited) only if modified_at is different from created_at */}
                      {comment.modified_at && comment.modified_at !== comment.created_at && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>
                    
                    {editingCommentId === comment.comment_id ? ( // Use comment_id
                      <div className="space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          className="text-sm"
                          placeholder="Edit your comment..."
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateComment(comment.comment_id)} // Use comment_id
                            disabled={!editingContent.trim()}
                            className="flex items-center gap-1"
                          >
                            <Save className="h-3 w-3" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-700 text-sm leading-relaxed mb-2">{comment.content}</p>
                        
                        {/* Edit/Delete buttons for comment author */}
                        {canEditComment(comment) && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditComment(comment)}
                              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteComment(comment.comment_id)} // Use comment_id
                              className="h-6 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {engagement.comments.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No comments yet</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OptimizedCommentsSection;
