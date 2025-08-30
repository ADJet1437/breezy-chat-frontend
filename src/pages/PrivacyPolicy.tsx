import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <p className="mb-8 text-gray-700 dark:text-gray-300">
              This Privacy Policy describes how Talosy AB, a company incorporated in Sweden, 
              collects, uses, and protects your information when you use BuiltX.
            </p>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-medium mb-3">Account Information</h3>
              <p>
                When you create a BuiltX account, we collect information such as your name, 
                email address, and authentication credentials through Google OAuth or email registration.
              </p>

              <h3 className="text-xl font-medium mb-3 mt-6">Usage Data</h3>
              <p>We collect information about how you use BuiltX, including:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Code prompts and generated content</li>
                <li>Project configurations and build settings</li>
                <li>Feature usage patterns and preferences</li>
                <li>Error logs and performance metrics</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 mt-6">Technical Information</h3>
              <p>We automatically collect certain technical information, including:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>IP address and browser type</li>
                <li>Access times and referring URLs</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Provide, maintain, and improve our AI-powered development services</li>
                <li>Process your requests and generate code based on your prompts</li>
                <li>Personalize your experience and remember your preferences</li>
                <li>Communicate with you about service updates and support</li>
                <li>Monitor usage patterns to prevent abuse and ensure service quality</li>
                <li>Comply with legal obligations and protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties, except:</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Service Providers:</strong> We may share information with trusted third-party services that help us operate our platform (e.g., cloud hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, user information may be transferred as part of the business assets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Code and Content Privacy</h2>
              <p>
                Your code and generated content are treated with strict confidentiality:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>We do not use your code to train our AI models without explicit consent</li>
                <li>Your projects and generated code remain private and are not shared with other users</li>
                <li>We implement encryption and access controls to protect your intellectual property</li>
                <li>You retain full ownership and control over your code and projects</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure cloud infrastructure with reputable providers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide services. 
                You may request deletion of your account and associated data at any time through your account settings 
                or by contacting us directly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Access, update, or delete your personal information</li>
                <li>Export your projects and generated code</li>
                <li>Opt out of non-essential communications</li>
                <li>Request information about how your data is used</li>
                <li>Lodge complaints with relevant data protection authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
              <p>
                BuiltX may store and process your information in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your information when it is transferred internationally.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes 
                via email or through our service. Your continued use of BuiltX after changes constitutes 
                acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mt-2">
                <p><strong>Talosy AB</strong></p>
                <p>Stockholm, Sweden</p>
                <p>Email: support@talosy.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;