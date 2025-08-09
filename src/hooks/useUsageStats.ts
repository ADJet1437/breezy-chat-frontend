import { useQuery } from '@tanstack/react-query'
import { authenticatedGet } from '../utils/authenticatedFetch'
import { buildApiUrl } from '../utils/apiConfig'

export interface UsageStatsResponse {
  current_usage: number
  monthly_limit: number
  remaining_credits: number
  usage_percentage: number
  status: 'low' | 'medium' | 'high'
  days_remaining: number
  plan_name: string
  reset_date: string
}

export const useUsageStats = () => {
  return useQuery({
    queryKey: ['usage-stats'],
    queryFn: async (): Promise<UsageStatsResponse> => {
      const url = buildApiUrl('/api/v1/usage/stats')
      const response = await authenticatedGet(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 60000, // Consider data stale after 1 minute
    retry: 2,
  })
}