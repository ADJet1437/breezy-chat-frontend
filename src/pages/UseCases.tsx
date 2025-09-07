import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, Globe, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/utils/apiConfig';
import { codeAgentAPI } from '@/utils/codeAgentApi';

interface UseCase {
  id: string;
  code_agent_id: string;
  title: string;
  url: string;
  image_url: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const UseCases: React.FC = () => {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUseCases = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/v1/use-cases/'));
      if (!response.ok) {
        throw new Error('Failed to fetch use cases');
      }
      const data = await response.json();
      setUseCases(data);
    } catch (error) {
      console.error('Error fetching use cases:', error);
      toast({
        title: "Error",
        description: "Failed to load use cases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUseCases();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openUseCase = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading use cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">

        {useCases.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No use cases yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Use cases will appear here once they're published.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-visible p-4">
            {useCases.map((useCase) => (
              <Card 
                key={useCase.id} 
                className="group cursor-pointer border border-gray-200 bg-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-300 relative transform-gpu overflow-hidden"
                onClick={() => openUseCase(useCase.url)}
              >
                {/* Main Image */}
                <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                  <img
                    src={useCase.image_url}
                    alt={useCase.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-2xl text-gray-400" style={{display: 'none'}}>
                    📷
                  </div>
                </div>
                
                {/* Description */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {useCase.description || "No description available"}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UseCases;