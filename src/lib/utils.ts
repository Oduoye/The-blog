import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe timer utilities to avoid WebContainer timer issues
export const safeSetTimeout = (callback: () => void, delay: number): number => {
  try {
    return setTimeout(callback, delay);
  } catch (error) {
    console.warn('Timer error, falling back to immediate execution:', error);
    // Fallback to immediate execution if timer fails
    callback();
    return 0;
  }
};

export const safeClearTimeout = (timeoutId: number | undefined): void => {
  try {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.warn('Clear timeout error:', error);
  }
};

export const safeSetInterval = (callback: () => void, delay: number): number => {
  try {
    return setInterval(callback, delay);
  } catch (error) {
    console.warn('Interval error, falling back to single execution:', error);
    // Fallback to single execution if interval fails
    callback();
    return 0;
  }
};

export const safeClearInterval = (intervalId: number | undefined): void => {
  try {
    if (intervalId) {
      clearInterval(intervalId);
    }
  } catch (error) {
    console.warn('Clear interval error:', error);
  }
};

// Debounce utility with safe timer handling
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;
  
  return (...args: Parameters<T>) => {
    safeClearTimeout(timeoutId);
    timeoutId = safeSetTimeout(() => func(...args), wait);
  };
}

// Throttle utility with safe timer handling
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      safeSetTimeout(() => inThrottle = false, limit);
    }
  };
}

// Format date utility
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}