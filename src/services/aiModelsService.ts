import { authenticatedGet } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';

export interface AIModel {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

export interface AIModelsResponse {
  llms: AIModel[];
}

export const aiModelsService = {
  async getAIModels(): Promise<AIModel[]> {
    const response = await authenticatedGet(buildApiUrl('/api/v1/ai-models'));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch AI models: ${response.status} ${response.statusText}`);
    }
    
    const data: AIModelsResponse = await response.json();
    return data.llms;
  }
};