import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChatInterface from '../components/ChatInterface';
import { useMissionContext } from '../contexts/MissionContext';

interface LocationState {
  initialMessage?: string;
  initialFileIds?: string[];
}

const NewMission: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const { setCurrentMissionId } = useMissionContext();
  const hasInitialized = useRef(false);

  // Clear mission context to ensure no mission_id is sent when creating new mission
  useEffect(() => {
    setCurrentMissionId(null);
  }, [setCurrentMissionId]);

  // Redirect to home if no initial message provided
  useEffect(() => {
    if (!state?.initialMessage && !hasInitialized.current) {
      navigate('/');
    }
  }, [state, navigate]);

  // Prevent re-initialization on re-renders
  useEffect(() => {
    if (state?.initialMessage) {
      hasInitialized.current = true;
    }
  }, [state]);

  if (!state?.initialMessage) {
    return null;
  }

  return (
    <Layout>
      <ChatInterface
        missionId={undefined}
        initialMessage={state.initialMessage}
        initialFileIds={state.initialFileIds || []}
      />
    </Layout>
  );
};

export default NewMission;
