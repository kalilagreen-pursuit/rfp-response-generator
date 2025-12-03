

import React from 'react';
import type { View } from '../types';
import { DocumentIcon, CalendarIcon, FolderIcon, UsersIcon, SearchIcon as DashboardIcon, SparklesIcon, BookOpenIcon, PlusIcon, EmailIcon } from './icons';

const SciLogo = () => (
    <svg width="250" height="50" viewBox="0 0 350 70" className="h-12 w-auto">
        <defs>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800&display=swap');
                .heavy { font-family: 'Montserrat', sans-serif; font-weight: 800; letter-spacing: 0.05em; }
                `}
            </style>
        </defs>
        <g>
            {/* Red Star with SC */}
            <g transform="translate(10, 5)">
                <path d="M29.5,2 L41.25,20.5 L64,21 L45.75,34.5 L50.5,53 L34.5,42.5 L18.5,53 L23.25,34.5 L5,21 L28,20.5 Z" fill="#D91A2A" />
                <path d="M30.8,32.2 C29.4,32.2 28.2,32 27.2,31.6 C26.2,31.2 25.4,30.6 24.8,29.8 L26.6,28.6 C27.4,29.8 28.8,30.4 30.8,30.4 C32,30.4 33,30.2 33.8,29.6 C34.6,29.2 35,28.5 35,27.6 C35,26.6 34.6,25.9 33.8,25.4 C33,25 31.8,24.4 30.2,23.8 C28.6,23.2 27.2,22.6 26.2,22 C25.2,21.4 24.4,20.6 23.8,19.6 C23.2,18.6 23,17.4 23,16 C23,14.6 23.4,13.4 24.2,12.4 C25,11.4 26.2,10.6 27.6,10.2 C29,9.8 30.4,9.6 32,9.6 C34.6,9.6 36.8,10.4 38.4,12 L36.6,13.4 C35.4,12.2 33.8,11.6 32,11.6 C30.8,11.6 29.8,11.8 29,12.4 C28.2,12.8 27.8,13.5 27.8,14.4 C27.8,15.4 28.2,16.1 29,16.6 C29.8,17 31,17.6 32.6,18.2 C34.2,18.8 35.6,19.4 36.6,20 C37.6,20.6 38.4,21.4 39,22.4 C39.6,23.4 39.8,24.6 39.8,26 C39.8,27.6 39.4,28.8 38.6,29.8 C37.8,30.8 36.6,31.6 35.2,32 C33.8,32.4 32.2,32.6 30.8,32.2 Z" fill="white" transform="translate(0, 10)" />
                <path d="M43.6,38 L43.6,10 L40,10 L40,38 L43.6,38 Z M41.8,42 C40.8,42 40,41.2 40,40.2 C40,39.2 40.8,38.4 41.8,38.4 C42.8,38.4 43.6,39.2 43.6,40.2 C43.6,41.2 42.8,42 41.8,42 Z" fill="white" transform="translate(0, 10)" />
            </g>
            {/* Shaun Coggins Inc Text */}
            <text x="85" y="45" fill="white" fontSize="24" className="heavy">
                SHAUN COGGINS INC
            </text>
        </g>
    </svg>
);

interface NavItemProps {
    icon: React.FC<{ className?: string }>;
    label: string;
    view: View;
    currentView: View;
    onViewChange: (view: View) => void;
    tourId?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, view, currentView, onViewChange, tourId }) => (
    <li>
        <button
            data-tour-id={tourId}
            onClick={() => onViewChange(view)}
            className={`flex items-center w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                currentView === view
                ? 'bg-red-700 text-white shadow-inner'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
        >
            <Icon className="h-6 w-6 mr-3 flex-shrink-0" />
            <span className="font-semibold">{label}</span>
        </button>
    </li>
);


interface SidebarProps {
    currentView: View;
    onViewChange: (view: View) => void;
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, onClose }) => {
    const mainNavItems: Omit<NavItemProps, 'currentView' | 'onViewChange'>[] = [
        { view: 'dashboard', label: 'Dashboard', icon: DashboardIcon, tourId: 'dashboard-nav' },
        { view: 'projects', label: 'Projects', icon: FolderIcon, tourId: 'projects-nav' },
        { view: 'crm', label: 'CRM', icon: UsersIcon, tourId: 'crm-nav' },
        { view: 'calendar', label: 'Calendar', icon: CalendarIcon, tourId: 'calendar-nav' },
        { view: 'invitations', label: 'Invitations', icon: EmailIcon, tourId: 'invitations-nav' },
        { view: 'marketplace', label: 'Marketplace', icon: UsersIcon, tourId: 'marketplace-nav' },
    ];
    
    const workspaceNavItems: Omit<NavItemProps, 'currentView' | 'onViewChange'>[] = [
        { view: 'resources', label: 'Resources', icon: UsersIcon, tourId: 'resources-nav' },
        { view: 'playbooks', label: 'Playbooks', icon: BookOpenIcon, tourId: 'playbooks-nav' },
        { view: 'creativeStudio', label: 'Creative Studio', icon: SparklesIcon, tourId: 'creative-studio-nav' },
        { view: 'whitepaperStudio', label: 'Whitepaper Studio', icon: BookOpenIcon, tourId: 'whitepaper-studio-nav' },
    ];

    const profileNavItem: Omit<NavItemProps, 'currentView' | 'onViewChange'> = 
        { view: 'profile', label: 'Company Profile', icon: DocumentIcon, tourId: 'profile-nav' };
    
    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={onClose}></div>}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#19224C] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
                <div className="py-4 mb-4 flex justify-center items-center">
                    <SciLogo />
                </div>
                <div className="px-4 mb-4">
                     <button
                        data-tour-id="create-project-button"
                        onClick={() => onViewChange('createProject')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Create New Project
                    </button>
                </div>
                <nav className="flex-grow overflow-y-auto px-4">
                    <ul className="space-y-2">
                        {mainNavItems.map(item => (
                            <NavItem key={item.view} {...item} currentView={currentView} onViewChange={onViewChange} />
                        ))}
                    </ul>
                    <h3 className="text-xs font-semibold uppercase text-slate-400 mt-6 mb-2 px-3">Workspaces</h3>
                    <ul className="space-y-2">
                         {workspaceNavItems.map(item => (
                            <NavItem key={item.view} {...item} currentView={currentView} onViewChange={onViewChange} />
                        ))}
                    </ul>
                </nav>
                <div className="mt-auto p-4">
                     <ul className="space-y-2 mb-4">
                        <NavItem {...profileNavItem} currentView={currentView} onViewChange={onViewChange} />
                     </ul>
                     <div className="pt-4 border-t border-slate-700 text-center px-2">
                        <p className="text-xs text-slate-400">
                            Copyright by Shaun Coggins Inc 2025 | Powered by <a href="https://www.shauncogginsinc.com" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white underline">Shaun Coggins Inc(www.shauncogginsinc.com)</a>
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
