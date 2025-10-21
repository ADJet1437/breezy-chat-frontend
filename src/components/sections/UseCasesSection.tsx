import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageSquare, Music, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const UseCasesSection: React.FC = () => {
  const navigate = useNavigate();

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin.includes('localhost')) {
        return 'http://talosy.test';
      }
      return origin;
    }
    return process.env.NODE_ENV === 'development'
      ? 'http://talosy.test'
      : 'https://talosy.com';
  };

  const useCases = [
    {
      title: 'Swift Productivity',
      subtitle: 'Team SaaS Platform',
      description: 'Complete team management platform with task tracking, collaboration tools, and analytics dashboard.',
      gradient: 'from-blue-500 to-purple-600',
      icon: MessageSquare,
      image: `${getBaseUrl()}/use-cases/static/images/swift-productivity-saas.png`,
      url: `${getBaseUrl()}/use-cases/swift-productivity-saas/`,
      color: 'blue'
    },
    {
      title: 'Melodic Stream',
      subtitle: 'Music Streaming',
      description: 'Spotify-like music streaming platform with playlist creation, artist pages, and audio controls.',
      gradient: 'from-purple-500 to-blue-600',
      icon: Music,
      image: `${getBaseUrl()}/use-cases/static/images/melodic-stream-hub-1.png`,
      url: `${getBaseUrl()}/use-cases/melodic-stream-hub/`,
      color: 'purple'
    },
    {
      title: 'Swift Feast',
      subtitle: 'Food Delivery App',
      description: 'Modern food delivery platform with real-time tracking, payment integration, and restaurant management.',
      gradient: 'from-orange-500 to-red-600',
      icon: Globe,
      image: `${getBaseUrl()}/use-cases/static/images/swift-feast-delivery.png`,
      url: `${getBaseUrl()}/use-cases/swift-feast-delivery/`,
      color: 'orange'
    },
    {
      title: 'Sparkle Jewel',
      subtitle: 'Luxury E-commerce',
      description: 'Elegant jewelry e-commerce store with 3D product visualization and premium shopping experience.',
      gradient: 'from-pink-500 to-purple-600',
      icon: Sparkles,
      image: `${getBaseUrl()}/use-cases/static/images/sparkle-jewel-boutique-1.png`,
      url: `${getBaseUrl()}/use-cases/sparkle-jewel-boutique/`,
      color: 'pink'
    }
  ];

  return (
    <section id="use-cases-showcase" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What You Can Build
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real projects built with Talosy. From SaaS platforms to e-commerce stores, see what's possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <a
                key={index}
                href={useCase.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 overflow-hidden border border-gray-100">
                  <div className={`h-48 bg-gradient-to-br ${useCase.gradient} relative overflow-hidden`}>
                    {/* Project Image Overlay */}
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-50 mix-blend-overlay"
                      style={{
                        backgroundImage: `url(${useCase.image})`
                      }}
                    ></div>
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-bold text-lg">{useCase.title}</h3>
                      <p className={`text-${useCase.color}-100 text-sm`}>{useCase.subtitle}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {useCase.description}
                    </p>
                    <div className={`mt-4 flex items-center text-${useCase.color}-600 text-sm font-medium group-hover:text-${useCase.color === 'orange' ? 'red' : useCase.color === 'blue' ? 'purple' : useCase.color === 'purple' ? 'blue' : 'purple'}-600 transition-colors`}>
                      View Project <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/use-cases')}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            View All Use Cases
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
