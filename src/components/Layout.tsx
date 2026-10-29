
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

/**
 * The sidebar's width, and the room the content leaves for it, come from
 * these two numbers and nowhere else.
 *
 * They used to be expressed twice: the sidebar as `w-72` / `w-[68px]`, and
 * the content as `md:ml-72` / `md:ml-[68px]`. Two declarations of one fact
 * can disagree, and they did -- the responsive prefix on the margin meant it
 * applied on a rule the sidebar's own width did not follow, so the content
 * could sit underneath a sidebar that was still drawn full width. Inline
 * styles rather than classes, because a number cannot be purged, cannot be
 * overridden by a stale stylesheet, and renders the same in every build.
 */
export const SIDEBAR_WIDTH = 288; // w-72
export const RAIL_WIDTH = 68;     // collapsed
export const MOBILE_BREAKPOINT = 768;

/**
 * How wide the sidebar is, and how much room the content leaves for it.
 *
 * Returned together from one function so the two can never disagree, which
 * is the failure this replaces: the content sliding underneath a sidebar
 * that was still drawn at full width.
 */
export function layoutGeometry(isMobile: boolean, collapsed: boolean) {
  const sidebarWidth = !isMobile && collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH;
  return {
    sidebarWidth,
    // Below the breakpoint the sidebar is an overlay drawn on top, so the
    // content keeps the whole width and is not pushed off screen.
    contentOffset: isMobile ? 0 : sidebarWidth,
  };
}

const Layout: React.FC<LayoutProps> = ({ children, rightSidebar }) => {
  // Resolved synchronously. Starting at `false` meant the first paint always
  // claimed desktop, so on a narrow window the content rendered with a
  // desktop offset for a frame before correcting itself.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const { isAuthenticated } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
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

  const { sidebarWidth, contentOffset } = layoutGeometry(isMobile, sidebarCollapsed);

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full overflow-x-hidden bg-background">
        {/* Fixed Sidebar - Full Height */}
        <div
          style={{ width: sidebarWidth }}
          className="pointer-events-auto fixed bottom-0 left-0 top-0 z-50 overflow-hidden border-r border-sidebar-border transition-all duration-300"
        >
          <AppSidebar 
            collapsed={sidebarCollapsed} 
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>
        
        {/* Main layout with content */}
        <div className="flex min-h-screen min-w-0">
          {/* Main content area */}
          <div
            style={{ marginLeft: contentOffset }}
            className="pointer-events-auto relative z-20 flex min-w-0 flex-1 flex-col transition-all duration-300"
          >
            {/* Mobile sidebar trigger */}
            <div className="md:hidden p-2 border-b bg-background/80 backdrop-blur-sm">
              <SidebarTrigger />
            </div>
            
            {/* Page content */}
            <main className={`flex min-h-0 min-w-0 flex-1 flex-col ${!isMobile && rightSidebar ? 'md:mr-80' : ''}`}>
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
