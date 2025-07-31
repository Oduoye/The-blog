import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics"; // useAnalytics is updated
import { PerformanceLogger } from "@/utils/performanceLogger";
import type { Database } from '@/integrations/supabase/types'; // New: Import Database type

interface EnhancedPromotionalPopupProps {
  currentPage?: string;
}

// Define Promotion type from new schema
type Promotion = Database['blog']['Tables']['promotions']['Row'];

const EnhancedPromotionalPopup = ({ currentPage = '/' }: EnhancedPromotionalPopupProps) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]); // Use Promotion type
  const [currentPromotionIndex, setCurrentPromotionIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { trackPromotionEngagement } = useAnalytics();
  
  // Refs for managing timers
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const displayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration
  const ROTATION_INTERVAL = 8000; // 8 seconds between promotions
  const BASE_DISPLAY_DURATION = 15000; // Base 15 seconds for single promotion
  const INITIAL_DELAY = 2000; // 2 seconds before first show
  const REFRESH_DELAY = 30000; // 30 seconds before auto-refresh after hide
  const TRANSITION_DURATION = 500; // Animation duration in ms

  // Calculate dynamic display duration based on number of promotions
  const calculateDisplayDuration = (promotionCount: number) => {
    if (promotionCount <= 1) {
      return BASE_DISPLAY_DURATION; // 15 seconds for single promotion
    }
    
    // For multiple promotions: ensure all can be shown at least once
    // Add extra time for smooth transitions and user interaction
    const timeForAllPromotions = promotionCount * ROTATION_INTERVAL;
    const bufferTime = 5000; // 5 seconds buffer for user interaction
    
    return Math.max(BASE_DISPLAY_DURATION, timeForAllPromotions + bufferTime);
  };

  // Generate session ID for tracking
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    setSessionId(newSessionId);
  }, []);

  // Simple function to check if promotion should show based on frequency
  const shouldShowPromotion = (promotion: Promotion) => { // Use Promotion type
    const frequency = (promotion.display_rules as any)?.show_frequency || 'session';
    const storageKey = `promotion_${promotion.id}_shown_${sessionId}`;
    
    switch (frequency) {
      case 'once':
        return !localStorage.getItem(`promotion_${promotion.id}_shown_permanent`);
      case 'session':
        return !sessionStorage.getItem(storageKey);
      case 'always':
        return true;
      default:
        return true;
    }
  };

  // Mark promotion as shown
  const markPromotionShown = (promotion: Promotion) => { // Use Promotion type
    const frequency = (promotion.display_rules as any)?.show_frequency || 'session';
    const storageKey = `promotion_${promotion.id}_shown_${sessionId}`;
    
    switch (frequency) {
      case 'once':
        localStorage.setItem(`promotion_${promotion.id}_shown_permanent`, 'true');
        break;
      case 'session':
        sessionStorage.setItem(storageKey, 'true');
        break;
      // For 'always', we don't store anything
    }
  };

  // Load promotions directly from database
  const loadPromotions = async () => {
    try {
      console.log('🔍 Loading promotions for rotation...');
      setIsLoading(true);
      
      // Updated table name and schema to 'blog.promotions'
      // Updated order by 'created_at' (column name in new DB)
      const { data: promotions, error } = await supabase
        .from('blog.promotions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching promotions:', error);
        return;
      }

      console.log('📋 Raw promotions from database:', promotions);
      
      if (!promotions || promotions.length === 0) {
        console.log('❌ No active promotions found');
        setPromotions([]);
        return;
      }

      // Filter promotions that should be shown
      const validPromotions = promotions.filter(promo => {
        console.log('🔍 Checking promotion:', promo.title);
        
        // Check if this promotion should be shown
        if (shouldShowPromotion(promo)) {
          console.log('✅ Valid promotion:', promo.title);
          return true;
        } else {
          console.log('❌ Promotion already shown:', promo.title);
          return false;
        }
      });
      
      console.log(`✅ Found ${validPromotions.length} valid promotions for rotation`);
      console.log(`⏱️ Display duration will be: ${calculateDisplayDuration(validPromotions.length)}ms`);
      setPromotions(validPromotions);
      
      // Reset current index if it's out of bounds
      if (validPromotions.length > 0) {
        setCurrentPromotionIndex(0);
        
        // Track view for the first promotion
        await trackPromotionEngagement(validPromotions[0].id, 'view', {
          timestamp: new Date().toISOString(),
          page: currentPage,
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          total_promotions: validPromotions.length,
          promotion_index: 0,
          session_id: sessionId
        });
      }
      
    } catch (error) {
      console.error('❌ Error loading promotions:', error);
      setPromotions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    console.log('📡 Setting up realtime subscription for promotion rotation...');
    
    // Updated schema and table name
    const channel = supabase
      .channel('promotional-popup-rotation-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'blog', // Updated schema
          table: 'promotions' // Updated table name
        },
        (payload) => {
          console.log('📡 Realtime promotion update for rotation:', payload);
          // Reload promotions when there's a change
          loadPromotions();
        }
      )
      .subscribe((status) => {
        console.log('📡 Rotation realtime subscription status:', status);
      });

    return () => {
      console.log('📡 Cleaning up rotation realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    if (sessionId) {
      loadPromotions();
    }
  }, [sessionId]);

  // Enhanced rotation logic with smooth animation
  const rotateToNext = async () => {
    if (promotions.length <= 1 || !isVisible || rotationPaused) return;

    const nextIndex = (currentPromotionIndex + 1) % promotions.length;
    console.log(`🔄 Rotating to promotion ${nextIndex + 1}/${promotions.length}`);
    
    // Start transition animation
    setIsTransitioning(true);
    
    // Wait for fade out
    setTimeout(async () => {
      setCurrentPromotionIndex(nextIndex);
      
      // Track view for the new promotion
      if (promotions[nextIndex]) {
        await trackPromotionEngagement(promotions[nextIndex].id, 'view', {
          timestamp: new Date().toISOString(),
          page: currentPage,
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          total_promotions: promotions.length,
          promotion_index: nextIndex,
          rotation_event: true,
          session_id: sessionId
        });
      }
      
      // End transition animation
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50); // Small delay to ensure content is updated
      
    }, TRANSITION_DURATION / 2); // Fade out duration
  };

  // Rotation logic for multiple promotions
  useEffect(() => {
    if (promotions.length <= 1 || !isVisible || rotationPaused) {
      // Clear rotation timer if not needed
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
        rotationTimerRef.current = null;
      }
      return;
    }

    console.log(`🔄 Starting rotation for ${promotions.length} promotions`);
    
    // Set up rotation timer
    rotationTimerRef.current = setInterval(() => {
      if (!rotationPaused && isVisible) {
        rotateToNext();
      }
    }, ROTATION_INTERVAL);

    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
        rotationTimerRef.current = null;
      }
    };
  }, [promotions.length, currentPromotionIndex, isVisible, rotationPaused, trackPromotionEngagement, currentPage, sessionId]);

  // Show promotion when loaded and valid
  useEffect(() => {
    if (!isLoading && promotions.length > 0 && !isVisible && !hasInteracted) {
      console.log('⏰ Setting up promotion display triggers...');
      
      // Show after initial delay
      displayTimerRef.current = setTimeout(() => {
        if (!hasInteracted) {
          console.log('⏰ Timer triggered - showing promotions');
          showPromotions();
        }
      }, INITIAL_DELAY);

      // Show on scroll
      const handleScroll = () => {
        if (!hasInteracted && window.scrollY > 50) {
          console.log('📜 Scroll triggered - showing promotions');
          setHasInteracted(true);
          showPromotions();
          if (displayTimerRef.current) {
            clearTimeout(displayTimerRef.current);
            displayTimerRef.current = null;
          }
        }
      };

      window.addEventListener('scroll', handleScroll);

      return () => {
        if (displayTimerRef.current) {
          clearTimeout(displayTimerRef.current);
          displayTimerRef.current = null;
        }
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isLoading, promotions.length, isVisible, hasInteracted]);

  const showPromotions = () => {
    if (promotions.length === 0) return;
    
    const displayDuration = calculateDisplayDuration(promotions.length);
    console.log(`🎯 Showing ${promotions.length} promotion(s) with ${displayDuration}ms duration`);
    setIsVisible(true);
    setHasInteracted(true);
    
    // Mark the first promotion as shown
    if (promotions[0]) {
      markPromotionShown(promotions[0]);
    }
    
    // Auto-hide after calculated display duration
    scrollTimerRef.current = setTimeout(() => {
      hidePromotions();
    }, displayDuration);
  };

  const hidePromotions = async () => {
    console.log('👋 Hiding promotions');
    setIsVisible(false);
    setRotationPaused(false);
    
    // Track close event for current promotion
    if (promotions[currentPromotionIndex]) {
      await trackPromotionEngagement(promotions[currentPromotionIndex].id, 'close', {
        timestamp: new Date().toISOString(),
        action: 'auto_hide_or_manual_close',
        total_promotions: promotions.length,
        promotion_index: currentPromotionIndex,
        session_id: sessionId
      });
    }
    
    // Clear all timers
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }

    // Set up auto-refresh after hiding
    setupAutoRefresh();
  };

  const setupAutoRefresh = () => {
    console.log('🔄 Setting up auto-refresh timer...');
    
    refreshTimerRef.current = setTimeout(() => {
      console.log('🔄 Auto-refreshing promotions...');
      
      // Reset interaction state to allow showing again
      setHasInteracted(false);
      
      // Reload promotions to check for new ones
      loadPromotions();
    }, REFRESH_DELAY);
  };

  // Clean up refresh timer on page change
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [currentPage]);

  const handleClick = async () => {
    const currentPromotion = promotions[currentPromotionIndex];
    if (!currentPromotion) return;
    
    PerformanceLogger.logInfo('Promotional popup clicked', { promotion: currentPromotion.title });
    
    console.log('🔗 Promotion clicked:', currentPromotion.button_link);
    
    // Pause rotation during interaction
    setRotationPaused(true);
    
    // Track click event BEFORE opening link
    await trackPromotionEngagement(currentPromotion.id, 'click', {
      timestamp: new Date().toISOString(),
      button_text: currentPromotion.button_text,
      target_url: currentPromotion.button_link,
      page: currentPage,
      total_promotions: promotions.length,
      promotion_index: currentPromotionIndex,
      session_id: sessionId
    });
    
    try {
      // Validate and open URL
      let linkUrl = currentPromotion.button_link;
      if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
        linkUrl = 'https://' + linkUrl;
      }
      
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
      hidePromotions();
    } catch (error) {
      console.error('❌ Error opening link:', error);
      setRotationPaused(false);
    }
  };

  const handleClose = async () => {
    console.log('❌ Promotions closed by user');
    PerformanceLogger.logInfo('Promotional popup closed by user');
    
    // Track close event for current promotion
    if (promotions[currentPromotionIndex]) {
      await trackPromotionEngagement(promotions[currentPromotionIndex].id, 'close', {
        timestamp: new Date().toISOString(),
        action: 'manual_close_button',
        total_promotions: promotions.length,
        promotion_index: currentPromotionIndex,
        session_id: sessionId
      });
    }
    
    hidePromotions();
  };

  const handleManualNavigation = async (direction: 'prev' | 'next') => {
    if (promotions.length <= 1) return;
    
    setRotationPaused(true);
    
    const newIndex = direction === 'next' 
      ? (currentPromotionIndex + 1) % promotions.length
      : (currentPromotionIndex - 1 + promotions.length) % promotions.length;
    
    console.log(`👆 Manual navigation ${direction} to promotion ${newIndex + 1}/${promotions.length}`);
    
    // Start transition animation
    setIsTransitioning(true);
    
    // Wait for fade out
    setTimeout(async () => {
      setCurrentPromotionIndex(newIndex);
      
      // Track view for manually navigated promotion
      if (promotions[newIndex]) {
        await trackPromotionEngagement(promotions[newIndex].id, 'view', {
          timestamp: new Date().toISOString(),
          page: currentPage,
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          total_promotions: promotions.length,
          promotion_index: newIndex,
          manual_navigation: direction,
          session_id: sessionId
        });
      }
      
      // End transition animation
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
      
    }, TRANSITION_DURATION / 2);
    
    // Resume rotation after a delay
    setTimeout(() => {
      setRotationPaused(false);
    }, ROTATION_INTERVAL);
  };

  // Don't render if loading or no promotions
  if (isLoading) {
    console.log('⏳ Still loading promotions...');
    return null;
  }

  if (promotions.length === 0) {
    console.log('❌ No promotions to show');
    return null;
  }

  if (!isVisible) {
    console.log('👁️ Promotions loaded but not visible yet');
    return null;
  }

  const currentPromotion = promotions[currentPromotionIndex];
  if (!currentPromotion) {
    console.log('❌ No current promotion available');
    return null;
  }

  console.log(`✅ Rendering promotion ${currentPromotionIndex + 1}/${promotions.length}:`, currentPromotion.title);

  // Calculate remaining time for progress bar
  const displayDuration = calculateDisplayDuration(promotions.length);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="w-80 shadow-xl border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50 transform transition-all duration-300 hover:scale-105">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 
                className={`font-semibold text-gray-900 text-lg leading-tight transition-opacity duration-${TRANSITION_DURATION} ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {currentPromotion.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 transition-colors z-10 relative"
              style={{
                // Ensure the close button is always clickable
                pointerEvents: 'auto',
                isolation: 'isolate'
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Promotional Image */}
          {currentPromotion.image_url && (
            <div className="mb-3">
              <img 
                src={currentPromotion.image_url} 
                alt={currentPromotion.title}
                className={`w-full h-24 object-cover rounded-lg shadow-sm border transition-opacity duration-${TRANSITION_DURATION} ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <p 
            className={`text-sm text-gray-700 mb-4 leading-relaxed transition-opacity duration-${TRANSITION_DURATION} ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {currentPromotion.message}
          </p>
          
          <div className="flex items-center justify-between">
            <Button 
              className={`promotional-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 w-full ${isTransitioning ? 'opacity-75' : 'opacity-100'} ${
                currentPromotion.button_text.toLowerCase().includes('limited') || 
                currentPromotion.button_text.toLowerCase().includes('urgent') || 
                currentPromotion.button_text.toLowerCase().includes('now') ||
                currentPromotion.button_text.toLowerCase().includes('today') ||
                currentPromotion.message.toLowerCase().includes('limited') ||
                currentPromotion.message.toLowerCase().includes('urgent')
                ? 'promotional-urgent' : ''
              }`}
              size="sm"
              onClick={handleClick}
              disabled={!currentPromotion.button_link || isTransitioning}
            >
              <span className="promotional-button-text">
                {currentPromotion.button_text}
              </span>
            </Button>
          </div>
          
          {/* Add promotional badge for urgent offers */}
          {(currentPromotion.button_text.toLowerCase().includes('limited') || 
            currentPromotion.button_text.toLowerCase().includes('urgent') || 
            currentPromotion.message.toLowerCase().includes('limited') ||
            currentPromotion.message.toLowerCase().includes('urgent')) && (
            <div className="absolute -top-2 -right-2">
              <span className="promotional-badge inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg">
                🔥 HOT
              </span>
            </div>
          )}
          
          {/* Dynamic auto-hide progress indicator */}
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all ease-linear"
              style={{ 
                width: isVisible ? '0%' : '100%',
                transitionDuration: `${displayDuration}ms`
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPromotionalPopup;
