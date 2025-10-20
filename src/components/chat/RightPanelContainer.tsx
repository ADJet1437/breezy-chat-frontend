import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, ExternalLink, Menu, Hammer, FileCode, Presentation, Printer, Download, Trash2 } from 'lucide-react';
import { BuildPreview } from '../code-agent/BuildPreview';
import { PresentationPreview } from '../presentation/PresentationPreview';
import { authenticatedGet } from '../../utils/authenticatedFetch';
import { buildApiUrl } from '../../utils/apiConfig';

type ViewMode = 'build' | 'files' | 'presentation';

interface ProjectData {
  project_id: string;
  project_name: string;
  project_path: string;
  session_id: string;
}

interface RightPanelContainerProps {
  projectData: ProjectData | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  presentations: Array<{ id: string; created_at: string }>;
  selectedPresentationId: string | null;
  setSelectedPresentationId: (id: string | null) => void;
  presentationHtml: string;
  setPresentationHtml: (html: string) => void;
  refreshTrigger: number;
  isLoadingPreview: boolean;
  onView: () => void;
  onClose: () => void;
  onExportPDF: () => void;
  onDownloadProject: () => void;
  onDeleteProject: () => void;
}

export const RightPanelContainer: React.FC<RightPanelContainerProps> = ({
  projectData,
  viewMode,
  setViewMode,
  presentations,
  selectedPresentationId,
  setSelectedPresentationId,
  presentationHtml,
  setPresentationHtml,
  refreshTrigger,
  isLoadingPreview,
  onView,
  onClose,
  onExportPDF,
  onDownloadProject,
  onDeleteProject
}) => {
  return (
    <div className="w-[65%] max-w-[65%] flex flex-col overflow-hidden min-w-0" style={{ width: '65%', maxWidth: '65%', minWidth: '0' }}>
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-4 py-1.5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onView}
            disabled={isLoadingPreview}
          >
            {isLoadingPreview ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {/* View Mode Options */}
              {projectData?.project_id && (
                <>
                  <DropdownMenuItem
                    onClick={() => setViewMode('build')}
                    className={viewMode === 'build' ? 'bg-accent' : ''}
                  >
                    <Hammer className="h-4 w-4 mr-2" />
                    Build Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setViewMode('files')}
                    className={viewMode === 'files' ? 'bg-accent' : ''}
                  >
                    <FileCode className="h-4 w-4 mr-2" />
                    Files View
                  </DropdownMenuItem>
                </>
              )}
              {/* Presentation List */}
              {presentations.map((presentation) => (
                <DropdownMenuItem
                  key={presentation.id}
                  onClick={async () => {
                    setViewMode('presentation');
                    setSelectedPresentationId(presentation.id);

                    const response = await authenticatedGet(
                      buildApiUrl(`/api/v1/presentations/${presentation.id}`)
                    );

                    if (response.ok) {
                      const data = await response.json();
                      setPresentationHtml(data.html_content);
                    }
                  }}
                  className={selectedPresentationId === presentation.id && viewMode === 'presentation' ? 'bg-accent' : ''}
                >
                  <Presentation className="h-4 w-4 mr-2" />
                  Presentation - {new Date(presentation.created_at).toLocaleString()}
                </DropdownMenuItem>
              ))}

              {/* Separator between view modes and actions */}
              {(projectData?.project_id || presentations.length > 0) && (
                <DropdownMenuSeparator />
              )}

              {/* Actions */}
              {presentations.length > 0 && viewMode === 'presentation' && (
                <DropdownMenuItem onClick={onExportPDF}>
                  <Printer className="h-4 w-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
              )}
              {projectData?.project_id && (
                <DropdownMenuItem onClick={onDownloadProject}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              {projectData?.project_id && (
                <DropdownMenuItem
                  onClick={onDeleteProject}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          onClick={onClose}
          className="p-1 hover:bg-accent rounded-lg transition-colors"
          title="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'presentation' ? (
          <PresentationPreview htmlContent={presentationHtml} />
        ) : projectData?.project_id ? (
          <BuildPreview agentId={projectData.project_id} refreshTrigger={refreshTrigger} />
        ) : null}
      </div>
    </div>
  );
};
