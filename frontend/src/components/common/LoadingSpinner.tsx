import React from 'react';
import { BrainCircuit } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-indigo-200 opacity-75"></div>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 shadow-lg">
          <BrainCircuit className="h-8 w-8 text-white animate-pulse" />
        </div>
      </div>
      <h2 className="mt-6 text-xl font-semibold text-gray-900">BehaviorIQ</h2>
      <p className="mt-2 text-sm text-gray-500">Loading intelligent insights...</p>
    </div>
  );
}
