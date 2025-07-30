// src/pages/CreatePost.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import DOMPurify from 'dompurify'; // Add this import

// ... (categories and MediaItem interface remain the same)

const CreatePost = () => {
  // ... (existing state and hooks)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ... (existing validation)

    setIsSubmitting(true);

    try {
      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Sanitize HTML content before saving
      const sanitizedContent = DOMPurify.sanitize(formData.content); //
      const sanitizedMediaItems = mediaItems.map(item => ({
        ...item,
        paragraphText: item.paragraphText ? DOMPurify.sanitize(item.paragraphText) : item.paragraphText //
      }));

      const postData = {
        title: formData.title,
        slug: slug,
        content: sanitizedContent, // Use sanitized content
        excerpt: formData.excerpt || formData.content.substring(0, 200) + "...",
        author_name: profile.display_name || profile.email || "Unknown Author",
        author_id: user.id,
        category: formData.category || profile.specialized_category || "General",
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        image_url: formData.image_url,
        is_published: formData.is_published,
        featured: formData.featured,
        published_at: formData.is_published ? new Date().toISOString() : null,
        social_handles: Object.fromEntries(
          Object.entries(formData.social_handles).filter(([_, value]) => value.trim() !== "")
        ),
        media_items: sanitizedMediaItems // Use sanitized media items
      };

      await createPost(postData);
      navigate("/admin");
    } catch (error) {
      // Error is already handled in the createPost function
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (rest of the component)

  // When updating content in EnhancedPostEditor, ensure it's sanitized before passing to state
  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content })); // Sanitization handled on submit, or you can sanitize here too.
    setHasChanges(true);
  };

  const handleMediaChange = (items: MediaItem[]) => {
    // Sanitization handled on submit, or you can sanitize here too.
    setMediaItems(items);
    setHasChanges(true);
  };

  // ... (rest of the component)
};

export default CreatePost;
