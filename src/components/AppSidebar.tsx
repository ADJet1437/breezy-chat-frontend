
import React from 'react';
import { MessageSquare, List, BookOpen, Code, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useMissionContext } from '../contexts/MissionContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AppSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppSidebar({ collapsed = false, onToggleCollapse }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { currentMissionId } = useMissionContext();

  const navigationItems = [
    {
      title: 'Current Mission',
      url: currentMissionId ? `/missions/${currentMissionId}` : '/',
      icon: MessageSquare,
    },
    {
      title: 'Missions',
      url: '/missions',
      icon: List,
    },
    {
      title: 'Knowledge Base',
      url: '/knowledge-base',
      icon: BookOpen,
    },
    {
      title: 'Code',
      url: '/code',
      icon: Code,
    },
  ];

  const isActive = (path: string) => currentPath === path;

  return (
    <TooltipProvider>
      <Sidebar className={`border-r bg-sidebar h-full transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent className="pt-20">
          {/* Toggle Button */}
          <div className="flex justify-end p-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {collapsed ? (
                      // Collapsed view - icon only with tooltip
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild size="lg" className="w-full justify-center px-2">
                            <NavLink 
                              to={item.url} 
                              className={({ isActive }) =>
                                `flex items-center justify-center p-3 text-base font-medium transition-colors ${
                                  isActive 
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                }`
                              }
                            >
                              <item.icon className="h-5 w-5 shrink-0" />
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      // Expanded view - icon and text
                      <SidebarMenuButton asChild size="lg" className="w-full">
                        <NavLink 
                          to={item.url} 
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors ${
                              isActive 
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            }`
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
