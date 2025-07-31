import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useContactSettings } from "@/hooks/useContactSettings"; // useContactSettings is updated
import { Mail, Phone, MapPin, Globe, Save, RefreshCw } from "lucide-react";

const ContactManagement = () => {
  // useContactSettings hook is already updated to new schema
  const { contactSettings, loading, updateContactSettings, refetch } = useContactSettings();
  
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    social_media: {
      twitter: "",
      facebook: "",
      linkedin: "",
      instagram: ""
    }
  });

  const [saving, setSaving] = useState(false);

  // Update form data when contact settings are loaded
  useEffect(() => {
    if (contactSettings) {
      console.log('Updating form data with contact settings:', contactSettings);
      setFormData({
        email: contactSettings.email || "",
        phone: contactSettings.phone || "",
        address: contactSettings.address || "",
        website: contactSettings.website || "",
        description: contactSettings.description || "",
        social_media: {
          twitter: contactSettings.social_media?.twitter || "",
          facebook: contactSettings.social_media?.facebook || "",
          linkedin: contactSettings.social_media?.linkedin || "",
          instagram: contactSettings.social_media?.instagram || ""
        }
      });
    }
  }, [contactSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // updateContactSettings hook is already updated to use modified_at
      await updateContactSettings(formData);
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (field.startsWith('social_media.')) {
      const socialField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        social_media: {
          ...prev.social_media,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Refreshed",
      description: "Contact settings refreshed from database",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading contact settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information Management
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contact@example.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website URL</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange("website", e.target.value)}
              placeholder="https://example.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 Main Street, City, State, Country"
              className="pl-10"
              rows={2}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">About Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Brief description about your organization..."
            rows={3}
          />
        </div>

        {/* Social Media Links */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Social Media Links</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X Handle</Label>
              <Input
                id="twitter"
                value={formData.social_media.twitter}
                onChange={(e) => handleChange("social_media.twitter", e.target.value)}
                placeholder="@username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook Page</Label>
              <Input
                id="facebook"
                value={formData.social_media.facebook}
                onChange={(e) => handleChange("social_media.facebook", e.target.value)}
                placeholder="facebook.com/page"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn Profile</Label>
              <Input
                id="linkedin"
                value={formData.social_media.linkedin}
                onChange={(e) => handleChange("social_media.linkedin", e.target.value)}
                placeholder="linkedin.com/company/name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram Handle</Label>
              <Input
                id="instagram"
                value={formData.social_media.instagram}
                onChange={(e) => handleChange("social_media.instagram", e.target.value)}
                placeholder="@username"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Contact Information"}
          </Button>
        </div>

        {/* Preview Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Contact Information Preview</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p><strong>Email:</strong> {formData.email}</p>
            {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
            {formData.website && <p><strong>Website:</strong> {formData.website}</p>}
            {formData.address && <p><strong>Address:</strong> {formData.address}</p>}
            {formData.description && <p><strong>About:</strong> {formData.description}</p>}
            
            {Object.values(formData.social_media).some(value => value) && (
              <div>
                <strong>Social Media:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {formData.social_media.twitter && <li>Twitter: {formData.social_media.twitter}</li>}
                  {formData.social_media.facebook && <li>Facebook: {formData.social_media.facebook}</li>}
                  {formData.social_media.linkedin && <li>LinkedIn: {formData.social_media.linkedin}</li>}
                  {formData.social_media.instagram && <li>Instagram: {formData.social_media.instagram}</li>}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-blue-800">
              Contact settings are stored in the database and will update across all devices in real-time
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactManagement;
