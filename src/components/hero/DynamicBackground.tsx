import React, { useState, useEffect, useRef } from 'react';
import { Code, Bot, Sparkles } from 'lucide-react';

interface DynamicBackgroundProps {
  className?: string;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ className = '' }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse movement tracking for 3D parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isOverContainer = e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (isOverContainer) {
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

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
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
  );
};
