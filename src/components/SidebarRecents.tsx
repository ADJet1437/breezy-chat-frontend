import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedGet } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';

interface Conversation {
  id: string;
  name: string;
  updated_at: string;
}

/**
 * Conversation history, inline in the sidebar.
 *
 * This replaces the /missions page. A list of past conversations is navigation,
 * not a destination -- sending someone to a separate page to pick one, then to
 * a third page to read it, was a step that earned nothing.
 */
export function SidebarRecents({ collapsed = false }: { collapsed?: boolean }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      return;
    }
    try {
      const response = await authenticatedGet(buildApiUrl('/api/v1/missions'));
      if (!response.ok) return;
      const data = await response.json();
      setConversations(data.missions ?? []);
    } catch {
      // An unreachable list is not worth an error state in the chrome.
    }
  }, [isAuthenticated]);

  // Refetch on navigation: starting a conversation adds one, and the route
  // changing is the cheapest signal that something happened.
  useEffect(() => {
    void load();
  }, [load, location.pathname]);

  if (collapsed || conversations.length === 0) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-2 pt-3">
      <div className="px-2 pb-1 text-xs font-medium text-sidebar-foreground/50">
        Recents
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <NavLink
            key={conversation.id}
            to={`/chat/${conversation.id}`}
            className={({ isActive }) =>
              `block truncate rounded-md px-2 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              }`
            }
            title={conversation.name || 'Untitled'}
          >
            {conversation.name || 'Untitled'}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
