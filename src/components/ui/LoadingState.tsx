import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'جاري التحميل...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[50vh] text-neutral-400">
      <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-4" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
