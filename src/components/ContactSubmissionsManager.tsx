import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ExternalLink } from "lucide-react";

const ContactSubmissionsManager = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Contact Form Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Contact Forms Now Use Formspree
            </h3>
            <p className="text-gray-600 mb-4">
              Contact form submissions are now handled by Formspree. You can view and manage 
              all submissions directly in your Formspree dashboard.
            </p>
            <a
              href="https://formspree.io/forms/mldbqpgy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View Submissions in Formspree
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactSubmissionsManager;