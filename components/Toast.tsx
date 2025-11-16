import React, { useEffect, useState } from 'react';
import type { ToastMessage } from '../types';
import { ExclamationCircleIcon, CheckCircleIcon, CloseIcon, InformationCircleIcon } from './icons';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const icons = {
  error: <ExclamationCircleIcon className="h-6 w-6 text-red-500" />,
  success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
  info: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    setIsFadingOut(true);
    // Wait for animation to finish before calling onDismiss
    setTimeout(() => onDismiss(toast.id), 300); 
  };

  return (
    <div
      role="alert"
      className={`
        max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
        transition-all duration-300 ease-in-out
        ${isFadingOut ? 'opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-2' : 'opacity-100 translate-y-0 sm:translate-x-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{icons[toast.type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-slate-900">
              {toast.type === 'error' ? 'Error' : toast.type === 'success' ? 'Success' : 'Info'}
            </p>
            <p className="mt-1 text-sm text-slate-500">{toast.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className="bg-white rounded-md inline-flex text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Close"
            >
              <span className="sr-only">Close</span>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;