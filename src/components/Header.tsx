
import React, { useState } from 'react';
import { Plus, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMissionContext } from '../contexts/MissionContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginDialog from './LoginDialog';

const Header = () => {
  const { currentMissionId, setCurrentMissionId } = useMissionContext();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const handleNewMission = () => {
    setCurrentMissionId(null);
    navigate('/');
    toast({
      description: "New mission started!",
      duration: 2000,
    });
  };

  const handleSignIn = () => {
    setLoginDialogOpen(true);
  };

  const handleSignOut = async () => {
    await logout();
    toast({
      description: "Successfully signed out!",
      duration: 2000,
    });
  };

  return (
    <>
      <div className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between h-full">
          <Button
            onClick={handleNewMission}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Mission
          </Button>
          
          {isAuthenticated ? (
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-2 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button
              onClick={handleSignIn}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-2 transition-all duration-200"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>
      
      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen} 
      />
    </>
  );
};

export default Header;
