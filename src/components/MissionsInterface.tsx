import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useMissionContext } from '../contexts/MissionContext';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedGet } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';

interface Mission {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  llm_id: string;
  task_messages: any[];
}

interface MissionsResponse {
  missions: Mission[];
}

const MissionsInterface = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentMissionId } = useMissionContext();
  const { isLoading: authLoading, isAuthenticated, authFunctionsReady } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Only fetch missions when auth is ready and user is authenticated
    // We don't need to wait for authFunctionsReady since authenticatedFetch has localStorage fallback
    if (!authLoading && isAuthenticated) {
      console.log('🚀 Auth ready and user authenticated, fetching missions...');
      fetchMissions();
    } else if (!authLoading && !isAuthenticated) {
      console.log('❌ Auth ready but user not authenticated, skipping missions fetch');
      setIsLoading(false);
    } else {
      console.log('⏳ Waiting for auth to be ready...', { authLoading, isAuthenticated, authFunctionsReady });
    }
  }, [authLoading, isAuthenticated]);

  const fetchMissions = async () => {
    try {
      console.log('🎯 === FETCH MISSIONS CALLED ===');
      console.log('🎯 Auth state:', { authLoading, isAuthenticated, authFunctionsReady });
      setIsLoading(true);
      
      const apiUrl = buildApiUrl('/api/v1/missions');
      console.log('🎯 Making request to:', apiUrl);
      
      const response = await authenticatedGet(apiUrl);
      console.log('🎯 Response received:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MissionsResponse = await response.json();
      console.log('🎯 Missions data received:', data);
      setMissions(data.missions);
    } catch (error) {
      console.error('❌ Error fetching missions:', error);
      toast({
        description: "Failed to load missions. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMissionSelect = (missionId: string) => {
    navigate(`/missions/${missionId}`);
    toast({
      description: "Mission loaded successfully!",
      duration: 2000,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">
              {authLoading ? 'Authenticating...' : 'Loading missions...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Sign in required</h3>
            <p className="text-gray-500 mb-6">Please sign in to view your missions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      {/* Missions List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-6">
          {missions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No missions yet</h3>
              <p className="text-gray-500 mb-6">Start a new mission to begin your AI conversation</p>
              <Button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl px-6 py-2"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start First Mission
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {missions.map((mission) => (
                <Card
                  key={mission.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                  onClick={() => handleMissionSelect(mission.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">
                      {mission.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Created: {formatDate(mission.created_at)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Updated: {formatDate(mission.updated_at)}</span>
                    </div>
                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMissionSelect(mission.id);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open Mission
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default MissionsInterface;
