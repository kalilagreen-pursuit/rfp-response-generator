import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { QuestionMarkCircleIcon, Bars3Icon } from './icons';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { isOfflineMode, setOfflineMode, openTour } = useAppContext();

  return (
    <header className="bg-white shadow-sm flex-shrink-0 z-10">
      <div className="w-full mx-auto py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-between lg:justify-end">
          <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-500 rounded-md lg:hidden"
              aria-label="Open sidebar"
          >
              <Bars3Icon className="h-6 w-6" />
          </button>
            <div className="flex items-center space-x-2 sm:space-x-4">
                <button 
                    onClick={openTour}
                    className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-slate-800 transition-colors"
                    title="Start Guided Tour"
                    aria-label="Start Guided Tour"
                >
                    <QuestionMarkCircleIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center group relative">
                    <label htmlFor="offline-toggle" className="flex items-center cursor-pointer">
                        <span className="mr-3 text-sm font-medium text-slate-600 hidden sm:inline">Offline Mode</span>
                        <div className="relative">
                            <input 
                                id="offline-toggle" 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isOfflineMode}
                                onChange={(e) => setOfflineMode(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </div>
                    </label>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {isOfflineMode 
                            ? "Data is being saved to your browser's local storage."
                            : "Offline mode is disabled. Data will not be saved. Google Drive sync coming soon!"
                        }
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                    </div>
                </div>
            </div>
      </div>
    </header>
  );
};

export default Header;
