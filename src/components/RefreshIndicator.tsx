import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const RefreshIndicator: React.FC = () => {
  const { isRefreshing, isAuthenticated } = useAuth();

  if (!isAuthenticated || !isRefreshing) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md">
      <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />
      <span className="text-xs text-blue-700 font-medium">Refreshing session</span>
    </div>
  );
};

export default RefreshIndicator;