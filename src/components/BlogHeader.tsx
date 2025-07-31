import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBlogPosts } from "@/hooks/useBlogPosts"; // useBlogPosts is already updated

const BlogHeader = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { signOut, user, profile } = useAuth(); // profile now matches blog.user_profiles
  const { posts } = useBlogPosts(); // posts from useBlogPosts are now from blog.posts

  const handleSignOut = async () => {
    await signOut();
  };

  // Get unique categories from published posts
  const categories = Array.from(new Set(posts.map(post => post.category || "").filter(Boolean))).sort();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
            <img 
              src="/nonce-firewall-logo.png" 
              alt="Nonce Firewall Blogs Logo" 
              className="h-8 w-8 sm:h-10 sm:w-10"
            />
            <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
              Nonce Firewall Blogs
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {!isAdminPath ? (
              <>
                <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Home
                </Link>
                {/* Categories Dropdown */}
                {categories.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                      className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                     aria-expanded={categoriesOpen}
                     aria-haspopup="true"
                    >
                      <span>Categories</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {categoriesOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full sm:w-64 md:w-72 lg:w-80 max-w-sm bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                        <div className="py-1 px-1">
                          {categories.map((category) => (
                            <Link
                              key={category}
                              to={`/?category=${encodeURIComponent(category.toLowerCase())}`}
                              className="block px-3 py-2 mx-1 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 rounded-md hover:translate-x-1"
                              onClick={() => setCategoriesOpen(false)}
                            >
                              {category}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
                  About
                </Link>
              </>
            ) : (
              <>
                <Link to="/admin" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
                {/* New: Check profile?.is_creator for 'New Post' button */}
                {(profile?.is_admin || profile?.is_creator) && ( 
                  <Link to="/admin/create">
                    <Button size="sm">New Post</Button>
                  </Link>
                )}
                <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                  View Blog
                </Link>
                {user && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                )}
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen 
            ? 'max-h-96 opacity-100 py-4 border-t border-gray-200' 
            : 'max-h-0 opacity-0 py-0'
        }`}>
          <div className={`transition-all duration-300 delay-100 ${
            mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}>
            <nav className="flex flex-col space-y-3">
              {!isAdminPath ? (
                <>
                  <Link 
                    to="/" 
                    className="text-gray-700 hover:text-blue-600 transition-all duration-200 px-2 py-1 hover:bg-blue-50 rounded-md transform hover:translate-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  {/* Mobile Categories Dropdown */}
                  {categories.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setCategoriesOpen(!categoriesOpen)}
                        className="flex items-center justify-between w-full text-gray-700 hover:text-blue-600 transition-all duration-200 px-2 py-1 hover:bg-blue-50 rounded-md transform hover:translate-x-2"
                        aria-expanded={categoriesOpen}
                        aria-haspopup="true"
                      >
                        <span>Categories</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {categoriesOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                          <div className="py-1 px-1">
                            {categories.map((category) => (
                              <Link
                                key={category}
                                to={`/?category=${encodeURIComponent(category.toLowerCase())}`}
                                className="block px-3 py-2 mx-1 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 rounded-md hover:translate-x-1"
                                onClick={() => {
                                  setCategoriesOpen(false);
                                  setMobileMenuOpen(false);
                                }}
                              >
                                {category}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <Link 
                    to="/about" 
                    className="text-gray-700 hover:text-blue-600 transition-all duration-200 px-2 py-1 hover:bg-blue-50 rounded-md transform hover:translate-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/admin" 
                    className="text-gray-700 hover:text-blue-600 transition-all duration-200 px-2 py-1 hover:bg-blue-50 rounded-md transform hover:translate-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {/* New: Check profile?.is_creator for 'New Post' button */}
                  {(profile?.is_admin || profile?.is_creator) && (
                    <Link 
                      to="/admin/create"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button size="sm" className="w-full transition-all duration-200 hover:scale-105">New Post</Button>
                    </Link>
                  )}
                  <Link 
                    to="/" 
                    className="text-gray-700 hover:text-blue-600 transition-all duration-200 px-2 py-1 hover:bg-blue-50 rounded-md transform hover:translate-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    View Blog
                  </Link>
                  {user && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
      
      {/* Overlay to close categories dropdown when clicking outside */}
      {categoriesOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/5" 
          onClick={() => setCategoriesOpen(false)}
        />
      )}
    </header>
  );
};

export default BlogHeader;
