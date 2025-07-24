import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderOpen, Code, Database, Globe, Terminal, MoreVertical, Trash2, ExternalLink } from 'lucide-react';
import { ProjectResponse } from '@/utils/codeAgentApi';

interface ProjectCardProps {
  project: ProjectResponse;
  onClick: () => void;
  onDelete: (project: ProjectResponse) => void;
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

export function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const projectType = project.settings?.type || 'general';
  const typeInfo = getProjectTypeInfo(projectType);
  const Icon = typeInfo.icon;
  const lastUpdated = new Date(project.updated_at).toLocaleDateString();
  const description = project.description || 'No description available';

  return (
    <Card 
      className="group cursor-pointer border border-gray-200 bg-white transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-300 hover:-translate-y-2 hover:z-20 relative transform-gpu"
      onClick={onClick}
    >
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
            <Icon className="h-3 w-3 inline mr-1 group-hover:text-blue-500 transition-colors duration-300" />
            {typeInfo.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{lastUpdated}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuItem 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-700 transition-colors duration-300">
          {project.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <CardDescription className="text-gray-600 text-sm mb-4 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
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
          
          <Button
            className="w-full mt-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg group-hover:scale-105 transition-transform duration-300"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}