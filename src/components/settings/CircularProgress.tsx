import React from 'react'
import styles from './CircularProgress.module.css'

interface CircularProgressProps {
  percentage: number
  status: 'low' | 'medium' | 'high'
  size?: number
  strokeWidth?: number
}

export const CircularProgress = ({ 
  percentage, 
  status, 
  size = 120, 
  strokeWidth = 8 
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getStatusColor = (status: string | any) => {
    const statusString = String(status).toLowerCase()
    switch(statusString) {
      case 'low': return {
        stroke: 'url(#green-gradient)',
        glow: '#10B981'
      }
      case 'medium': return {
        stroke: 'url(#orange-gradient)', 
        glow: '#F59E0B'
      }
      case 'high': return {
        stroke: 'url(#red-gradient)',
        glow: '#EF4444'
      }
      default: return {
        stroke: 'url(#green-gradient)',
        glow: '#10B981'
      }
    }
  }

  const { stroke, glow } = getStatusColor(status)

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="green-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#34D399', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#FBBF24', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="red-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#EF4444', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#F87171', stopOpacity: 1 }} />
          </linearGradient>
          {/* Glow Filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          filter={percentage > 80 ? "url(#glow)" : undefined}
          className={`transition-all duration-1000 ease-out ${styles.progressFill}`}
          style={{
            '--stroke-dasharray': strokeDasharray,
            '--stroke-dashoffset-final': strokeDashoffset,
            strokeDashoffset: circumference,
          } as React.CSSProperties}
        />
      </svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div 
            className={`text-2xl font-bold text-gray-900 dark:text-white ${styles.fadeInScale}`}
          >
            {percentage}%
          </div>
        </div>
      </div>
      
    </div>
  )
}