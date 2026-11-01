import React from 'react'
import { useUsageStats } from '@/hooks/useUsageStats'
import { CircularProgress } from './CircularProgress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Calendar, CreditCard, TrendingUp, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from './UsageStatsCard.module.css'

export const UsageStatsCard = () => {
  const { data: usageStats, isLoading, error, refetch, isRefetching } = useUsageStats()

  if (isLoading) {
    return <UsageStatsCardSkeleton />
  }

  if (error) {
    return <UsageStatsCardError onRetry={() => refetch()} error={error} />
  }

  if (!usageStats) {
    return null
  }

  // Normalize data with fallback values
  const stats = {
    current_usage: usageStats.current_usage ?? 0,
    // No invented ceiling here: the limit is enforced server-side now, and a
    // guessed 1000 would read as headroom the plan does not have.
    monthly_limit: usageStats.monthly_limit ?? 0,
    remaining_credits: usageStats.remaining_credits ?? 0,
    usage_percentage: usageStats.usage_percentage ?? 0,
    status: usageStats.status ?? 'low',
    days_remaining: usageStats.days_remaining ?? 0,
    plan_name: usageStats.plan_name ?? 'Unknown',
    reset_date: usageStats.reset_date ?? new Date().toISOString(),
  }

  const getStatusBadgeColor = (status: string | any) => {
    const statusString = String(status).toLowerCase()
    switch(statusString) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Usage This Month</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadgeColor(stats.status)}>
              {String(stats.status).charAt(0).toUpperCase() + String(stats.status).slice(1)} Usage
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Circular Progress */}
          <div className="flex-shrink-0">
            <CircularProgress
              percentage={stats.usage_percentage}
              status={stats.status}
              size={140}
              strokeWidth={10}
            />
          </div>
          
          {/* Usage Details */}
          <div className="flex-1 space-y-4 w-full">
            {/* Credits Used */}
            <div className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${styles.slideInRight} ${styles.delay200}`}>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Credits Used
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.current_usage.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  of {stats.monthly_limit.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Remaining Credits */}
            <div className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${styles.slideInRight} ${styles.delay300}`}>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Remaining
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.remaining_credits.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  credits left
                </div>
              </div>
            </div>

            {/* Plan Info & Reset Date */}
            <div className={`flex items-center justify-between text-sm ${styles.slideInRight} ${styles.delay400}`}>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>{stats.plan_name} Plan</span>
              </div>
              <div className="text-gray-500">
                Resets in {stats.days_remaining} days
                <div className="text-xs">
                  ({formatDate(stats.reset_date)})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Warning */}
        {stats.status === 'high' && (
          <div className={`mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${styles.slideInUp} ${styles.delay600}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-red-800 dark:text-red-300">
                  High usage detected
                </div>
                <div className="text-red-600 dark:text-red-400">
                  You're using {stats.usage_percentage}% of your monthly limit. 
                  Consider upgrading your plan to avoid interruptions.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Loading Skeleton Component
const UsageStatsCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Skeleton className="h-[140px] w-[140px] rounded-full" />
        <div className="flex-1 space-y-4 w-full">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// Error Component
const UsageStatsCardError = ({ onRetry, error }: { onRetry: () => void; error?: any }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load usage stats
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We couldn't fetch your usage information. Please try again.
          {error && (
            <div className="mt-2 text-xs text-red-500">
              {error.message || JSON.stringify(error)}
            </div>
          )}
        </p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </CardContent>
  </Card>
)