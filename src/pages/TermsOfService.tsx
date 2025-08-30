import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService: React.FC = () => {
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
            Terms of Service
          </h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing and using BuiltX ("we", "our", "us"), operated by Talosy AB, a company 
                incorporated in Sweden, you accept and agree to be bound by the terms and provision 
                of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p>
                BuiltX is an AI-powered platform that provides code generation, project building, 
                and development assistance services. Our service includes but is not limited to:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>AI-assisted code generation and completion</li>
                <li>Automated project scaffolding and building</li>
                <li>Development workflow optimization</li>
                <li>Code analysis and improvement suggestions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account information 
                and for all activities that occur under your account. You agree to notify us 
                immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p>You agree not to use BuiltX to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Generate malicious code or software intended to harm systems or users</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon intellectual property rights of others</li>
                <li>Attempt to reverse engineer or compromise our service</li>
                <li>Use our service for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
              <p>
                The code and content generated through BuiltX belongs to you. However, our underlying 
                AI models, algorithms, and platform technology remain our intellectual property. 
                You retain ownership of any code you input or generate using our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Privacy and Data</h2>
              <p>
                Your privacy is important to us. Please review our Privacy Policy, which also governs 
                your use of BuiltX, to understand our practices regarding your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Service Availability</h2>
              <p>
                We strive to maintain high availability of our service, but we cannot guarantee 
                uninterrupted access. We reserve the right to modify, suspend, or discontinue 
                any aspect of our service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p>
                BuiltX is provided "as is" without warranties of any kind. We shall not be liable 
                for any indirect, incidental, special, consequential, or punitive damages resulting 
                from your use of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of 
                significant changes via email or through our service. Continued use of BuiltX 
                after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
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

export default TermsOfService;