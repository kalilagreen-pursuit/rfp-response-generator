import React, { useMemo, FC, useState } from 'react';
import type { ProjectFolder } from '../types';
import { SearchIcon } from './icons';

// --- Date Helpers ---
const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

const differenceInDays = (dateLeft: Date, dateRight: Date): number => {
    if (!dateLeft || !dateRight) return 0;
    const diffTime = dateLeft.getTime() - dateRight.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- Mock Data (from original file) ---
const MOCK_AVATARS: string[] = [
    'https://images.unsplash.com/photo-1531123414780-f74242c2b052?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
];

const getOwnersForProject = (projectId: string): string[] => {
    const hash = projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const numOwners = (hash % 2) + 1;
    const startIndex = hash % MOCK_AVATARS.length;
    
    if (numOwners === 1) return [MOCK_AVATARS[startIndex]];
    
    const secondIndex = (startIndex + 2) % MOCK_AVATARS.length;
    return [MOCK_AVATARS[startIndex], MOCK_AVATARS[secondIndex]];
};


// --- Sub-components for Gantt Chart ---

const GanttChartHeader: FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
    const months = useMemo(() => {
        const result: { year: number; month: number; days: number; name: string }[] = [];
        let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            result.push({
                year,
                month,
                days: getDaysInMonth(year, month),
                name: currentDate.toLocaleString('default', { month: 'long' })
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return result;
    }, [startDate, endDate]);

    const totalDays = differenceInDays(endDate, startDate);
    if (totalDays <= 0) return null;

    return (
        <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
            <div className="flex">
                <div className="w-1/3 lg:w-1/4 xl:w-1/5 border-r border-slate-200 flex-shrink-0"></div>
                <div className="flex-grow flex">
                    {months.map(({ year, month, days, name }) => (
                        <div
                            key={`${year}-${month}`}
                            style={{ width: `${(days / totalDays) * 100}%` }}
                            className="flex-shrink-0 border-r border-slate-200 text-center py-2"
                        >
                            <span className="text-sm font-semibold text-slate-600">{name} {year}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GanttProjectBar: FC<{ 
    project: ProjectFolder; 
    chartStartDate: Date; 
    totalChartDays: number;
}> = ({ project, chartStartDate, totalChartDays }) => {
    if (!project.startDate || !project.endDate) return null;

    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);

    const offsetDays = differenceInDays(projectStart, chartStartDate);
    const durationDays = differenceInDays(projectEnd, projectStart) || 1;

    const left = (offsetDays / totalChartDays) * 100;
    const width = (durationDays / totalChartDays) * 100;

    const totalProjectDuration = durationDays > 0 ? durationDays : 1;
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-sky-500', 'bg-pink-500'];

    const ProgressOverlay: FC<{ progress: number }> = ({ progress }) => (
        <div className="absolute top-0 left-0 h-full bg-black bg-opacity-20 rounded" style={{ width: `${progress}%` }}></div>
    );


    return (
        <div
            className="absolute top-1/2 -translate-y-1/2 h-8 rounded group flex items-center"
            style={{ left: `${left}%`, width: `${width}%` }}
        >
            <div className="w-full flex h-full rounded overflow-hidden relative">
                {project.phases && project.phases.length > 1 ? (
                    project.phases.map((phase, index) => {
                        const phaseDuration = differenceInDays(new Date(phase.endDate), new Date(phase.startDate));
                        const widthPercent = (phaseDuration / totalProjectDuration) * 100;
                        const color = colors[index % colors.length];
                        return (
                            <div key={index} className="relative group/phase h-full" style={{ width: `${widthPercent}%` }}>
                                <div className={`${color} h-full transition-all`}></div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover/phase:opacity-100 group-hover/phase:visible transition-opacity duration-200 pointer-events-none z-10">
                                    <span className="font-bold">{phase.name}</span> ({phase.durationWeeks} weeks)
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="w-full h-full bg-blue-500 rounded"></div>
                )}
                <ProgressOverlay progress={project.probability} />
            </div>
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 pointer-events-none z-20">
                <p className="font-bold">{project.proposal.projectName}</p>
                <p>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</p>
                <p>Status: {project.salesStage}</p>
                <p>Progress: {project.probability}%</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
            </div>
        </div>
    );
};

const GanttChart: FC<{ projects: ProjectFolder[]; title: string; }> = ({ projects, title }) => {
    const { chartStartDate, chartEndDate, totalChartDays } = useMemo(() => {
        const validProjects = projects.filter(p => p.startDate && p.endDate);
        if (validProjects.length === 0) return { chartStartDate: null, chartEndDate: null, totalChartDays: 0 };
        
        const startDates = validProjects.map(p => new Date(p.startDate!));
        const endDates = validProjects.map(p => new Date(p.endDate!));
        
        const minDate = new Date(Math.min(...startDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...endDates.map(d => d.getTime())));

        const startDate = addDays(new Date(minDate.getFullYear(), minDate.getMonth(), 1), -15);
        const endDate = addDays(new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0), 15);
        
        return { chartStartDate: startDate, chartEndDate: endDate, totalChartDays: differenceInDays(endDate, startDate) };
    }, [projects]);
    
    const todayPosition = useMemo(() => {
        if (!chartStartDate || !totalChartDays) return -1;
        const offset = differenceInDays(new Date(), chartStartDate);
        return (offset / totalChartDays) * 100;
    }, [chartStartDate, totalChartDays]);

    const titleColors: Record<string, string> = {
      'Active Projects': 'text-blue-600',
      'Upcoming Projects': 'text-purple-600',
      'Completed & Archived': 'text-gray-600'
    };
    
    if (projects.length === 0) return null;

    return (
        <div className="mb-8">
             <h2 className={`text-xl font-bold mb-4 ${titleColors[title] || 'text-slate-800'}`}>{title}</h2>
             <div className="border border-slate-200 rounded-lg overflow-x-auto">
                 <div className="min-w-[1200px]">
                    {chartStartDate && chartEndDate && <GanttChartHeader startDate={chartStartDate} endDate={chartEndDate} />}
                    <div className="relative">
                        {todayPosition >= 0 && todayPosition <= 100 && (
                            <div className="absolute top-0 bottom-0 z-10" style={{ left: `${todayPosition}%` }}>
                                <div className="w-0.5 h-full bg-red-500"></div>
                                <div className="absolute -top-6 -translate-x-1/2 text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">Today</div>
                            </div>
                        )}
                        
                        {projects.map((project) => (
                            <div key={project.id} className="flex border-b border-slate-200 min-h-[60px]">
                                <div className="w-1/3 lg:w-1/4 xl:w-1/5 border-r border-slate-200 flex-shrink-0 p-3 flex items-center">
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-semibold text-slate-800 truncate" title={project.proposal.projectName}>{project.proposal.projectName}</p>
                                        <p className="text-xs text-slate-500">{project.salesStage}</p>
                                    </div>
                                    <div className="flex -space-x-2 ml-2 flex-shrink-0">
                                        {getOwnersForProject(project.id).map((avatar, i) => (
                                            <img key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src={avatar} alt="" />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-grow relative">
                                    {chartStartDate && totalChartDays > 0 && 
                                        <GanttProjectBar project={project} chartStartDate={chartStartDate} totalChartDays={totalChartDays} />
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalendarView: React.FC<{ projects: ProjectFolder[] }> = ({ projects }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = useMemo(() => {
        return projects.filter(p => p.proposal.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [projects, searchTerm]);

    const { active, upcoming, past } = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return filteredProjects.reduce<{ active: ProjectFolder[], upcoming: ProjectFolder[], past: ProjectFolder[] }>((acc, project) => {
            const startDate = project.startDate ? new Date(project.startDate) : null;
            const endDate = project.endDate ? new Date(project.endDate) : null;

            if (project.salesStage === 'Closed-Won' || project.salesStage === 'Closed-Lost' || (endDate && endDate < startOfToday)) {
                acc.past.push(project);
            } else if (startDate && startDate > now) {
                acc.upcoming.push(project);
            } else {
                 acc.active.push(project);
            }
            return acc;
        }, { active: [], upcoming: [], past: [] });
    }, [filteredProjects]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg" data-tour-id="calendar-view">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Project Timeline</h2>
                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search project name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                        aria-label="Search projects"
                    />
                </div>
            </header>

            {projects.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg">
                    <p className="text-slate-500">No projects to display on the timeline.</p>
                     <p className="text-sm text-slate-400 mt-1">Generate a project to see it here.</p>
                </div>
            ) : filteredProjects.length === 0 && searchTerm ? (
                 <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg">
                    <p className="text-slate-500">No projects found for "{searchTerm}".</p>
                    <p className="text-sm text-slate-400 mt-1">Try a different search term.</p>
                </div>
            ) : (
                <div>
                    <GanttChart projects={active} title="Active Projects" />
                    <GanttChart projects={upcoming} title="Upcoming Projects" />
                    <GanttChart projects={past} title="Completed & Archived" />
                </div>
            )}
        </div>
    );
};

export default CalendarView;