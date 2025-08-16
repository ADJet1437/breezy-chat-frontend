
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

const CURRENT_MISSION_KEY = 'talosy_current_mission_id';
const CURRENT_MISSION_LLM_KEY = 'talosy_current_mission_llm_id';

// Atomic write - both fields together or nothing
const setMissionDataAtomic = (missionId: string | null, llmId: string | null) => {
  try {
    if (missionId) {
      // Set mission ID
      localStorage.setItem(CURRENT_MISSION_KEY, missionId);
      // Set LLM ID if provided, otherwise remove it
      if (llmId) {
        localStorage.setItem(CURRENT_MISSION_LLM_KEY, llmId);
      } else {
        localStorage.removeItem(CURRENT_MISSION_LLM_KEY);
      }
    } else {
      // Remove both together  
      localStorage.removeItem(CURRENT_MISSION_KEY);
      localStorage.removeItem(CURRENT_MISSION_LLM_KEY);
    }
  } catch (error) {
    // If either operation fails, clean up both to maintain consistency
    localStorage.removeItem(CURRENT_MISSION_KEY);
    localStorage.removeItem(CURRENT_MISSION_LLM_KEY);
    console.warn('Failed to persist mission data atomically:', error);
  }
};

// Atomic read - mission can exist without llmId (uses default)
const getMissionDataAtomic = (): { missionId: string | null, llmId: string | null } => {
  try {
    const missionId = localStorage.getItem(CURRENT_MISSION_KEY);
    const llmId = localStorage.getItem(CURRENT_MISSION_LLM_KEY);
    
    // Mission can exist without LLM ID (will use default)
    return { missionId, llmId };
  } catch {
    return { missionId: null, llmId: null };
  }
};

export const MissionProvider: React.FC<MissionProviderProps> = ({ children }) => {
  // Initialize from atomic read
  const [missionState, setMissionState] = useState(() => {
    return getMissionDataAtomic();
  });

  // Legacy setter for backwards compatibility
  const setCurrentMissionId = (id: string | null) => {
    // Prevent redundant updates
    if (missionState.missionId === id) return;
    
    if (id === null) {
      // Clear both atomically
      setMissionDataAtomic(null, null);
      setMissionState({ missionId: null, llmId: null });
    } else {
      // Don't preserve llmId when changing mission - let it be set explicitly later
      setMissionDataAtomic(id, null);
      setMissionState({ missionId: id, llmId: null });
    }
  };

  // New atomic setter
  const setMissionData = (missionId: string | null, llmId: string | null) => {
    // Prevent redundant updates
    if (missionState.missionId === missionId && missionState.llmId === llmId) return;
    
    setMissionDataAtomic(missionId, llmId);
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
