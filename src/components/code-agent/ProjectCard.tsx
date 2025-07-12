import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Code, Database, Globe, Terminal } from 'lucide-react';
import { ProjectResponse } from '@/utils/codeAgentApi';

interface ProjectCardProps {
  project: ProjectResponse;
  onClick: () => void;
}

const getProjectTypeInfo = (type: string = 'general') => {
  const types = {
    react: { icon: Code, color: 'bg-blue-100 text-blue-700', label: 'React' },
    python: { icon: Terminal, color: 'bg-green-100 text-green-700', label: 'Python' },
    nodejs: { icon: Globe, color: 'bg-yellow-100 text-yellow-700', label: 'Node.js' },
    database: { icon: Database, color: 'bg-purple-100 text-purple-700', label: 'Database' },
    general: { icon: FolderOpen, color: 'bg-gray-100 text-gray-700', label: 'General' },
  };
  return types[type as keyof typeof types] || types.general;
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const projectType = project.settings?.type || 'general';
  const typeInfo = getProjectTypeInfo(projectType);
  const Icon = typeInfo.icon;
  const lastUpdated = new Date(project.updated_at).toLocaleDateString();
  const description = project.description || 'No description available';

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 bg-white"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
            <Icon className="h-3 w-3 inline mr-1" />
            {typeInfo.label}
          </span>
          <span className="text-xs text-gray-500">{lastUpdated}</span>
        </div>
        
        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
          {project.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <CardDescription className="text-gray-600 text-sm mb-4 line-clamp-2">
          {description}
        </CardDescription>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              project.status === 'active' ? 'bg-green-100 text-green-700' :
              project.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
              project.status === 'archived' ? 'bg-gray-100 text-gray-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {project.status || 'active'}
            </span>
          </div>
          
          <div className="text-xs text-gray-400 font-mono truncate">
            {project.directory_path}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}