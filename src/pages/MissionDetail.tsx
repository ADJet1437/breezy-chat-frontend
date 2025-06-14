import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Settings } from 'lucide-react';
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
}

const MissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { setCurrentMissionId } = useMissionContext();
  const { isAuthenticated } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const [missionDetails, setMissionDetails] = useState<MissionDetails | null>(null);
  const [isLoadingMission, setIsLoadingMission] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Customize button with proper mobile-first responsive positioning
  const CustomizeButton = () => (
    <div 
      className={`fixed z-50 transition-all duration-200 ${
        isMobile 
          ? 'bottom-6 right-6'  // Mobile: simple bottom-right
          : `bottom-20 ${showSidebar ? 'right-96' : 'right-6'}`  // Desktop: above input with sidebar adjustment
      }`}
      style={{ 
        marginLeft: 'max(0px, env(safe-area-inset-left))', 
        marginRight: 'max(0px, env(safe-area-inset-right))' 
      }}
    >
      <Button
        onClick={() => setShowSidebar(!showSidebar)}
        size="lg"
        className="rounded-full h-12 w-12 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        title="Customize Mission"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );

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