const _HTTP_BASE = import.meta.env.VITE_TALOSY_BACKEND_HOST || 'http://localhost:8000';

export const BASE_URL = `${_HTTP_BASE}/api/v1`;
export const WS_BASE = `${_HTTP_BASE.replace(/^https/, 'wss').replace(/^http/, 'ws')}/api/v1`;

export const LANGUAGES = ['Swedish', 'English'];

// Shared palette for the language pages — mirrors the Talosy site theme
// (white surfaces, gray-scale text, blue→purple gradient accents)
export const T = {
  bg: '#f9fafb',
  panel: '#ffffff',
  chip: '#eef2ff',
  border: '#e5e7eb',
  text: '#111827',
  muted: '#6b7280',
  faint: '#9ca3af',
  purple: '#7c3aed',
  purpleSoft: '#8b5cf6',
  purpleDim: '#a78bfa',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  // Primary-CTA gradient, same as the site's Sign In button
  gradient: 'linear-gradient(to right, #3b82f6, #9333ea)',
} as const;
