import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Calendly integration helper
const openCalendly = () => {
  if (typeof window !== 'undefined' && (window as any).Calendly) {
    (window as any).Calendly.initPopupWidget({
      url: 'https://calendly.com/zijie-liang-talosy/30min'
    });
  } else {
    // Fallback to opening in new tab if widget not loaded
    window.open('https://calendly.com/zijie-liang-talosy/30min', '_blank');
  }
};
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
  Music,
  Database,
  GitBranch,
  Server,
  BarChart3,
  Workflow,
  Shield,
  CheckCircle2,
  Plug
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

const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('hero');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  // Load Calendly widget script
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
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

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
                Services
              </NavigationItem>
              <NavigationItem href="#use-cases-showcase" onClick={scrollToSection('use-cases-showcase')}>
                Case Studies
              </NavigationItem>
              <NavigationItem href="#features" onClick={scrollToSection('features')}>
                Why Us
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
              onClick={openCalendly}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6"
            >
              <Mail className="mr-2 h-4 w-4" />
              Book Consultation
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
              Expert software consultancy delivering RAG systems, agentic AI applications,
              process automation, and enterprise integrations tailored to your needs.
            </p>

            <div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 transform-gpu"
              style={{
                transform: `translateZ(40px)`,
              }}
            >
              <Button
                onClick={openCalendly}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                style={{
                  boxShadow: `
                    0 10px 25px rgba(59, 130, 246, 0.3),
                    ${mousePosition.x * 2}px ${mousePosition.y * 2}px 15px rgba(147, 51, 234, 0.2)
                  `,
                }}
              >
                <Mail className="mr-2 h-5 w-5" />
                Book Free Consultation
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={scrollToSection('gallery')}
                className="px-8 py-4 text-lg border-2 hover:bg-gray-50 backdrop-blur-sm bg-white/80 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                View Our Services
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

      {/* Core Services Value Proposition Section */}
      <section id="gallery" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Expert System Development
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We build intelligent systems that transform your business operations with cutting-edge AI technology
            </p>
          </div>

          {/* Services Value Table */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 shadow-xl mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* RAG Systems */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Database className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">RAG Systems</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      Retrieval-Augmented Generation systems that connect your AI to proprietary data sources.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Custom embedding strategies for your domain</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Vector database optimization & management</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Multi-source document ingestion pipelines</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Semantic search with contextual relevance</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Agentic AI Applications */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <GitBranch className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Agentic AI Coding</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      Autonomous AI agents that understand natural language prompts and build complete applications.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Prompt-to-application development systems</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Multi-agent orchestration frameworks</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Automated testing & code review agents</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Self-healing & adaptive code systems</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Process Automation */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Workflow className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Process Automation</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      End-to-end workflow automation that eliminates manual tasks and accelerates operations.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Business process analysis & redesign</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Intelligent workflow orchestration</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Document processing & data extraction</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Event-driven automation pipelines</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* System Integrations */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Plug className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Enterprise Integrations</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      Seamless connections between your existing tools, platforms, and data sources.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>API design & development</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>Legacy system modernization</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>Third-party service integration</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>Real-time data synchronization</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Data Analysis */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Data Analysis & BI</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      Transform raw data into actionable insights with AI-powered analytics platforms.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span>Custom analytics dashboards</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span>Predictive modeling & forecasting</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span>Natural language query interfaces</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span>Automated reporting systems</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* On-Premises Deployment */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Server className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">On-Premises Setup</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      Secure, private AI deployments within your infrastructure with full data sovereignty.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                        <span>Private cloud & on-prem installations</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                        <span>Air-gapped environment support</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                        <span>Compliance & security hardening</span>
                      </li>
                      <li className="flex items-start text-xs text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                        <span>Custom model fine-tuning & hosting</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Value Proposition Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              End-to-End Implementation & Support
            </h3>
            <p className="text-blue-100 text-lg max-w-3xl mx-auto">
              From initial consultation to deployment and maintenance, we deliver complete solutions that integrate seamlessly with your existing systems and scale with your business needs.
            </p>
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
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine technical excellence with business understanding to deliver solutions that drive real value
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Code className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Production-Ready Code</h3>
              <p className="text-gray-600">
                Clean, maintainable, and scalable solutions built following industry best practices and your team's standards
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Collaborative Approach</h3>
              <p className="text-gray-600">
                We work alongside your team, sharing knowledge and ensuring smooth handoffs with comprehensive documentation
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Rapid Prototyping</h3>
              <p className="text-gray-600">
                From concept to working prototype in weeks, not months. Test ideas quickly and iterate based on feedback
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Security First</h3>
              <p className="text-gray-600">
                Enterprise-grade security practices, compliance expertise, and data protection built into every solution
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Measurable Results</h3>
              <p className="text-gray-600">
                Clear success metrics and KPIs established upfront. We track progress and demonstrate ROI throughout the project
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mb-6">
                <Server className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Flexible Deployment</h3>
              <p className="text-gray-600">
                Cloud, on-premises, or hybrid setups. We adapt to your infrastructure requirements and security policies
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
                Your Trusted
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}AI Consultancy
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

      {/* Contact/CTA Section */}
      <section id="contact" className="py-20 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Let's Build Something Extraordinary
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Schedule a free consultation to discuss your project requirements and discover how we can help you leverage AI to achieve your business goals.
            </p>
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
            <Button
              onClick={openCalendly}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-xl"
            >
              <Mail className="mr-2 h-5 w-5" />
              Schedule Consultation
            </Button>
            <Button
              onClick={handleGetStarted}
              size="lg"
              variant="outline"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
            >
              Try Our Platform
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-blue-100 text-sm mb-2">Prefer email?</p>
            <a href="mailto:support@talosy.com" className="text-white font-semibold text-lg hover:underline">
              support@talosy.com
            </a>
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
                Expert AI consultancy delivering custom software solutions. We transform your business with intelligent automation, RAG systems, and enterprise AI applications.
              </p>
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

export default Overview;