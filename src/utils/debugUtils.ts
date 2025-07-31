// Debug utilities for troubleshooting frontend and backend issues
import { supabase } from '@/integrations/supabase/client'; // Supabase client is updated

export class DebugUtils {
  private static isDebugMode = process.env.NODE_ENV === 'development';

  // Enhanced console logging with timestamps and context
  static log(context: string, message: string, data?: any) {
    if (!this.isDebugMode) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `🔍 [${timestamp}] [${context}]`;
    
    if (data !== undefined) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  static error(context: string, message: string, error?: any) {
    const timestamp = new Date().toISOString();
    const prefix = `❌ [${timestamp}] [${context}]`;
    
    if (error !== undefined) {
      console.error(`${prefix} ${message}`, error);
    } else {
      console.error(`${prefix} ${message}`);
    }
  }

  static warn(context: string, message: string, data?: any) {
    if (!this.isDebugMode) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `⚠️ [${timestamp}] [${context}]`;
    
    if (data !== undefined) {
      console.warn(`${prefix} ${message}`, data);
    } else {
      console.warn(`${prefix} ${message}`);
    }
  }

  // Test Supabase connection and permissions
  static async testSupabaseConnection() {
    try {
      this.log('DebugUtils', 'Testing Supabase connection...');
      
      // Test authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      this.log('DebugUtils', 'Auth test result:', { user: user?.email, error: authError });
      
      if (authError) {
        this.error('DebugUtils', 'Authentication failed:', authError);
        return { success: false, error: `Auth error: ${authError.message}` };
      }

      if (!user) {
        this.error('DebugUtils', 'No authenticated user found');
        return { success: false, error: 'No authenticated user' };
      }

      // New: Test database connection with a simple query from the new 'blog' schema
      // Test by selecting from 'blog.user_profiles'
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles') // Assumes default schema is 'blog' from client.ts
        .select('user_id, username') // Select specific columns from new schema
        .limit(1);

      this.log('DebugUtils', 'Profile table access test:', { data: profileData, error: profileError });

      if (profileError) {
        this.error('DebugUtils', 'Profile table access failed:', profileError);
        return { success: false, error: `Profile access error: ${profileError.message}` };
      }

      // New: Test blog posts table access
      const { data: postsData, error: postsError } = await supabase
        .from('posts') // Assumes default schema is 'blog'
        .select('post_id, title') // Select specific columns
        .limit(1);

      this.log('DebugUtils', 'Blog posts table access test:', { data: postsData, error: postsError });

      if (postsError) {
        this.error('DebugUtils', 'Blog posts table access failed:', postsError);
        return { success: false, error: `Blog posts access error: ${postsError.message}` };
      }

      this.log('DebugUtils', 'All Supabase tests passed successfully');
      return { success: true, user, profileData, postsData };

    } catch (error: any) {
      this.error('DebugUtils', 'Supabase connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Test component rendering and state
  static logComponentState(componentName: string, state: any) {
    if (!this.isDebugMode) return;
    
    this.log(componentName, 'Component state:', {
      ...state,
      timestamp: new Date().toISOString()
    });
  }

  // Performance monitoring
  static startTimer(label: string) {
    if (!this.isDebugMode) return;
    console.time(`⏱️ ${label}`);
  }

  static endTimer(label: string) {
    if (!this.isDebugMode) return;
    console.timeEnd(`⏱️ ${label}`);
  }

  // Network request monitoring
  static logNetworkRequest(url: string, method: string, data?: any) {
    if (!this.isDebugMode) return;
    
    this.log('Network', `${method} ${url}`, data);
  }

  static logNetworkResponse(url: string, status: number, data?: any) {
    if (!this.isDebugMode) return;
    
    if (status >= 200 && status < 300) {
      this.log('Network', `✅ ${status} ${url}`, data);
    } else {
      this.error('Network', `❌ ${status} ${url}`, data);
    }
  }

  // Browser environment checks
  static checkBrowserEnvironment() {
    if (!this.isDebugMode) return;
    
    const info = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof Storage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      webGL: !!window.WebGLRenderingContext,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    this.log('Browser', 'Environment check:', info);
    return info;
  }

  // Memory usage monitoring (if available)
  static checkMemoryUsage() {
    if (!this.isDebugMode) return;
    
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.log('Performance', 'Memory usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`
      });
    }
  }
}

// Global debug helper for console access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugUtils = DebugUtils;
}
