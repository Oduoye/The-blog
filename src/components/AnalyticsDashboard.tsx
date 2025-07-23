import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { visitorTracker } from "@/lib/visitorTracking";
import { commentsStore } from "@/lib/commentsStore";
import { 
  Eye, 
  Users, 
  Heart, 
  Share, 
  MessageSquare, 
  TrendingUp, 
  BarChart3,
  Target,
  MousePointer,
  Activity,
  RefreshCw,
  Trash2
} from "lucide-react";

const AnalyticsDashboard = () => {
  const { 
    postAnalytics, 
    promotionAnalytics, 
    analyticsSummary, 
    promotionSummary, 
    loading,
    refetch
  } = useAnalytics();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  const formatReadingTime = (milliseconds: number) => {
    if (!milliseconds || milliseconds === 0) return '0s';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const handleRefreshAnalytics = async () => {
    console.log('🔄 Refreshing analytics data...');
    try {
      await refetch();
      console.log('✅ Analytics data refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh analytics:', error);
    }
  };

  const handleClearVisitorSession = () => {
    console.log('🗑️ Clearing visitor session and local data...');
    
    // Clear visitor tracking data
    visitorTracker.clearSession();
    
    // Clear comments store data
    commentsStore.clearAllInteractions();
    
    // Clear any other local storage data related to analytics and comments
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('promotion_') || 
        key.startsWith('nf_visitor') || 
        key.startsWith('blog_post_interactions') ||
        key.startsWith('nf_global_commenter_name') ||
        key.startsWith('comment_author_')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('✅ Cleared visitor session and local data');
    
    // Refresh the page to reset all state
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAnalytics}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh Data</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearVisitorSession}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clear Session</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Post Analytics</TabsTrigger>
          <TabsTrigger value="promotions">Promotion Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overall Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(analyticsSummary?.total_views || 0)}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unique Visitors</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(analyticsSummary?.total_unique_views || 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Engagement</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(
                        (analyticsSummary?.total_likes || 0) + 
                        (analyticsSummary?.total_shares || 0) + 
                        (analyticsSummary?.total_comments || 0)
                      )}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Engagement Rate</p>
                    <p className="text-2xl font-bold">
                      {formatPercentage(analyticsSummary?.avg_engagement_rate || 0)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Promotion Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Promotion Performance</span>
                <Badge variant="outline" className="text-sm">
                  {promotionAnalytics.length} active campaigns
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(promotionSummary?.total_views || 0)}
                  </p>
                  <p className="text-sm text-blue-700">Total Views</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {formatNumber(promotionSummary?.total_clicks || 0)}
                  </p>
                  <p className="text-sm text-green-700">Total Clicks</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatPercentage(promotionSummary?.avg_click_through_rate || 0)}
                  </p>
                  <p className="text-sm text-purple-700">Avg CTR</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatNumber(promotionSummary?.total_unique_views || 0)}
                  </p>
                  <p className="text-sm text-orange-700">Unique Views</p>
                </div>
              </div>
              
              {promotionAnalytics.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No promotion analytics data yet.</p>
                  <p className="text-sm">Create and activate promotions to see analytics here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Post Performance</span>
                <Badge variant="outline">{postAnalytics.length} unique posts</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {postAnalytics.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No post analytics available yet.</p>
                ) : (
                  postAnalytics.map((analytics) => (
                    <div key={analytics.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">
                            {(analytics as any).blog_posts?.title || 'Unknown Post'}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{formatNumber(analytics.views)} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{formatNumber(analytics.unique_views)} unique</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              <span>{formatNumber(analytics.likes)} likes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share className="h-4 w-4" />
                              <span>{formatNumber(analytics.shares)} shares</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{formatNumber(analytics.comments_count)} comments</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {formatPercentage(analytics.engagement_rate)} engagement
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                        <div>Bounce Rate: {formatPercentage(analytics.bounce_rate)}</div>
                        <div>Avg Reading Time: {formatReadingTime(analytics.reading_time_avg)}</div>
                        <div>Last Viewed: {new Date(analytics.last_viewed).toLocaleDateString()}</div>
                        <div>
                          CTR: {analytics.views > 0 ? formatPercentage((analytics.likes + analytics.shares) / analytics.views * 100) : '0%'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Promotion Performance</span>
                <Badge variant="outline">{promotionAnalytics.length} unique promotions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promotionAnalytics.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No promotion analytics available yet.</p>
                    <p className="text-sm">Create and activate promotions to start tracking their performance.</p>
                  </div>
                ) : (
                  promotionAnalytics.map((analytics) => (
                    <div key={analytics.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">
                            {(analytics as any).promotions?.title || 'Unknown Promotion'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {(analytics as any).promotions?.message}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4 text-blue-600" />
                              <span>{formatNumber(analytics.total_views)} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-green-600" />
                              <span>{formatNumber(analytics.unique_views)} unique</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MousePointer className="h-4 w-4 text-purple-600" />
                              <span>{formatNumber(analytics.total_clicks)} clicks</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4 text-orange-600" />
                              <span>{formatNumber(analytics.unique_clicks)} unique clicks</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600">
                            {formatPercentage(analytics.click_through_rate)} CTR
                          </Badge>
                          <div className="text-xs text-gray-500">
                            Conversion: {formatPercentage(analytics.conversion_rate)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 bg-white/50 rounded p-2">
                        <div>Bounce Rate: {formatPercentage(analytics.bounce_rate)}</div>
                        <div>Avg Time to Click: {analytics.avg_time_to_click}s</div>
                        <div>
                          View Rate: {analytics.total_views > 0 ? formatPercentage(analytics.unique_views / analytics.total_views * 100) : '0%'}
                        </div>
                        <div>
                          Click Rate: {analytics.total_clicks > 0 ? formatPercentage(analytics.unique_clicks / analytics.total_clicks * 100) : '0%'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;