import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Your Trusted
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}AI
              </span>
              <br />Partner
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              We specialize in designing and implementing enterprise-grade AI solutions that solve real business problems.
              Our team brings deep expertise in machine learning, distributed systems, and software architecture.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Whether you need a custom RAG system, intelligent automation, or a complete AI-powered platform,
              we deliver production-ready solutions with comprehensive training and ongoing support.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="text-2xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-600">Client Satisfaction</div>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <div className="text-2xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600">Support Available</div>
              </div>
            </div>
          </div>
          <div className="relative space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
              <Shield className="h-12 w-12 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Our Commitment</h3>
              <p className="text-blue-100 leading-relaxed mb-4">
                "Delivering secure, scalable AI solutions that drive measurable business value."
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-blue-100">
                  <CheckCircle2 className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>Fixed-price projects or flexible retainers</span>
                </li>
                <li className="flex items-center text-blue-100">
                  <CheckCircle2 className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>Complete IP ownership transfer</span>
                </li>
                <li className="flex items-center text-blue-100">
                  <CheckCircle2 className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>Comprehensive documentation & training</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3">Industries We Serve</h4>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Financial Services
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Retail
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  E-commerce
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  SaaS & Tech
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                  Education
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
                  Marketing
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
