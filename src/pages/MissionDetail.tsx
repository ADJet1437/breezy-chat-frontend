import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import Layout from '../components/Layout';
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
  const { setCurrentMissionId, setMissionData } = useMissionContext();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [missionDetails, setMissionDetails] = useState<MissionDetails | null>(null);
  const [isLoadingMission, setIsLoadingMission] = useState(true); // Start as true to prevent ChatInterface from fetching

  // No authentication redirect - show empty state instead

  // Update current mission context when viewing a specific mission
  useEffect(() => {
    if (id) {
      setCurrentMissionId(id);
    }
  }, [id, setCurrentMissionId]);

  // Load mission details when entering mission - ALWAYS fetch newest data
  useEffect(() => {
    if (id && isAuthenticated) {
      loadMissionDetails(id);
    } else if (!id || !isAuthenticated) {
      // If no ID or not authenticated, stop loading
      setIsLoadingMission(false);
    }
  }, [id, isAuthenticated]);


  const loadMissionDetails = async (missionId: string) => {
    setIsLoadingMission(true);
    try {
      // ALWAYS fetch newest mission data when entering mission
      const response = await authenticatedGet(buildApiUrl(`/api/v1/missions/${missionId}`));
      if (response.ok) {
        const data = await response.json();
        
        // Set mission details for UI
        setMissionDetails(data);
        
        // Store in context atomically - this prevents ChatInterface from fetching again
        setMissionData(data.id, data.llm_id);
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
    <Layout>
      <ChatInterface missionId={id} missionData={missionDetails} isParentLoading={isLoadingMission} />
    </Layout>
  );
};

export default MissionDetail;