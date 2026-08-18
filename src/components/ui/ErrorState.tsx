import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[50vh] text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-xl font-bold mb-2">عذراً، حدث خطأ</h3>
      <p className="text-neutral-400 max-w-md mb-6">{message}</p>
      
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCcw className="w-4 h-4" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
