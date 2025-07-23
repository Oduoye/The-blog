// Performance logging utility for debugging and monitoring
import { safeJsonParse, safePropertyAccess } from './safeEvalAlternatives';

export class PerformanceLogger {
  private static timers: Map<string, number> = new Map();
  private static enabled = process.env.NODE_ENV === 'development';

  static startTimer(label: string): void {
    if (!this.enabled) return;
    this.timers.set(label, performance.now());
    console.time(label);
  }

  static endTimer(label: string): number {
    if (!this.enabled) return 0;
    
    const startTime = this.timers.get(label);
    const endTime = performance.now();
    const duration = startTime ? endTime - startTime : 0;
    
    console.timeEnd(label);
    this.timers.delete(label);
    
    if (duration > 100) {
      console.warn(`⚠️ Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static logError(context: string, error: any, additionalData?: any): void {
    if (!this.enabled) return;
    
    console.error(`❌ Error in ${context}:`, error);
    if (additionalData) {
      // Safely log additional data without using eval or dynamic code execution
      try {
        console.error('Additional context:', JSON.stringify(additionalData, null, 2));
      } catch (e) {
        console.error('Additional context (raw):', additionalData);
      }
    }
  }

  static logWarning(message: string, data?: any): void {
    if (!this.enabled) return;
    
    console.warn(`⚠️ ${message}`, data);
  }

  static logInfo(message: string, data?: any): void {
    if (!this.enabled) return;
    
    console.info(`ℹ️ ${message}`, data);
  }
}

// Cache utility for client-side data caching
export class ClientCache {
  private static cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  static set(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  static get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    // Safely return cached data
    try {
      return typeof item.data === 'string' ? safeJsonParse(item.data) || item.data : item.data;
    } catch (error) {
      console.warn('Error retrieving cached data:', error);
      return item.data;
    }
  }
  
  static clear(): void {
    this.cache.clear();
  }
  
  static delete(key: string): void {
    this.cache.delete(key);
  }
}