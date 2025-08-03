
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MissionContextType {
  currentMissionId: string | null;
  setCurrentMissionId: (id: string | null) => void;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export const useMissionContext = () => {
  const context = useContext(MissionContext);
  if (context === undefined) {
    throw new Error('useMissionContext must be used within a MissionProvider');
  }
  return context;
};

interface MissionProviderProps {
  children: ReactNode;
}

const CURRENT_MISSION_KEY = 'talosy_current_mission_id';

export const MissionProvider: React.FC<MissionProviderProps> = ({ children }) => {
  const [currentMissionId, setCurrentMissionIdState] = useState<string | null>(() => {
    // Load from localStorage on initialization
    try {
      return localStorage.getItem(CURRENT_MISSION_KEY);
    } catch {
      return null;
    }
  });

  // Wrapper to persist to localStorage
  const setCurrentMissionId = (id: string | null) => {
    setCurrentMissionIdState(id);
    try {
      if (id) {
        localStorage.setItem(CURRENT_MISSION_KEY, id);
      } else {
        localStorage.removeItem(CURRENT_MISSION_KEY);
      }
    } catch (error) {
      console.warn('Failed to persist current mission ID to localStorage:', error);
    }
  };

  return (
    <MissionContext.Provider value={{ currentMissionId, setCurrentMissionId }}>
      {children}
    </MissionContext.Provider>
  );
};
