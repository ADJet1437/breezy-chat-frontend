import React, { useState } from 'react';

interface ChatBarProps {
  onSubmit: (description: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatBar({ onSubmit, isLoading, placeholder }: ChatBarProps) {
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() && !isLoading) {
      onSubmit(description.trim());
      setDescription('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-4">
      <div className="flex-1 relative">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={placeholder || "What do you want to build?"}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={!description.trim() || isLoading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
}