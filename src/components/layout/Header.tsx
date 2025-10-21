import React from 'react';

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

interface HeaderProps {
  showNavigation?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showNavigation = true }) => {
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

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="/" onClick={handleLogoClick} className="flex items-center space-x-2 cursor-pointer">
            <img src="/favicon-192x192.png" alt="Talosy" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold text-gray-900">Talosy</span>
          </a>

          {/* Navigation Links */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-8">
              <NavigationItem href="#use-cases-showcase" onClick={scrollToSection('use-cases-showcase')}>
                Examples
              </NavigationItem>
              <NavigationItem href="#gallery" onClick={scrollToSection('gallery')}>
                Services
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
          )}
        </div>
      </div>
    </header>
  );
};
