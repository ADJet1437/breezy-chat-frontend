
import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { LoginDialog } from './login';

interface LayoutProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, rightSidebar }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const { isAuthenticated } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check on mount
    checkMobile();

    // Listen for window resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Save sidebar state to localStorage
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    // Listen for localStorage changes to handle programmatic sidebar collapse
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved) {
        const newState = JSON.parse(saved);
        if (newState !== sidebarCollapsed) {
          setSidebarCollapsed(newState);
        }
      }
    };

    // Listen for storage events from other windows/tabs
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes periodically (for same-window changes)
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [sidebarCollapsed]);

  const handleSignIn = () => {
    setLoginDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background">
        {/* Fixed Sidebar - Full Height */}
        <div className={`fixed left-0 top-0 bottom-0 border-r border-sidebar-border transition-all duration-300 overflow-hidden ${
          !isMobile 
            ? sidebarCollapsed 
              ? 'w-[68px] z-50 pointer-events-auto' // Collapsed
              : 'w-72 z-50 pointer-events-auto' // Expanded
            : 'w-72 z-50 pointer-events-auto'
        }`}>
          <AppSidebar 
            collapsed={sidebarCollapsed} 
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>
        
        {/* Main layout with content */}
        <div className="flex min-h-screen">
          {/* Main content area */}
          <div className={`flex-1 flex flex-col transition-all duration-300 pointer-events-auto ${
            !isMobile 
              ? sidebarCollapsed 
                ? 'ml-0 md:ml-[68px] relative z-40' // Collapsed
                : 'ml-0 md:ml-72 relative z-20' // Expanded
              : 'relative z-20'
          }`}>
            {/* Mobile sidebar trigger */}
            <div className="md:hidden p-2 border-b bg-background/80 backdrop-blur-sm">
              <SidebarTrigger />
            </div>
            
            {/* Page content */}
            <main className={`flex-1 flex flex-col min-h-0 ${!isMobile && rightSidebar ? 'md:mr-80' : ''}`}>
              {children}
            </main>
          </div>
          
          {/* Right sidebar */}
          {rightSidebar && (
            <div className="hidden md:block">
              {rightSidebar}
            </div>
          )}
        </div>

        {/* Floating Sign-In Button - Top Right */}
        {!isAuthenticated && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              onClick={handleSignIn}
              variant="outline"
              size="sm"
              className="rounded-lg"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>
        )}

        {/* Login Dialog */}
        <LoginDialog 
          open={loginDialogOpen} 
          onOpenChange={setLoginDialogOpen} 
        />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
