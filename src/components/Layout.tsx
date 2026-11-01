
import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PanelLeft } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { LoginDialog } from './login';
import { useLocation } from 'react-router-dom';

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
  // The drawer's own state. It used to be shadcn's SidebarTrigger, which
  // toggles the SidebarProvider context -- but the sidebar here is a
  // hand-rolled fixed div that never read that context, so the button
  // fired and nothing moved. On mobile the drawer was permanently
  // translated off screen with no way to bring it back.
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  // Close on navigation. Tapping a nav item otherwise leaves the drawer
  // sitting over the page it just opened, and this catches every route
  // change rather than only the links the sidebar happens to render.
  const { pathname } = useLocation();
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleSignIn = () => {
    setLoginDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="h-screen w-full overflow-hidden bg-background">
        {/* Fixed Sidebar - Full Height */}
        <div className={`fixed left-0 top-0 bottom-0 border-r border-sidebar-border transition-all duration-300 overflow-hidden ${
          !isMobile 
            ? sidebarCollapsed 
              ? 'w-[68px] z-50 pointer-events-auto' // Collapsed
              : 'w-72 z-50 pointer-events-auto' // Expanded
            // Mobile: off-canvas until the trigger opens it. It used to
            // render at full width over the content, which has no left
            // margin on mobile — so the first 288px of every page sat
            // underneath an opaque sidebar.
            : `w-72 z-50 pointer-events-auto ${
                drawerOpen ? 'translate-x-0' : '-translate-x-full'
              }`
        }`}>
          <AppSidebar 
            collapsed={sidebarCollapsed} 
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>
        
        {/* Tapping away closes it, which is what everyone expects of a
            drawer and the only way out on a phone if the trigger scrolls
            out of view. */}
        {isMobile && drawerOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}

        {/* Main layout with content */}
        <div className="flex h-screen min-w-0">
          {/* Main content area */}
          <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 pointer-events-auto ${
            !isMobile 
              ? sidebarCollapsed 
                ? 'ml-0 md:ml-[68px] relative z-40' // Collapsed
                : 'ml-0 md:ml-72 relative z-20' // Expanded
              : 'relative z-20'
          }`}>
            {/* Mobile sidebar trigger */}
            <div className="md:hidden p-2 border-b bg-background/80 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setDrawerOpen(open => !open)}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
                // 40px square: below about 44 a thumb misses it as often
                // as it hits.
                className="flex h-10 w-10 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                <PanelLeft className="h-[18px] w-[18px]" />
              </button>
            </div>
            
            {/* Page content */}
            <main className={`flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden ${!isMobile && rightSidebar ? 'md:mr-80' : ''}`}>
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
