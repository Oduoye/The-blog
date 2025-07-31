export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [_ in never]: never // Public schema is empty as all app tables are in 'blog'
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  },
  blog: { // New: Define the 'blog' schema
    Tables: {
      user_profiles: {
        Row: {
          user_id: string
          username: string
          email: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          website_url: string | null
          is_creator: boolean | null
          is_admin: boolean | null
          is_suspended: boolean | null
          last_login: string | null
          created_at: string | null
          modified_at: string | null
        }
        Insert: {
          user_id: string
          username: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website_url?: string | null
          is_creator?: boolean | null
          is_admin?: boolean | null
          is_suspended?: boolean | null
          last_login?: string | null
          created_at?: string | null
          modified_at?: string | null
        }
        Update: {
          user_id?: string
          username?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website_url?: string | null
          is_creator?: boolean | null
          is_admin?: boolean | null
          is_suspended?: boolean | null
          last_login?: string | null
          created_at?: string | null
          modified_at?: string | null
        }
      }
      posts: {
        Row: {
          post_id: string
          author_id: string | null
          title: string
          slug: string
          excerpt: string | null
          content: string
          featured_image_url: string | null
          category: string | null
          tags: string[] | null
          reading_time_minutes: number | null
          is_published: boolean | null
          published_at: string | null
          meta_title: string | null
          meta_description: string | null
          views_count: number | null
          likes_count: number | null
          comments_count: number | null
          created_at: string | null
          modified_at: string | null
        }
        Insert: {
          post_id?: string
          author_id?: string | null
          title: string
          slug: string
          excerpt?: string | null
          content: string
          featured_image_url?: string | null
          category?: string | null
          tags?: string[] | null
          reading_time_minutes?: number | null
          is_published?: boolean | null
          published_at?: string | null
          meta_title?: string | null
          meta_description?: string | null
          views_count?: number | null
          likes_count?: number | null
          comments_count?: number | null
          created_at?: string | null
          modified_at?: string | null
        }
        Update: {
          post_id?: string
          author_id?: string | null
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string
          featured_image_url?: string | null
          category?: string | null
          tags?: string[] | null
          reading_time_minutes?: number | null
          is_published?: boolean | null
          published_at?: string | null
          meta_title?: string | null
          meta_description?: string | null
          views_count?: number | null
          likes_count?: number | null
          comments_count?: number | null
          created_at?: string | null
          modified_at?: string | null
        }
      }
      comments: {
        Row: {
          comment_id: string
          post_id: string | null
          author_id: string | null
          parent_comment_id: string | null
          content: string
          is_approved: boolean | null
          is_deleted: boolean | null
          created_at: string | null
          modified_at: string | null
        }
        Insert: {
          comment_id?: string
          post_id?: string | null
          author_id?: string | null
          parent_comment_id?: string | null
          content: string
          is_approved?: boolean | null
          is_deleted?: boolean | null
          created_at?: string | null
          modified_at?: string | null
        }
        Update: {
          comment_id?: string
          post_id?: string | null
          author_id?: string | null
          parent_comment_id?: string | null
          content?: string
          is_approved?: boolean | null
          is_deleted?: boolean | null
          created_at?: string | null
          modified_at?: string | null
        }
      }
      interactions: {
        Row: {
          interaction_id: string
          user_id: string | null
          post_id: string | null
          interaction_type: string
          visitor_id: string | null
          created_at: string | null
          modified_at: string | null
        }
        Insert: {
          interaction_id?: string
          user_id?: string | null
          post_id?: string | null
          interaction_type: string
          visitor_id?: string | null
          created_at?: string | null
          modified_at?: string | null
        }
        Update: {
          interaction_id?: string
          user_id?: string | null
          post_id?: string | null
          interaction_type?: string
          visitor_id?: string | null
          created_at?: string | null
          modified_at?: string | null
        }
      }
      promotions: { // Moved to 'blog' schema for consistency
        Row: {
          id: string
          title: string
          message: string
          button_text: string
          button_link: string
          image_url: string | null
          is_active: boolean | null
          display_rules: Json | null
          created_at: string | null
          modified_at: string | null // Renamed for consistency
        }
        Insert: {
          id?: string
          title: string
          message: string
          button_text: string
          button_link: string
          image_url?: string | null
          is_active?: boolean | null
          display_rules?: Json | null
          created_at?: string | null
          modified_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          message?: string
          button_text?: string
          button_link?: string
          image_url?: string | null
          is_active?: boolean | null
          display_rules?: Json | null
          created_at?: string | null
          modified_at?: string | null
        }
      }
      contact_settings: { // Moved to 'blog' schema for consistency
        Row: {
          id: string
          email: string | null
          phone: string | null
          address: string | null
          website: string | null
          description: string | null
          social_media: Json | null
          created_at: string | null
          modified_at: string | null // Renamed for consistency
        }
        Insert: {
          id?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
          description?: string | null
          social_media?: Json | null
          created_at?: string | null
          modified_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
          description?: string | null
          social_media?: Json | null
          created_at?: string | null
          modified_at?: string | null
        }
      }
      about_us_sections: { // Moved to 'blog' schema for consistency
        Row: {
          id: string
          title: string
          content: string
          section_type: string
          display_order: number
          is_active: boolean
          metadata: Json | null
          created_at: string | null
          modified_at: string | null // Renamed for consistency
        }
        Insert: {
          id?: string
          title: string
          content: string
          section_type?: string
          display_order?: number
          is_active?: boolean
          metadata?: Json | null
          created_at?: string | null
          modified_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          section_type?: string
          display_order?: number
          is_active?: boolean
          metadata?: Json | null
          created_at?: string | null
          modified_at?: string | null
        }
      }
    }
    Views: {
      popular_posts: {
        Row: {
          post_id: string
          title: string
          author_id: string | null
          author_name: string | null
          category: string | null
          views_count: number | null
          likes_count: number | null
          comments_count: number | null
          published_at: string | null
        }
      }
      recent_activity: {
        Row: {
          activity_type: string
          id: string
          title: string
          actor: string | null
          activity_time: string | null
        }
      }
    }
    Functions: {
      calculate_reading_time: {
        Args: { content: string }
        Returns: number
      }
      generate_unique_slug: {
        Args: { title: string }
        Returns: string
      }
      get_post_analytics: {
        Args: { target_post_id: string }
        Returns: {
          total_views: number
          total_likes: number
          total_comments: number
          avg_reading_time: number
          engagement_rate: number
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
