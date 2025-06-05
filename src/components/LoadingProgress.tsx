import React from 'react';

interface LoadingProgressProps {
  progress: number;
  currentStep: number;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({ progress, currentStep }) => {
  const steps = [
    { id: 1, label: 'Verifying' },
    { id: 2, label: 'Authenticating' },
    { id: 3, label: 'Redirecting' }
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-cyan-600 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between items-center">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                currentStep >= step.id
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {step.id}
            </div>
            <span
              className={`mt-2 text-sm font-medium transition-colors duration-300 ${
                currentStep === step.id
                  ? 'text-teal-600'
                  : currentStep > step.id
                  ? 'text-gray-600'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingProgress;