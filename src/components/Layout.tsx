
import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
            <AppSidebar />
          </div>
          
          {/* Main content area */}
          <div className="flex-1 flex flex-col ml-0 md:ml-64">
            {/* Mobile sidebar trigger */}
            <div className="md:hidden p-2 border-b bg-white/80 backdrop-blur-sm">
              <SidebarTrigger />
            </div>
            
            {/* Page content */}
            <main className="flex-1 flex flex-col min-h-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
