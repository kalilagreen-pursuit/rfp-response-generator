import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { QuestionMarkCircleIcon, Bars3Icon, ArrowRightOnRectangleIcon } from './icons';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { openTour } = useAppContext();
  const { logout } = useAuth();

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
                <button
                    onClick={logout}
                    className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-red-600 transition-colors"
                    title="Logout"
                    aria-label="Logout"
                >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                </button>
            </div>
      </div>
    </header>
  );
};

export default Header;
