import React from 'react';
import { ProjectCard } from './ProjectCard';
import { FolderOpen } from 'lucide-react';
import { ProjectResponse } from '@/utils/codeAgentApi';

interface ProjectListProps {
  projects: ProjectResponse[];
  onProjectSelect: (project: ProjectResponse) => void;
  onProjectDelete: (project: ProjectResponse) => void;
}

export function ProjectList({ projects, onProjectSelect, onProjectDelete }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-400 text-lg font-medium">No projects yet</div>
        <p className="text-gray-500 mt-2">Create your first project using the input below</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-visible p-4">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id}
          project={project}
          onClick={() => onProjectSelect(project)}
          onDelete={onProjectDelete}
        />
      ))}
    </div>
  );
}