
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MissionContextType {
  currentMissionId: string | null;
  currentMissionLlmId: string | null;
  setCurrentMissionId: (id: string | null) => void;
  setMissionData: (missionId: string | null, llmId: string | null) => void;
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
  // Initialize with null values (session-only, no localStorage)
  const [missionState, setMissionState] = useState<{ missionId: string | null, llmId: string | null }>({
    missionId: null,
    llmId: null
  });

  // Setter for mission ID only (session-only, no localStorage)
  const setCurrentMissionId = (id: string | null) => {
    // Prevent redundant updates
    if (missionState.missionId === id) return;

    if (id === null) {
      // Clear both
      setMissionState({ missionId: null, llmId: null });
    } else {
      // Don't preserve llmId when changing mission - let it be set explicitly later
      setMissionState({ missionId: id, llmId: null });
    }
  };

  // Atomic setter for both mission ID and LLM ID (session-only, no localStorage)
  const setMissionData = (missionId: string | null, llmId: string | null) => {
    // Prevent redundant updates
    if (missionState.missionId === missionId && missionState.llmId === llmId) return;

    setMissionState({ missionId, llmId });
  };

  return (
    <MissionContext.Provider value={{
      currentMissionId: missionState.missionId,
      currentMissionLlmId: missionState.llmId,
      setCurrentMissionId,
      setMissionData
    }}>
      {children}
    </MissionContext.Provider>
  );
};
