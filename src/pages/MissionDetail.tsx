import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import { useMissionContext } from '../contexts/MissionContext';

const MissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { setCurrentMissionId } = useMissionContext();

  // Update current mission context when viewing a specific mission
  useEffect(() => {
    if (id) {
      setCurrentMissionId(id);
    }
  }, [id, setCurrentMissionId]);

  return <ChatInterface missionId={id} />;
};

export default MissionDetail;