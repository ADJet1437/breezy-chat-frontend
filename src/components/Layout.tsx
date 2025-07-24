
import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import Header from './Header';

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

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-50 h-16">
          <Header />
        </div>
        
        {/* Main layout with sidebar and content */}
        <div className="flex pt-16 min-h-screen">
          {/* Fixed Sidebar */}
          <div className="fixed left-0 top-16 bottom-0 z-40">
            <AppSidebar 
              collapsed={sidebarCollapsed} 
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
          
          {/* Main content area */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${
            !isMobile 
              ? sidebarCollapsed 
                ? 'ml-0 md:ml-16' // Collapsed sidebar width
                : 'ml-0 md:ml-64' // Expanded sidebar width
              : ''
          }`}>
            {/* Mobile sidebar trigger */}
            <div className="md:hidden p-2 border-b bg-white/80 backdrop-blur-sm">
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
      </div>
    </SidebarProvider>
  );
};

export default Layout;
