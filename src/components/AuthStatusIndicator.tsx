import React from 'react';
import { Shield, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTokenTimeRemaining } from '../utils/tokenUtils';

const AuthStatusIndicator: React.FC = () => {
  const { isAuthenticated, isRefreshing, accessToken, tokenExpiresAt } = useAuth();

  if (!isAuthenticated) {
    return null; // Don't show indicator when not authenticated
  }

  const timeRemaining = accessToken ? getTokenTimeRemaining(accessToken) : 0;
  const isExpiringSoon = timeRemaining <= 5 && timeRemaining > 0;
  const isExpired = timeRemaining <= 0;

  const getStatusColor = () => {
    if (isRefreshing) return 'text-blue-500';
    if (isExpired) return 'text-red-500';
    if (isExpiringSoon) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (isRefreshing) return 'Refreshing session...';
    if (isExpired) return 'Session expired';
    if (isExpiringSoon) return `Session expires in ${timeRemaining}min`;
    return 'Session active';
  };

  const getStatusIcon = () => {
    if (isRefreshing) {
      return <RefreshCw className="h-3 w-3 animate-spin" />;
    }
    if (isExpired) {
      return <WifiOff className="h-3 w-3" />;
    }
    if (isExpiringSoon) {
      return <Wifi className="h-3 w-3" />;
    }
    return <Shield className="h-3 w-3" />;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border transition-all duration-300 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>
    </div>
  );
};

export default AuthStatusIndicator;