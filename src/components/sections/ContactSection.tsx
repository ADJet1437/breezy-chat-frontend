import React from 'react';
import { Mail, MessageSquare, FileText, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-20 bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Let's Build Something Extraordinary
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <MessageSquare className="h-10 w-10 text-white mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Free Consultation</h3>
            <p className="text-blue-100 text-sm">
              30-minute discovery call to understand your needs
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <FileText className="h-10 w-10 text-white mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Custom Proposal</h3>
            <p className="text-blue-100 text-sm">
              Detailed project plan with timeline and pricing
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <Zap className="h-10 w-10 text-white mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Rapid Delivery</h3>
            <p className="text-blue-100 text-sm">
              Agile development with regular progress updates
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:support@talosy.com"
            className="inline-block"
          >
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-xl"
            >
              <Mail className="mr-2 h-5 w-5" />
              Contact Us
            </Button>
          </a>
        </div>

        <div className="mt-10 text-center">
          <p className="text-blue-100 text-sm mb-2">Prefer email?</p>
          <a href="mailto:support@talosy.com" className="text-white font-semibold text-lg hover:underline">
            support@talosy.com
          </a>
        </div>
      </div>
    </section>
  );
};
