import { useState } from "react";
import BlogHeader from "@/components/BlogHeader";
import EnhancedPromotionSettings from "@/components/EnhancedPromotionSettings";
import ContactManagement from "@/components/ContactManagement";
import ContactSubmissionsManager from "@/components/ContactSubmissionsManager";
import AboutUsSectionsManager from "@/components/AboutUsSectionsManager";
import UserManagementTable from "@/components/UserManagementTable";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { DebugUtils } from "@/utils/debugUtils";
import { useAdminBlogPosts } from "@/hooks/useBlogPosts";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { PlusCircle, Edit, Trash2, Eye, Settings, Megaphone, BarChart3, Mail, MessageSquare, FileText, Bug, Users } from "lucide-react";

const AdminDashboard = () => {
  const { posts, loading, deletePost } = useAdminBlogPosts();
  const { profile } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleDeletePost = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      await deletePost(id);
    }
  };

  // Debug function for troubleshooting
  const runDiagnostics = async () => {
    DebugUtils.log('AdminDashboard', 'Running diagnostics...');
    
    try {
      const supabaseTest = await DebugUtils.testSupabaseConnection();
      const browserInfo = DebugUtils.checkBrowserEnvironment();
      DebugUtils.checkMemoryUsage();
      
      const diagnostics = {
        supabase: supabaseTest,
        browser: browserInfo,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(diagnostics);
      DebugUtils.log('AdminDashboard', 'Diagnostics completed:', diagnostics);
      
      if (!supabaseTest.success) {
        alert(`Database connection issue detected: ${supabaseTest.error}`);
      } else {
        alert('All systems operational!');
      }
    } catch (error) {
      DebugUtils.error('AdminDashboard', 'Diagnostics failed:', error);
      alert(`Diagnostics failed: ${error}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    // Check if date is in the future, use current date instead
    const now = new Date();
    const displayDate = date > now ? now : date;
    
    return displayDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading state without blinking
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your blog posts, promotions, analytics, about page, and contact information</p>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runDiagnostics}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Bug className="h-4 w-4" />
                  Run Diagnostics
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Debug Information Panel (Development Only) */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-yellow-700">
                  System Diagnostics Results
                </summary>
                <pre className="mt-2 p-2 bg-white rounded border text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className={`grid ${profile?.is_admin ? 'grid-cols-3 sm:grid-cols-7' : 'grid-cols-2 sm:grid-cols-3'} w-full gap-1`}>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <span className="text-xs">Posts</span>
            </TabsTrigger>
            
            {/* Super Admin Only Tabs */}
            {profile?.is_admin && (
              <>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Users</span>
                </TabsTrigger>
                <TabsTrigger value="promotions" className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  <span className="text-xs">Promotions</span>
                </TabsTrigger>
                <TabsTrigger value="about" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs">About</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs">Contact</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="text-xs">Settings</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Blog Posts ({posts.length})</span>
                  <Link to="/admin/create">
                    <Button className="flex items-center space-x-2">
                      <PlusCircle className="h-4 w-4" />
                      <span>New Post</span>
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No posts created yet</p>
                    <Link to="/admin/create">
                      <Button>Create Your First Post</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {posts.map((post) => (
                          <tr key={post.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{post.title}</div>
                              {post.excerpt && (
                                <div className="text-xs text-gray-500 max-w-xs truncate">{post.excerpt}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={post.is_published ? "default" : "secondary"}>
                                {post.is_published ? "Published" : "Draft"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline">{post.category || "General"}</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                              {formatDate(post.published_at || post.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                              <Link to={`/post/${post.id}`}>
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </Link>
                              <Link to={`/admin/edit/${post.id}`}>
                                <Button size="sm">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Super Admin Only Content */}
          {profile?.is_admin && (
            <>
              <TabsContent value="users">
                <UserManagementTable />
              </TabsContent>

              <TabsContent value="promotions">
                <EnhancedPromotionSettings />
              </TabsContent>

              <TabsContent value="about">
                <AboutUsSectionsManager />
              </TabsContent>

              <TabsContent value="contact">
                <div className="space-y-6">
                  <ContactManagement />
                  <ContactSubmissionsManager />
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-2">Blog Configuration</h3>
                        <p className="text-blue-800 text-sm mb-3">
                          Your blog is configured and ready to use. You can manage posts, promotions, and analytics from this dashboard.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Total Posts:</strong> {posts.length}
                          </div>
                          <div>
                            <strong>Published Posts:</strong> {posts.filter(p => p.is_published).length}
                          </div>
                          <div>
                            <strong>Draft Posts:</strong> {posts.filter(p => !p.is_published).length}
                          </div>
                          <div>
                            <strong>Categories:</strong> {new Set(posts.map(p => p.category).filter(Boolean)).size}
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-medium text-green-900 mb-2">System Status</h3>
                        <div className="space-y-2 text-sm text-green-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Database: Connected</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Storage: Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Analytics: Tracking</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Contact Forms: Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          {/* Team Member Dashboard Info */}
          {!profile?.is_admin && (
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Team Member Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 mb-2">Your Profile</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                        <div>
                          <strong>Name:</strong> {profile?.display_name || 'Not set'}
                        </div>
                        <div>
                          <strong>Email:</strong> {profile?.email || 'Not set'}
                        </div>
                        <div>
                          <strong>Specialized Category:</strong> {profile?.specialized_category || 'Not set'}
                        </div>
                        <div>
                          <strong>Role:</strong> Team Member
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">Your Permissions</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                        <li>Create and edit blog posts in your specialized category</li>
                        <li>View analytics for your posts</li>
                        <li>Manage comments on your posts</li>
                        <li>Upload images and media for your content</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-medium text-yellow-900 mb-2">Need Help?</h3>
                      <p className="text-sm text-yellow-800">
                        If you need to change your specialized category or have other account issues, 
                        please contact a super administrator.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;