import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Code, FileText, MessageSquare } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import MissionCustomizationResponsive from '../components/MissionCustomizationResponsive';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { useMissionContext } from '../contexts/MissionContext';
import { authenticatedGet } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';

interface MissionDetails {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  llm_id: string;
  system_prompt?: string;
  task_messages: any[];
  code_agent: {
    id: string | null;
  };
}

const MissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { setCurrentMissionId } = useMissionContext();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [missionDetails, setMissionDetails] = useState<MissionDetails | null>(null);
  const [isLoadingMission, setIsLoadingMission] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);
  const [isCodeViewOpen, setIsCodeViewOpen] = useState(() => {
    // Check initial state from localStorage
    return localStorage.getItem('missionCodeViewOpen') === 'true';
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // No authentication redirect - show empty state instead

  // Update current mission context when viewing a specific mission
  useEffect(() => {
    if (id) {
      setCurrentMissionId(id);
    }
  }, [id, setCurrentMissionId]);

  // Load mission details to get system prompt
  useEffect(() => {
    if (id && isAuthenticated) {
      loadMissionDetails(id);
    }
  }, [id, isAuthenticated]);

  // Check mobile status
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

  // Handle outside click to close secondary menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSecondaryMenu(false);
      }
    };

    if (showSecondaryMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSecondaryMenu]);

  // Listen for localStorage changes to update code view state
  useEffect(() => {
    const handleStorageChange = () => {
      const codeViewState = localStorage.getItem('missionCodeViewOpen') === 'true';
      setIsCodeViewOpen(codeViewState);
    };

    // Listen for storage events from other windows/tabs
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes periodically (for same-window changes)
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadMissionDetails = async (missionId: string) => {
    setIsLoadingMission(true);
    try {
      const response = await authenticatedGet(buildApiUrl(`/api/v1/missions/${missionId}`));
      if (response.ok) {
        const data = await response.json();
        setMissionDetails(data);
      }
    } catch (error) {
      console.error('Error loading mission details:', error);
    } finally {
      setIsLoadingMission(false);
    }
  };

  const handleSystemPromptUpdate = (newPrompt: string) => {
    if (missionDetails) {
      setMissionDetails({
        ...missionDetails,
        system_prompt: newPrompt,
      });
    }
  };

  // Contextual floating menu with Settings and Code options
  const CustomizeButton = () => {
    const hasCodeAgent = missionDetails?.code_agent?.id;
    
    return (
      <div 
        ref={menuRef}
        className={`fixed z-50 transition-all duration-200 ${
          isMobile 
            ? 'bottom-32 right-6'  // Mobile: above input bar
            : `bottom-20 ${showSidebar ? 'right-96' : 'right-6'}`  // Desktop: above input with sidebar adjustment
        }`}
        style={{ 
          marginLeft: 'max(0px, env(safe-area-inset-left))', 
          marginRight: 'max(0px, env(safe-area-inset-right))' 
        }}
      >
        {/* Vertical Menu */}
        {showSecondaryMenu && (
          <div className="absolute bottom-16 right-0 flex flex-col space-y-3 pointer-events-none">
            {/* Settings Option - Always visible */}
            <div 
              className="transition-all duration-300 ease-out pointer-events-auto"
              style={{
                transform: showSecondaryMenu 
                  ? 'scale(1) translateY(0)' 
                  : 'scale(0.3) translateY(20px)',
                opacity: showSecondaryMenu ? 1 : 0,
                transitionDelay: '50ms'
              }}
            >
              <Button
                onClick={() => {
                  setShowSecondaryMenu(false);
                  setShowSidebar(true);
                }}
                size="sm"
                className="rounded-full h-10 w-10 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 border-2 border-white"
                title="Mission Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Code Option - Only show if mission has code agent AND code view is NOT open */}
            {hasCodeAgent && !isCodeViewOpen && (
              <div 
                className="transition-all duration-300 ease-out pointer-events-auto"
                style={{
                  transform: showSecondaryMenu 
                    ? 'scale(1) translateY(0)' 
                    : 'scale(0.3) translateY(20px)',
                  opacity: showSecondaryMenu ? 1 : 0,
                  transitionDelay: '100ms'
                }}
              >
                <Button
                  onClick={() => {
                    setShowSecondaryMenu(false);
                    // Trigger code view via ChatInterface
                    const chatInterface = document.querySelector('[data-chat-interface]');
                    if (chatInterface) {
                      const event = new CustomEvent('toggleCodeView');
                      chatInterface.dispatchEvent(event);
                    }
                  }}
                  size="sm"
                  className="rounded-full h-10 w-10 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-2 border-white"
                  title="Code View"
                >
                  <Code className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Main Settings Button */}
        <Button
          onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
          size="lg"
          className="rounded-full h-12 w-12 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          title="Options"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    );
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <Layout>
        <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Authenticating...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show sign-in required state if not authenticated
  if (!isAuthenticated && !authLoading) {
    return (
      <Layout>
        <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Sign in required</h3>
              <p className="text-gray-500 mb-6">Please sign in to view mission details</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout rightSidebar={showSidebar && id && missionDetails ? <div /> : undefined}>
      <ChatInterface missionId={id} rightSidebarVisible={showSidebar} />
      <CustomizeButton />
      
      {/* Responsive Mission Customization */}
      {id && missionDetails && (
        <MissionCustomizationResponsive
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          missionId={id}
          systemPrompt={missionDetails.system_prompt || ''}
          onSystemPromptUpdate={handleSystemPromptUpdate}
        />
      )}
    </Layout>
  );
};

export default MissionDetail;