
import React, { useState } from 'react';
import { MessageSquare, List, BookOpen, Code, ChevronLeft, ChevronRight, User, LogOut, LogIn, Plus, Palette, Database, Settings } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useMissionContext } from '../contexts/MissionContext';
import { useAuth } from '../contexts/AuthContext';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoginDialog } from './login';
import { SettingsModal } from './settings';

interface AppSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppSidebar({ collapsed = false, onToggleCollapse }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { currentMissionId, setCurrentMissionId } = useMissionContext();
  const { isAuthenticated, user, logout } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

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
      title: 'Code',
      url: '/code',
      icon: Code,
    },
  ];

  const isActive = (path: string) => currentPath === path;
  
  const getInitials = (email: string, name?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const handleSignIn = () => {
    setLoginDialogOpen(true);
  };

  const handleNewMission = () => {
    setCurrentMissionId(null);
    navigate('/');
  };

  const handlePreferencesClick = () => {
    setSettingsInitialTab('preferences');
    setGlobalSettingsOpen(true);
  };

  const handleKnowledgeBaseClick = () => {
    setSettingsInitialTab('knowledgeBase');
    setGlobalSettingsOpen(true);
  };


  return (
    <TooltipProvider>
      <Sidebar className={`border-r bg-sidebar h-full transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent className="flex flex-col h-full">
          {/* Top Bar with Clean Separated Design */}
          <div className="px-2 pt-2 pb-1 space-y-1">
            {collapsed ? (
              /* Collapsed: Separate toggle and new mission buttons */
              <>
                {/* Expand toggle button */}
                <div className="flex justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleCollapse}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Expand Sidebar</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {/* New Mission button on its own line */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleNewMission}
                      variant="ghost"
                      className="w-full h-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 rounded-lg"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>New Mission</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              /* Expanded: Traditional layout with toggle */
              <div className="flex items-center justify-between">
                <Button
                  onClick={handleNewMission}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg px-3 py-2 transition-all duration-200 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <SidebarGroup className="flex-1 pt-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {collapsed ? (
                      // Collapsed view - icon only with tooltip
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild size="default" className="w-full justify-center px-2">
                            <NavLink 
                              to={item.url} 
                              className={({ isActive }) =>
                                `flex items-center justify-center py-2.5 text-base font-medium transition-colors ${
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

          {/* Profile Section at Bottom */}
          <div className="p-2">
            {isAuthenticated && user ? (
              collapsed ? (
                // Collapsed view - just avatar with dropdown
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full h-12 p-0 rounded-lg hover:bg-sidebar-accent focus:outline-none focus:ring-0 focus:bg-transparent hover:bg-sidebar-accent/50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                        <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm">
                          {getInitials(user.email, user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setGlobalSettingsOpen(true)}>
                      <User className="mr-2 h-4 w-4" />
                      Profile & Plans
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePreferencesClick}>
                      <Palette className="mr-2 h-4 w-4" />
                      Theme
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleKnowledgeBaseClick}>
                      <Database className="mr-2 h-4 w-4" />
                      Knowledge
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Expanded view - full profile section
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start p-2 h-auto rounded-lg hover:bg-sidebar-accent focus:outline-none focus:ring-0 focus:bg-transparent hover:bg-sidebar-accent/50">
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                          <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm">
                            {getInitials(user.email, user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-left flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate">{user.name || 'User'}</p>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setGlobalSettingsOpen(true)}>
                      <User className="mr-2 h-4 w-4" />
                      Profile & Plans
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePreferencesClick}>
                      <Palette className="mr-2 h-4 w-4" />
                      Theme
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleKnowledgeBaseClick}>
                      <Database className="mr-2 h-4 w-4" />
                      Knowledge
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            ) : (
              // Not authenticated - show sign in button
              collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={handleSignIn}
                      variant="ghost" 
                      className="w-full h-12 p-0 rounded-lg hover:bg-sidebar-accent"
                    >
                      <LogIn className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Sign In</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button 
                  onClick={handleSignIn}
                  variant="ghost" 
                  className="w-full justify-start p-2 h-auto rounded-lg hover:bg-sidebar-accent"
                >
                  <div className="flex items-center gap-3">
                    <LogIn className="h-5 w-5" />
                    <span className="text-sm font-medium">Sign In</span>
                  </div>
                </Button>
              )
            )}
          </div>
        </SidebarContent>
      </Sidebar>
      
      {/* Dialogs */}
      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen} 
      />
      <SettingsModal
        isOpen={globalSettingsOpen}
        onClose={() => {
          setGlobalSettingsOpen(false);
          setSettingsInitialTab(undefined);
        }}
        context="global"
        initialTab={settingsInitialTab as any}
      />
    </TooltipProvider>
  );
}
