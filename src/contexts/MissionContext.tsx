
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

export const MissionProvider: React.FC<MissionProviderProps> = ({ children }) => {
  const [currentMissionId, setCurrentMissionId] = useState<string | null>(null);

  return (
    <MissionContext.Provider value={{ currentMissionId, setCurrentMissionId }}>
      {children}
    </MissionContext.Provider>
  );
};
