// Reading time and session tracking utilities
export interface ReadingSession {
  postId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  scrollDepth: number;
  isActive: boolean;
  interactions: number; // clicks, scrolls, etc.
}

export interface SessionData {
  sessionId: string;
  startTime: number;
  pagesViewed: string[];
  totalReadingTime: number;
  interactions: number;
  lastActivity: number;
}

class ReadingTimeTracker {
  private currentSession: ReadingSession | null = null;
  private sessionData: SessionData | null = null;
  private scrollDepth = 0;
  private maxScrollDepth = 0;
  private isVisible = true;
  private interactionCount = 0;
  private lastActivity = Date.now();
  private inactivityTimer: number | null = null;
  private readonly INACTIVITY_THRESHOLD = 30000; // 30 seconds
  private readonly MIN_READING_TIME = 5000; // 5 seconds minimum to count as valid reading

  constructor() {
    this.initializeSession();
    this.setupEventListeners();
  }

  private initializeSession(): void {
    // Get or create session data
    const existingSession = sessionStorage.getItem('reading_session');
    if (existingSession) {
      try {
        this.sessionData = JSON.parse(existingSession);
      } catch (error) {
        console.error('Error parsing session data:', error);
        this.createNewSession();
      }
    } else {
      this.createNewSession();
    }
  }

  private createNewSession(): void {
    this.sessionData = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      startTime: Date.now(),
      pagesViewed: [],
      totalReadingTime: 0,
      interactions: 0,
      lastActivity: Date.now()
    };
    this.saveSession();
  }

  private saveSession(): void {
    if (this.sessionData) {
      try {
        sessionStorage.setItem('reading_session', JSON.stringify(this.sessionData));
      } catch (error) {
        console.error('Error saving session data:', error);
      }
    }
  }

  private setupEventListeners(): void {
    // Track page visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Track user interactions
    document.addEventListener('scroll', this.handleScroll.bind(this));
    document.addEventListener('click', this.handleInteraction.bind(this));
    document.addEventListener('keydown', this.handleInteraction.bind(this));
    document.addEventListener('mousemove', this.handleInteraction.bind(this));
    
    // Track page unload
    window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
    
    // Track focus/blur
    window.addEventListener('focus', this.handleFocus.bind(this));
    window.addEventListener('blur', this.handleBlur.bind(this));
  }

  private handleVisibilityChange(): void {
    this.isVisible = !document.hidden;
    if (this.isVisible) {
      this.resetInactivityTimer();
    } else {
      this.clearInactivityTimer();
    }
  }

  private handleScroll(): void {
    this.handleInteraction();
    
    // Calculate scroll depth
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollDepth = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;
    this.maxScrollDepth = Math.max(this.maxScrollDepth, this.scrollDepth);
  }

  private handleInteraction(): void {
    this.interactionCount++;
    this.lastActivity = Date.now();
    
    if (this.sessionData) {
      this.sessionData.interactions++;
      this.sessionData.lastActivity = this.lastActivity;
      this.saveSession();
    }
    
    this.resetInactivityTimer();
  }

  private handleFocus(): void {
    this.isVisible = true;
    this.resetInactivityTimer();
  }

  private handleBlur(): void {
    this.isVisible = false;
    this.clearInactivityTimer();
  }

  private handlePageUnload(): void {
    this.endCurrentSession();
  }

  private resetInactivityTimer(): void {
    this.clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      this.isVisible = false;
    }, this.INACTIVITY_THRESHOLD);
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  public startReading(postId: string): void {
    console.log('📖 Starting reading session for post:', postId);
    
    // End previous session if exists
    if (this.currentSession) {
      this.endCurrentSession();
    }

    // Start new reading session
    this.currentSession = {
      postId,
      startTime: Date.now(),
      scrollDepth: 0,
      isActive: true,
      interactions: 0
    };

    // Add to session pages viewed
    if (this.sessionData && !this.sessionData.pagesViewed.includes(postId)) {
      this.sessionData.pagesViewed.push(postId);
      this.saveSession();
    }

    // Reset tracking variables
    this.scrollDepth = 0;
    this.maxScrollDepth = 0;
    this.interactionCount = 0;
    this.resetInactivityTimer();
  }

  public endCurrentSession(): ReadingSession | null {
    if (!this.currentSession) {
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - this.currentSession.startTime;

    // Only count as valid reading if minimum time threshold is met and user was active
    const isValidReading = duration >= this.MIN_READING_TIME && 
                          this.interactionCount > 0 && 
                          this.maxScrollDepth > 10; // At least 10% scroll

    const completedSession: ReadingSession = {
      ...this.currentSession,
      endTime,
      duration: isValidReading ? duration : 0,
      scrollDepth: this.maxScrollDepth,
      isActive: false,
      interactions: this.interactionCount
    };

    console.log('📖 Ending reading session:', {
      postId: completedSession.postId,
      duration: completedSession.duration,
      scrollDepth: completedSession.scrollDepth,
      interactions: completedSession.interactions,
      isValidReading
    });

    // Update session data
    if (this.sessionData && isValidReading) {
      this.sessionData.totalReadingTime += duration;
      this.saveSession();
    }

    this.currentSession = null;
    this.clearInactivityTimer();

    return completedSession;
  }

  public getCurrentReadingTime(): number {
    if (!this.currentSession || !this.isVisible) {
      return 0;
    }

    return Date.now() - this.currentSession.startTime;
  }

  public getScrollDepth(): number {
    return this.maxScrollDepth;
  }

  public getSessionData(): SessionData | null {
    return this.sessionData;
  }

  public calculateBounceRate(postId: string): boolean {
    // A bounce is defined as:
    // 1. User viewed only one page in the session
    // 2. Reading time is less than 30 seconds
    // 3. Scroll depth is less than 25%
    // 4. Very few interactions (less than 3)

    if (!this.sessionData || !this.currentSession) {
      return true; // Default to bounce if no data
    }

    const isSinglePageSession = this.sessionData.pagesViewed.length === 1;
    const hasLowEngagement = this.getCurrentReadingTime() < 30000; // Less than 30 seconds
    const hasLowScrollDepth = this.maxScrollDepth < 25; // Less than 25% scroll
    const hasLowInteractions = this.interactionCount < 3;

    const isBounce = isSinglePageSession && (hasLowEngagement || hasLowScrollDepth || hasLowInteractions);

    console.log('📊 Bounce rate calculation:', {
      postId,
      isSinglePageSession,
      readingTime: this.getCurrentReadingTime(),
      scrollDepth: this.maxScrollDepth,
      interactions: this.interactionCount,
      isBounce
    });

    return isBounce;
  }

  public cleanup(): void {
    this.endCurrentSession();
    this.clearInactivityTimer();
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    document.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('click', this.handleInteraction.bind(this));
    document.removeEventListener('keydown', this.handleInteraction.bind(this));
    document.removeEventListener('mousemove', this.handleInteraction.bind(this));
    window.removeEventListener('beforeunload', this.handlePageUnload.bind(this));
    window.removeEventListener('focus', this.handleFocus.bind(this));
    window.removeEventListener('blur', this.handleBlur.bind(this));
  }
}

// Create singleton instance
export const readingTimeTracker = new ReadingTimeTracker();

// Utility functions
export const formatReadingTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
};

export const formatBounceRate = (rate: number): string => {
  return `${rate.toFixed(1)}%`;
};