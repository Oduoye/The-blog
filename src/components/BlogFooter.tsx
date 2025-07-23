import { useContactSettings } from "@/hooks/useContactSettings";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail, Phone, MapPin, Globe } from "lucide-react";

// Premium social media icons
const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const BlogFooter = () => {
  const { contactSettings, loading } = useContactSettings();

  if (loading) {
    return (
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-48 mx-auto mb-4"></div>
              <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  const socialPlatforms = [
    {
      name: "X (Twitter)",
      key: "twitter" as const,
      icon: <TwitterIcon />,
      baseUrl: "https://twitter.com/",
      color: "hover:bg-black hover:text-white"
    },
    {
      name: "Facebook",
      key: "facebook" as const,
      icon: <FacebookIcon />,
      baseUrl: "https://facebook.com/",
      color: "hover:bg-blue-600 hover:text-white"
    },
    {
      name: "LinkedIn",
      key: "linkedin" as const,
      icon: <LinkedInIcon />,
      baseUrl: "https://linkedin.com/",
      color: "hover:bg-blue-700 hover:text-white"
    },
    {
      name: "Instagram",
      key: "instagram" as const,
      icon: <InstagramIcon />,
      baseUrl: "https://instagram.com/",
      color: "hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white"
    }
  ];

  const activeSocialPlatforms = socialPlatforms.filter(
    platform => contactSettings?.social_media?.[platform.key]?.trim()
  );

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/nonce-firewall-logo.png" 
                alt="Nonce Firewall Blogs Logo" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">Nonce Firewall Blogs</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {contactSettings?.description || 
               "Tech based educational blogs and multipurpose blogging arena. We provide cybersecurity insights, tech news, and industry updates."}
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="space-y-3">
              {contactSettings?.email && (
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <a 
                    href={`mailto:${contactSettings.email}`} 
                    className="hover:text-blue-400 transition-colors text-sm"
                  >
                    {contactSettings.email}
                  </a>
                </div>
              )}
              
              {contactSettings?.phone && (
                <div className="flex items-center space-x-3 text-gray-300">
                  <Phone className="h-4 w-4 text-green-400" />
                  <a 
                    href={`tel:${contactSettings.phone}`} 
                    className="hover:text-green-400 transition-colors text-sm"
                  >
                    {contactSettings.phone}
                  </a>
                </div>
              )}
              
              {contactSettings?.website && (
                <div className="flex items-center space-x-3 text-gray-300">
                  <Globe className="h-4 w-4 text-purple-400" />
                  <a 
                    href={contactSettings.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-purple-400 transition-colors text-sm flex items-center gap-1"
                  >
                    {contactSettings.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              {contactSettings?.address && (
                <div className="flex items-start space-x-3 text-gray-300">
                  <MapPin className="h-4 w-4 text-red-400 mt-0.5" />
                  <span className="text-sm">{contactSettings.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Follow Us</h3>
            {activeSocialPlatforms.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {activeSocialPlatforms.map((platform) => (
                  <Button
                    key={platform.key}
                    variant="outline"
                    size="sm"
                    className={`transition-all duration-200 border-gray-600 text-gray-600 hover:text-white ${platform.color} flex items-center space-x-2 hover:scale-105 hover:shadow-lg`}
                    asChild
                  >
                    <a
                      href={`${platform.baseUrl}${contactSettings?.social_media?.[platform.key]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Follow us on ${platform.name}`}
                    >
                      {platform.icon}
                      <span className="hidden sm:inline text-xs">{platform.name}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                Social media links will appear here when configured in admin settings.
              </p>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Nonce Firewall Blogs. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a href="/about" className="text-gray-400 hover:text-white transition-colors">
                About
              </a>
              <a href="mailto:noncefirewall@gmail.com" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </a>
              <span className="text-gray-400">
                Made with ❤️ for the tech community
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BlogFooter;