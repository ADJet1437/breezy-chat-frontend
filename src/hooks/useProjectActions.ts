import { useState, useRef } from 'react';
import { useToast } from './use-toast';
import { codeAgentAPI } from '../utils/codeAgentApi';
import { authenticatedPost } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';
import { Message } from '../types/chat';

interface ProjectData {
  project_id: string;
  project_name: string;
  project_path: string;
  session_id: string;
}

interface UseProjectActionsProps {
  projectData: ProjectData | null;
  setProjectData: React.Dispatch<React.SetStateAction<ProjectData | null>>;
  projectDataRef: React.MutableRefObject<ProjectData | null>;
  setShowRightPanel: (show: boolean) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  missionId?: string;
  currentMissionId: string | null;
  presentationHtml: string;
  accessToken: string | null;
}

interface UseProjectActionsReturn {
  isLoadingPreview: boolean;
  handleDeleteProject: () => Promise<void>;
  handleDownloadProject: () => Promise<void>;
  handleView: () => Promise<void>;
  handleExportPDF: () => void;
}

export const useProjectActions = (props: UseProjectActionsProps): UseProjectActionsReturn => {
  const {
    projectData,
    setProjectData,
    projectDataRef,
    setShowRightPanel,
    setMessages,
    missionId,
    currentMissionId,
    presentationHtml,
    accessToken
  } = props;

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const { toast } = useToast();

  const handleDeleteProject = async () => {
    if (!projectData?.project_id) return;

    const confirmed = window.confirm('Are you sure you want to delete this project? This action cannot be undone.');
    if (!confirmed) return;

    // Use only explicit missionId prop - no fallback to avoid race conditions
    const effectiveMissionId = missionId;
    if (!effectiveMissionId) {
      toast({
        title: "Error",
        description: "No mission found to record deletion.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      await codeAgentAPI.deleteAgent(projectData.project_id);

      const deletionMessage: Message = {
        id: Date.now().toString(),
        content: `⎿ User deleted project ${projectData.project_id}`,
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, deletionMessage]);

      try {
        await authenticatedPost(buildApiUrl(`/api/v1/missions/${effectiveMissionId}/task-messages`), {
          role: "assistant",
          content: `⎿ User deleted project ${projectData.project_id}`,
        });
      } catch (messageError) {
        // Don't fail if message saving fails
      }

      setShowRightPanel(false);
      setProjectData(null);
      projectDataRef.current = null;

      toast({
        title: "Project Deleted",
        description: "The project has been successfully deleted.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the project. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDownloadProject = async () => {
    if (!projectData?.project_id) return;

    try {
      const token = accessToken || localStorage.getItem('talosy_access_token');
      const headers: HeadersInit = {
        'Accept': 'application/zip, application/octet-stream, */*'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        buildApiUrl(`/api/v1/code-agent/agents/${projectData.project_id}/download`),
        {
          method: 'GET',
          headers,
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed: ${response.status} ${errorText}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `tls-project-${projectData.project_id}.zip`;

      if (contentDisposition && contentDisposition.includes('filename=')) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast({
        description: "Success!",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the project. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleView = async () => {
    if (!projectData?.project_id) return;

    setIsLoadingPreview(true);
    try {
      const response = await codeAgentAPI.buildAndServeProject(projectData.project_id);

      if (response.success && response.preview_url) {
        window.open(response.preview_url, '_blank');
      } else {
        toast({
          title: "Preview Failed",
          description: response.message || 'Failed to build project preview',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Failed to open project preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExportPDF = () => {
    if (!presentationHtml) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(presentationHtml);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return {
    isLoadingPreview,
    handleDeleteProject,
    handleDownloadProject,
    handleView,
    handleExportPDF
  };
};
