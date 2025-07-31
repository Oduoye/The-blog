import BlogHeader from "@/components/BlogHeader";
import { Card, CardContent } from "@/components/ui/card";
import { usePublicAboutUsSections } from "@/hooks/useAboutUsSections";
import { Mail, Phone, MapPin, Globe, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useContactSettings } from "@/hooks/useContactSettings"; // New: Import useContactSettings

const About = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { sections, loading, error } = usePublicAboutUsSections(); // This hook is already updated
  const { contactSettings } = useContactSettings(); // New: Fetch contact settings for contact info

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getSectionsByType = (type: string) => {
    return sections.filter(section => section.section_type === type);
  };

  const getHeroSection = () => {
    return sections.find(section => section.section_type === 'hero');
  };

  const getMissionSection = () => {
    return sections.find(section => section.section_type === 'mission');
  };

  // The contact section content is now primarily managed via ContactSettings hook
  // We can still look for a section marked 'contact' in about_us_sections for title/content
  const getContactSectionFromAbout = () => {
    return sections.find(section => section.section_type === 'contact');
  };

  const getOtherSections = () => {
    return sections.filter(section => 
      !['hero', 'mission', 'contact'].includes(section.section_type)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading about content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">About Us</h1>
          <p className="text-gray-600">Unable to load content at this time. Please try again later.</p>
        </div>
      </div>
    );
  }

  const heroSection = getHeroSection();
  const missionSection = getMissionSection();
  const contactSectionAbout = getContactSectionFromAbout(); // From about_us_sections
  const otherSections = getOtherSections();

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        {heroSection && (
          <div className={`text-center mb-12 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 animate-bounce">
              {(heroSection.metadata as any)?.icon_svg ? (
                <div 
                  className="w-12 h-12 flex items-center justify-center text-blue-600"
                  dangerouslySetInnerHTML={{ __html: (heroSection.metadata as any).icon_svg }}
                />
              ) : (
                <img 
                  src="/nonce-firewall-logo.png" 
                  alt="Nonce Firewall Logo" 
                  className="h-12 w-12"
                />
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-fade-in">
              {heroSection.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in">
              {heroSection.content}
            </p>
          </div>
        )}

        {/* Mission Section */}
        {missionSection && (
          <Card className={`mb-8 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                {(missionSection.metadata as any)?.icon_svg && (
                  <div 
                    className="w-8 h-8 flex items-center justify-center text-blue-600"
                    dangerouslySetInnerHTML={{ __html: (missionSection.metadata as any).icon_svg }}
                  />
                )}
                <span>{missionSection.title}</span>
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {missionSection.content}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other Sections */}
        {otherSections.map((section, index) => (
          <Card 
            key={section.id} 
            className={`mb-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${400 + index * 200}ms` }}
          >
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                {(section.metadata as any)?.icon_svg && (
                  <div 
                    className="w-8 h-8 flex items-center justify-center text-blue-600"
                    dangerouslySetInnerHTML={{ __html: (section.metadata as any).icon_svg }}
                  />
                )}
                <span>{section.title}</span>
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
              
              {/* Display metadata if available */}
              {section.metadata && Object.keys(section.metadata).length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Additional Information</h3>
                  {/* Only show non-icon metadata */}
                  {(() => {
                    const { icon_svg, ...otherMetadata } = section.metadata as any;
                    return Object.keys(otherMetadata).length > 0 ? (
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(otherMetadata, null, 2)}
                      </pre>
                    ) : null;
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Contact Section - Prioritize data from contactSettings hook */}
        <Card className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${600 + otherSections.length * 200}ms` }}>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              {/* Use icon from About Us section if available, otherwise default to Mail */}
              {(contactSectionAbout?.metadata as any)?.icon_svg ? (
                <div 
                  className="w-8 h-8 flex items-center justify-center text-blue-600"
                  dangerouslySetInnerHTML={{ __html: (contactSectionAbout.metadata as any).icon_svg }}
                />
              ) : (
                <Mail className="h-8 w-8 text-blue-600" /> // Default icon
              )}
              <span>{contactSectionAbout?.title || 'Get In Touch'}</span> {/* Use title from About section or default */}
            </h2>
            <div className="text-gray-600 mb-6 whitespace-pre-line">
              {contactSectionAbout?.content || contactSettings?.description || 'We are here to help! Reach out to us.'}
            </div>
            <div className="space-y-2 hover:bg-gray-50 p-4 rounded-lg transition-colors duration-200">
              {contactSettings?.email && (
                <p className="text-gray-700 flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <strong>Email:</strong> {contactSettings.email}
                </p>
              )}
              {contactSettings?.phone && (
                <p className="text-gray-700 flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <strong>Phone:</strong> {contactSettings.phone}
                </p>
              )}
              {contactSettings?.address && (
                <p className="text-gray-700 flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <strong>Address:</strong> {contactSettings.address}
                </p>
              )}
              {contactSettings?.website && (
                <p className="text-gray-700 flex items-center justify-center gap-2">
                  <Globe className="h-4 w-4 text-gray-600" />
                  <strong>Website:</strong> <a href={contactSettings.website} target="_blank" rel="noopener noreferrer">{contactSettings.website}</a>
                </p>
              )}
              <p className="text-gray-600">
                We typically respond within 24 hours.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fallback if no sections */}
        {sections.length === 0 && !loading && (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">About Nonce Firewall Blogs</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tech based educational blogs and multipurpose blogging arena. 
              We provide cybersecurity insights, tech news, and industry updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default About;
