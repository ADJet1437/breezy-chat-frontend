
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
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Global Header */}
        <Header />
        
        <div className="flex flex-1">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            {/* Mobile sidebar trigger */}
            <div className="md:hidden p-2 border-b bg-white/80 backdrop-blur-sm">
              <SidebarTrigger />
            </div>
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
