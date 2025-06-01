
import React from 'react';
import { Plus, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useMissionContext } from '../contexts/MissionContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const { currentMissionId, setCurrentMissionId } = useMissionContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleNewMission = () => {
    setCurrentMissionId(null);
    navigate('/');
    toast({
      description: "New mission started!",
      duration: 2000,
    });
  };

  const getHeaderContent = () => {
    if (location.pathname === '/missions') {
      return {
        title: 'All Missions',
        subtitle: 'Manage your AI conversations'
      };
    }
    
    return {
      title: currentMissionId ? `Mission: ${currentMissionId.slice(0, 8)}...` : 'AI Assistant',
      subtitle: 'Always here to help'
    };
  };

  const { title, subtitle } = getHeaderContent();

  return (
    <div className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9 bg-gradient-to-r from-blue-500 to-purple-600">
            <AvatarFallback className="text-white">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <Button
          onClick={handleNewMission}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Mission
        </Button>
      </div>
    </div>
  );
};

export default Header;
