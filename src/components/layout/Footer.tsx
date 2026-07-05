import React from 'react';
import { Linkedin, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src="/favicon-192x192.png" alt="Talosy" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-bold">Talosy</span>
            </div>
            <div className="mt-4">
              <p className="text-gray-300 text-sm font-semibold">Let's Work Together:</p>
              <a href="mailto:support@talosy.com" className="text-blue-400 hover:text-blue-300 text-sm">
                support@talosy.com
              </a>
            </div>
            <div className="flex space-x-4">
              <a href="https://www.linkedin.com/company/talosy/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://github.com/talosy-community" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#gallery" className="text-gray-400 hover:text-white cursor-pointer">RAG Systems</a></li>
              <li><a href="#gallery" className="text-gray-400 hover:text-white cursor-pointer">Agentic AI Coding</a></li>
              <li><a href="#gallery" className="text-gray-400 hover:text-white cursor-pointer">Process Automation</a></li>
              <li><a href="#gallery" className="text-gray-400 hover:text-white cursor-pointer">Enterprise Integration</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="text-gray-400 hover:text-white cursor-pointer">About Us</a></li>
              <li><a href="#use-cases-showcase" className="text-gray-400 hover:text-white cursor-pointer">Case Studies</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-white cursor-pointer">Schedule Consultation</a></li>
              <li><a href="mailto:support@talosy.com" className="text-gray-400 hover:text-white cursor-pointer">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy" className="text-gray-400 hover:text-white cursor-pointer">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-white cursor-pointer">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Talosy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
