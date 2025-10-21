import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginDialog } from '../login';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Menu, X } from 'lucide-react';

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
  const { isAuthenticated, user, logout } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Mobile Menu Button */}
          {showNavigation && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}

          {/* Desktop Navigation Links */}
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

              {/* Authentication Button */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setShowLoginDialog(true)}
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  Sign In
                </Button>
              )}
            </nav>
          )}
        </div>

        {/* Mobile Menu */}
        {showNavigation && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <a
                href="#use-cases-showcase"
                onClick={(e) => {
                  scrollToSection('use-cases-showcase')(e);
                  setMobileMenuOpen(false);
                }}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer font-medium px-2 py-2"
              >
                Examples
              </a>
              <a
                href="#gallery"
                onClick={(e) => {
                  scrollToSection('gallery')(e);
                  setMobileMenuOpen(false);
                }}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer font-medium px-2 py-2"
              >
                Services
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  scrollToSection('features')(e);
                  setMobileMenuOpen(false);
                }}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer font-medium px-2 py-2"
              >
                Why Us
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  scrollToSection('about')(e);
                  setMobileMenuOpen(false);
                }}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer font-medium px-2 py-2"
              >
                About
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  scrollToSection('contact')(e);
                  setMobileMenuOpen(false);
                }}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer font-medium px-2 py-2"
              >
                Contact
              </a>

              {/* Mobile Authentication Button */}
              <div className="pt-4 border-t border-gray-200">
                {isAuthenticated && user ? (
                  <Button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setShowLoginDialog(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Login Dialog */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />
    </header>
  );
};
