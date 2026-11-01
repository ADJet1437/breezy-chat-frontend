import React, { useCallback, useEffect, useState } from 'react';
import {
  AppWindow,
  ChevronDown,
  Clock,
  Database,
  Grid2x2,
  LayoutPanelLeft,
  LogIn,
  LogOut,
  Monitor,
  Palette,
  Plus,
  Smile,
  User,
} from 'lucide-react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useShortcut } from '@/hooks/useShortcut';
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
import { SidebarRecents } from './SidebarRecents';

interface AppSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Items with a `url` navigate; the rest name surfaces that do not exist yet and
 * are rendered inert rather than routed somewhere wrong. Give one a `url` when
 * its page lands.
 *
 * Everything unfinished carries a Beta badge, and Home deliberately does not:
 * a badge on every row says nothing, and the one row without it is what makes
 * the others readable. Drop an item's badge when its surface is finished, at
 * the same time as it gains a `url`.
 */
const BETA = 'Beta';

const PRIMARY_ITEMS = [
  { title: 'Home', icon: Smile, url: '/' },
  { title: 'Scheduled Tasks', icon: Clock, badge: BETA },
];

const TOOL_ITEMS = [
  { title: 'Slides', icon: Monitor, badge: BETA },
  { title: 'Apps', icon: Grid2x2, badge: BETA },
  { title: 'Websites', icon: AppWindow, badge: BETA },
];

type NavItem = { title: string; icon: React.ElementType; url?: string; badge?: string };

export function AppSidebar({ collapsed = false, onToggleCollapse }: AppSidebarProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<string | undefined>(undefined);
  const [toolsOpen, setToolsOpen] = useState(true);
  const navigate = useNavigate();

  // The sidebar badge has advertised ⌘K since the button existed; nothing
  // was listening for it. The only global shortcut in the app is shadcn's
  // sidebar toggle on ⌘B.
  const startNewChat = useCallback(() => navigate('/'), [navigate]);
  useShortcut('k', startNewChat);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const validGlobalTabs = ['profile', 'plans', 'preferences', 'usage', 'account', 'knowledgeBase'];
    const tabParam = searchParams.get('tab');
    if (tabParam && validGlobalTabs.includes(tabParam)) {
      setSettingsInitialTab(tabParam);
      setGlobalSettingsOpen(true);
    }
  }, [searchParams]);

  const handleSettingsTabChange = (tab: string) => {
    setSearchParams(prev => { prev.set('tab', tab); return prev; });
  };

  const handleSettingsClose = () => {
    setGlobalSettingsOpen(false);
    setSettingsInitialTab(undefined);
    setSearchParams(prev => { prev.delete('tab'); return prev; });
  };

  const getInitials = (email: string, name?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const itemClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      active
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
    }`;

  const renderItem = (item: NavItem) => {
    const body = (
      <>
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && (
          <>
            <span className="truncate">{item.title}</span>
            {item.badge && (
              <span className="ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/70">
                {item.badge}
              </span>
            )}
          </>
        )}
      </>
    );

    const node = item.url ? (
      <NavLink
        to={item.url}
        end
        className={({ isActive }) => itemClass(isActive) + (collapsed ? ' justify-center px-0' : '')}
      >
        {body}
      </NavLink>
    ) : (
      <button
        type="button"
        disabled
        title={`${item.title} — not available yet`}
        className={itemClass(false) + (collapsed ? ' justify-center px-0' : '') + ' cursor-default opacity-50'}
      >
        {body}
      </button>
    );

    if (!collapsed) return <li key={item.title}>{node}</li>;

    return (
      <li key={item.title}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{node}</div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.title}</p>
          </TooltipContent>
        </Tooltip>
      </li>
    );
  };

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col bg-sidebar">
        {/* Mark and panel toggle. The toggle renders in both states -- when it
            was hidden while collapsed, collapsing the sidebar removed the only
            control that could undo it. Collapsed it sits under the mark, since
            the rail is too narrow to hold both side by side. */}
        <div
          className={`flex px-3 pt-3 ${
            collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'
          }`}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Home"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background"
          >
            T
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-sidebar-foreground/60"
                onClick={onToggleCollapse}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <LayoutPanelLeft className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="text-xs">
                Expand sidebar
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* New task */}
        <div className="px-3 pt-4">
          <button
            type="button"
            onClick={startNewChat}
            className={`flex w-full items-center gap-3 rounded-xl border border-sidebar-border px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Plus className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && (
              <>
                <span>New Chat</span>
                <span className="ml-auto flex items-center gap-1 text-[11px] text-sidebar-foreground/40">
                  <kbd className="rounded border border-sidebar-border px-1">⌘</kbd>
                  <kbd className="rounded border border-sidebar-border px-1">K</kbd>
                </span>
              </>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 pt-4">
          <ul className="space-y-0.5">{PRIMARY_ITEMS.map(renderItem)}</ul>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setToolsOpen(v => !v)}
              aria-expanded={toolsOpen}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/45 transition-colors hover:text-sidebar-foreground"
            >
              <span className="w-[18px] text-center leading-none">···</span>
              <span>Collapse</span>
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${toolsOpen ? '' : '-rotate-90'}`} />
            </button>
          )}

          {toolsOpen && <ul className="mt-0.5 space-y-0.5">{TOOL_ITEMS.map(renderItem)}</ul>}
        </nav>

        <SidebarRecents collapsed={collapsed} />

        {/* Profile */}
        <div className="mt-auto p-3">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`h-auto w-full rounded-lg p-2 hover:bg-sidebar-accent/60 ${collapsed ? 'justify-center' : 'justify-start'}`}
                >
                  <div className="flex w-full items-center gap-3">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                      <AvatarFallback className="bg-muted text-xs text-foreground">
                        {getInitials(user.email, user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {!collapsed && <span className="truncate text-sm font-medium">{user.name || 'User'}</span>}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <DropdownMenuItem onClick={() => setGlobalSettingsOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Profile &amp; Plans
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSettingsInitialTab('preferences'); setGlobalSettingsOpen(true); }}>
                  <Palette className="mr-2 h-4 w-4" />
                  Theme
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSettingsInitialTab('knowledgeBase'); setGlobalSettingsOpen(true); }}>
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
            <Button
              onClick={() => setLoginDialogOpen(true)}
              variant="ghost"
              className={`h-auto w-full rounded-lg p-2 hover:bg-sidebar-accent/60 ${collapsed ? 'justify-center' : 'justify-start'}`}
            >
              <div className="flex items-center gap-3">
                <LogIn className="h-[18px] w-[18px]" />
                {!collapsed && <span className="text-sm font-medium">Sign In</span>}
              </div>
            </Button>
          )}
        </div>
      </div>

      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
      <SettingsModal
        isOpen={globalSettingsOpen}
        onClose={handleSettingsClose}
        context="global"
        initialTab={settingsInitialTab as never}
        onTabChange={handleSettingsTabChange}
      />
    </TooltipProvider>
  );
}
