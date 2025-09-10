import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Code, 
  Bot, 
  Sparkles, 
  Users, 
  Zap, 
  Globe, 
  Twitter, 
  Github, 
  Linkedin,
  Mail,
  ChevronDown,
  Play,
  Star,
  MessageSquare,
  Terminal,
  FileText,
  Palette,
  Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface NavigationItemProps {
  href: string;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
}

const NavigationItem: React.FC<NavigationItemProps> = ({ href, children, onClick }) => (
  <a
    href={href}
    className="text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer font-medium"
    onClick={onClick}
  >
    {children}
  </a>
);

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('hero');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // If running on localhost, redirect to talosy.dev for use cases
      if (origin.includes('localhost')) {
        return 'http://talosy.dev';
      }
      return origin; // Production: uses actual domain
    }
    // Server-side fallback
    return process.env.NODE_ENV === 'development' 
      ? 'http://talosy.dev' 
      : 'https://talosy.com';
  };

  const scrollToSection = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleGetStarted = () => {
    navigate('/');
  };

  // Mouse movement tracking for 3D parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const heroElement = heroRef.current;
      if (!heroElement) return;
      
      const rect = heroElement.getBoundingClientRect();
      const isOverHero = e.clientY >= rect.top && e.clientY <= rect.bottom;
      
      if (isOverHero) {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setMousePosition({ x, y });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll tracking for parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    const sections = ['hero', 'gallery', 'use-cases-showcase', 'features', 'about', 'contact'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Talosy</span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <NavigationItem href="#gallery" onClick={scrollToSection('gallery')}>
                Solutions
              </NavigationItem>
              <NavigationItem href="#use-cases-showcase" onClick={scrollToSection('use-cases-showcase')}>
                Use Cases
              </NavigationItem>
              <NavigationItem href="#features" onClick={scrollToSection('features')}>
                Features
              </NavigationItem>
              <NavigationItem href="#about" onClick={scrollToSection('about')}>
                About
              </NavigationItem>
              <NavigationItem href="#contact" onClick={scrollToSection('contact')}>
                Contact
              </NavigationItem>
            </nav>

            {/* CTA Button */}
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with 3D Parallax */}
      <section 
        ref={heroRef}
        id="hero" 
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100"
        style={{
          perspective: '1000px',
        }}
      >
        {/* 3D Parallax Background Layers */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Layer 1 - Furthest back (slowest movement) */}
          <div 
            className="absolute inset-0 transform-gpu"
            style={{
              transform: `
                translateX(${mousePosition.x * 10}px) 
                translateY(${mousePosition.y * 10}px) 
                translateZ(-100px) 
                rotateX(${mousePosition.y * 2}deg) 
                rotateY(${mousePosition.x * 2}deg)
                translateY(${scrollY * 0.1}px)
              `,
            }}
          >
            <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
          </div>

          {/* Layer 2 - Middle layer */}
          <div 
            className="absolute inset-0 transform-gpu"
            style={{
              transform: `
                translateX(${mousePosition.x * 20}px) 
                translateY(${mousePosition.y * 20}px) 
                translateZ(-50px) 
                rotateX(${mousePosition.y * 5}deg) 
                rotateY(${mousePosition.x * 5}deg)
                translateY(${scrollY * 0.2}px)
              `,
            }}
          >
            <div className="absolute top-40 left-1/3 w-64 h-64 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
            <div className="absolute bottom-40 right-1/3 w-64 h-64 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
          </div>

          {/* Layer 3 - Closest (fastest movement) */}
          <div 
            className="absolute inset-0 transform-gpu"
            style={{
              transform: `
                translateX(${mousePosition.x * 30}px) 
                translateY(${mousePosition.y * 30}px) 
                rotateX(${mousePosition.y * 8}deg) 
                rotateY(${mousePosition.x * 8}deg)
                translateY(${scrollY * 0.3}px)
              `,
            }}
          >
            {/* Floating 3D Elements */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl rotate-45 mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-r from-pink-400 to-red-500 rounded-full mix-blend-multiply filter blur-lg opacity-60 animate-bounce"></div>
            <div className="absolute bottom-1/3 left-1/2 w-20 h-20 bg-gradient-to-r from-teal-400 to-blue-500 rounded-2xl rotate-12 mix-blend-multiply filter blur-lg opacity-55"></div>
          </div>

          {/* Geometric 3D Shapes */}
          <div 
            className="absolute inset-0 transform-gpu"
            style={{
              transform: `
                translateX(${mousePosition.x * 15}px) 
                translateY(${mousePosition.y * 15}px) 
                rotateZ(${scrollY * 0.05}deg)
              `,
            }}
          >
            {/* Floating Code Icons */}
            <div className="absolute top-1/4 right-1/3 opacity-20">
              <Code 
                className="h-16 w-16 text-blue-600 transform rotate-12" 
                style={{
                  transform: `rotateX(${mousePosition.y * 10}deg) rotateY(${mousePosition.x * 10}deg)`,
                }}
              />
            </div>
            <div className="absolute bottom-1/4 left-1/4 opacity-20">
              <Bot 
                className="h-20 w-20 text-purple-600 transform -rotate-12" 
                style={{
                  transform: `rotateX(${mousePosition.y * -8}deg) rotateY(${mousePosition.x * -8}deg)`,
                }}
              />
            </div>
            <div className="absolute top-1/2 right-1/4 opacity-20">
              <Sparkles 
                className="h-12 w-12 text-pink-600 transform rotate-45" 
                style={{
                  transform: `rotateX(${mousePosition.y * 12}deg) rotateY(${mousePosition.x * 12}deg)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Content with 3D Transform */}
        <div 
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center transform-gpu"
          style={{
            transform: `
              translateY(${scrollY * 0.1}px)
              rotateX(${mousePosition.y * 2}deg) 
              rotateY(${mousePosition.x * 2}deg)
            `,
          }}
        >
          <div className="space-y-8 animate-fade-in">
            <h1 
              className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight transform-gpu"
              style={{
                transform: `translateZ(50px)`,
                textShadow: `
                  ${mousePosition.x * 2}px ${mousePosition.y * 2}px 10px rgba(59, 130, 246, 0.1),
                  ${mousePosition.x * -1}px ${mousePosition.y * -1}px 20px rgba(147, 51, 234, 0.1)
                `,
              }}
            >
              Your strategic
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> 
                {" "}AI partner
              </span>
              <br />
              for building missions
            </h1>
            
            <p 
              className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed transform-gpu"
              style={{
                transform: `translateZ(30px)`,
              }}
            >
              Transform your workflow with intelligent mission planning, 
              advanced code assistance, and comprehensive knowledge management.
            </p>

            <div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 transform-gpu"
              style={{
                transform: `translateZ(40px)`,
              }}
            >
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                style={{
                  boxShadow: `
                    0 10px 25px rgba(59, 130, 246, 0.3),
                    ${mousePosition.x * 2}px ${mousePosition.y * 2}px 15px rgba(147, 51, 234, 0.2)
                  `,
                }}
              >
                <Play className="mr-2 h-5 w-5" />
                Start Your Journey
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToSection('gallery')}
                className="px-8 py-4 text-lg border-2 hover:bg-gray-50 backdrop-blur-sm bg-white/80 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Explore Solutions
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 3D Scroll Indicator */}
        <div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce transform-gpu"
          style={{
            transform: `
              translateX(-50%) 
              rotateX(${mousePosition.y * 5}deg) 
              rotateY(${mousePosition.x * 5}deg)
            `,
          }}
        >
          <ChevronDown className="h-8 w-8 text-gray-400" />
        </div>
      </section>

      {/* Solutions Gallery Section */}
      <section id="gallery" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how Talosy transforms different aspects of your workflow with intelligent solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-visible">
            {/* Mission Planning Card */}
            <Card className="group cursor-pointer border border-gray-200 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-300 hover:-translate-y-2 hover:z-20 relative transform-gpu bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  Mission Planning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Intelligent conversation flows that help you plan, strategize, and execute complex projects with AI guidance.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Code Assistant Card - Larger */}
            <Card className="group cursor-pointer border border-gray-200 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 hover:border-green-300 hover:-translate-y-2 hover:z-20 relative transform-gpu bg-gradient-to-br from-green-50 to-emerald-100 md:col-span-2 lg:col-span-1 lg:row-span-2">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                  Code Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Advanced AI coding companion that reads, analyzes, and modifies your codebase. From debugging to feature implementation.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Terminal className="h-4 w-4 mr-2" />
                    Run commands and tests
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="h-4 w-4 mr-2" />
                    Analyze entire codebases
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Zap className="h-4 w-4 mr-2" />
                    Real-time modifications
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Management Card */}
            <Card className="group cursor-pointer border border-gray-200 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-300 hover:-translate-y-2 hover:z-20 relative transform-gpu bg-gradient-to-br from-purple-50 to-pink-100">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                  Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Centralized knowledge management with AI-powered search, document analysis, and intelligent insights.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Team Collaboration Card */}
            <Card className="group cursor-pointer border border-gray-200 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-300 hover:-translate-y-2 hover:z-20 relative transform-gpu bg-gradient-to-br from-indigo-50 to-cyan-100 md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                  Team Collaboration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Seamless team workflows with shared missions, collaborative coding sessions, and unified knowledge sharing.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Customization Card */}
            <Card className="group cursor-pointer border border-gray-200 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 hover:border-orange-300 hover:-translate-y-2 hover:z-20 relative transform-gpu bg-gradient-to-br from-orange-50 to-yellow-100">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-orange-700 transition-colors">
                  Business Custom Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Tailored AI solutions that adapt to your specific industry needs and workflow requirements.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Showcase Section */}
      <section id="use-cases-showcase" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Real-World Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our collection of production-ready applications built with Talosy. 
              From SaaS platforms to e-commerce stores, see what's possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Swift Productivity SaaS */}
            <a 
              href={`${getBaseUrl()}/use-cases/swift-productivity-saas/`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 overflow-hidden border border-gray-100">
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                  {/* Project Image Overlay */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-50 mix-blend-overlay"
                    style={{
                      backgroundImage: `url(${getBaseUrl()}/use-cases/static/images/swift-productivity-saas.png)`
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg">Swift Productivity</h3>
                    <p className="text-blue-100 text-sm">Team SaaS Platform</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Complete team management platform with task tracking, collaboration tools, and analytics dashboard.
                  </p>
                  <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:text-purple-600 transition-colors">
                    View Project <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </div>
            </a>

            {/* Melodic Stream Hub */}
            <a 
              href={`${getBaseUrl()}/use-cases/melodic-stream-hub/`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 overflow-hidden border border-gray-100">
                <div className="h-48 bg-gradient-to-br from-purple-500 to-blue-600 relative overflow-hidden">
                  {/* Project Image Overlay */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-50 mix-blend-overlay"
                    style={{
                      backgroundImage: `url(${getBaseUrl()}/use-cases/static/images/melodic-stream-hub-1.png)`
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Music className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg">Melodic Stream</h3>
                    <p className="text-purple-100 text-sm">Music Streaming</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Spotify-like music streaming platform with playlist creation, artist pages, and audio controls.
                  </p>
                  <div className="mt-4 flex items-center text-purple-600 text-sm font-medium group-hover:text-blue-600 transition-colors">
                    View Project <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </div>
            </a>

            {/* Swift Feast Delivery */}
            <a 
              href={`${getBaseUrl()}/use-cases/swift-feast-delivery/`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 overflow-hidden border border-gray-100">
                <div className="h-48 bg-gradient-to-br from-orange-500 to-red-600 relative overflow-hidden">
                  {/* Project Image Overlay */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-50 mix-blend-overlay"
                    style={{
                      backgroundImage: `url(${getBaseUrl()}/use-cases/static/images/swift-feast-delivery.png)`
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg">Swift Feast</h3>
                    <p className="text-orange-100 text-sm">Food Delivery App</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Modern food delivery platform with real-time tracking, payment integration, and restaurant management.
                  </p>
                  <div className="mt-4 flex items-center text-orange-600 text-sm font-medium group-hover:text-red-600 transition-colors">
                    View Project <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </div>
            </a>

            {/* Sparkle Jewel Boutique */}
            <a 
              href={`${getBaseUrl()}/use-cases/sparkle-jewel-boutique/`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 overflow-hidden border border-gray-100">
                <div className="h-48 bg-gradient-to-br from-pink-500 to-purple-600 relative overflow-hidden">
                  {/* Project Image Overlay */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-50 mix-blend-overlay"
                    style={{
                      backgroundImage: `url(${getBaseUrl()}/use-cases/static/images/sparkle-jewel-boutique-1.png)`
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg">Sparkle Jewel</h3>
                    <p className="text-pink-100 text-sm">Luxury E-commerce</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Elegant jewelry e-commerce store with 3D product visualization and premium shopping experience.
                  </p>
                  <div className="mt-4 flex items-center text-pink-600 text-sm font-medium group-hover:text-purple-600 transition-colors">
                    View Project <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </div>
            </a>
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

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Talosy?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Lightning Fast</h3>
              <p className="text-gray-600">
                Instant responses and real-time processing that keeps up with your pace
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">AI-Powered</h3>
              <p className="text-gray-600">
                Advanced AI models that understand context and deliver intelligent insights
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Universal</h3>
              <p className="text-gray-600">
                Works with any codebase, any language, and any workflow
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Building the Future of
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}Intelligent Work
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                At Talosy, we believe that artificial intelligence should amplify human creativity, 
                not replace it. Our platform is designed to understand your unique workflow and 
                provide intelligent assistance that feels natural and intuitive.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                From mission planning to code development, from knowledge management to team 
                collaboration, we're building tools that help you achieve more while working smarter.
              </p>
              <div className="flex items-center space-x-6 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">10k+</div>
                  <div className="text-sm text-gray-500">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">50k+</div>
                  <div className="text-sm text-gray-500">Projects Created</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <Sparkles className="h-12 w-12 mb-6" />
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-blue-100 leading-relaxed">
                  "Empowering you to accomplish your missions effortlessly with AI."
                </p>
                <div className="mt-6 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Talosy Team</div>
                    <div className="text-blue-200 text-sm">Tailored operating system</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/CTA Section */}
      <section id="contact" className="py-20 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using Talosy to build better, faster, and smarter.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Talosy</span>
              </div>
              <p className="text-gray-400 text-sm">
                Intelligent AI platform for modern teams. Building the future of work, one mission at a time.
              </p>
              <div className="mt-4">
                <p className="text-gray-300 text-sm font-semibold">Business Inquiries:</p>
                <a href="mailto:business@talosy.com" className="text-blue-400 hover:text-blue-300 text-sm">
                  business@talosy.com
                </a>
              </div>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-white cursor-pointer">Features</a></li>
                <li><a href="#gallery" className="text-gray-400 hover:text-white cursor-pointer">Solutions</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Pricing</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="text-gray-400 hover:text-white cursor-pointer">About Us</a></li>
                <li><a href="#gallery" className="text-gray-400 hover:text-white cursor-pointer">Business</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Blog</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white cursor-pointer">Contact</a></li>
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

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
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

export default Home;