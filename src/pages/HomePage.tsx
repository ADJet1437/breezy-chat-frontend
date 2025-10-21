import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { DynamicBackground } from '../components/hero/DynamicBackground';
import { FloatingChatInput } from '../components/hero/FloatingChatInput';
import { UseCasesSection } from '../components/sections/UseCasesSection';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Load Calendly widget script for Header
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    const link = document.createElement('link');
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const handleCreateMission = async (message: string, fileIds: string[]) => {
    // Navigate to /chat route for new mission creation
    // The ChatInterface will handle creating the mission and streaming the response
    navigate('/chat', {
      state: {
        initialMessage: message,
        initialFileIds: fileIds
      }
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header showNavigation={false} />

      {/* Hero Section with 3D Parallax */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100"
        style={{
          perspective: '1000px',
        }}
      >
        <DynamicBackground />

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
          <div className="space-y-8 animate-fade-in">
            <h1
              className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight"
              style={{
                textShadow: `
                  2px 2px 10px rgba(59, 130, 246, 0.1),
                  -1px -1px 20px rgba(147, 51, 234, 0.1)
                `,
              }}
            >
              Build Anything with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}AI
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From idea to reality in minutes. Just describe what you want to build,
              and our AI will create it for you.
            </p>

            <FloatingChatInput
              onSubmit={handleCreateMission}
              placeholder="Describe your project: 'Build me a todo app with React and Firebase...'"
            />
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <UseCasesSection />

      {/* Footer */}
      <Footer />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
