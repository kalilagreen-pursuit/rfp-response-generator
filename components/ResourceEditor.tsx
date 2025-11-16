import React, { useState, useMemo } from 'react';
import type { TeamMember } from '../types';
import { EditIcon, DeleteIcon, SaveIcon, PlusIcon, CloseIcon, ChevronDownIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';

const staticProjectOptions = ['General Project Resources', 'Website Development', 'Mobile App Development', 'AI Integration'];

const suggestedRoles = [
    { role: 'Project Manager', lowRate: 90, highRate: 150 },
    { role: 'UX/UI Designer', lowRate: 75, highRate: 110 },
    { role: 'Senior Developer', lowRate: 100, highRate: 125 },
    { role: 'Junior Developer', lowRate: 60, highRate: 85 },
    { role: 'QA Tester', lowRate: 50, highRate: 75 },
    { role: 'DevOps Engineer', lowRate: 95, highRate: 130 },
    { role: 'AI/ML Engineer', lowRate: 110, highRate: 140 },
];

const ResourceEditor: React.FC = () => {
    const { teamMembers, addTeamMember, updateTeamMember, deleteTeamMember, projectFolders, addToast } = useAppContext();
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [procuringId, setProcuringId] = useState<string | null>(null); // New state for procurement
    const [openProjects, setOpenProjects] = useState<string[]>(['General Project Resources']);

    // State for adding a new member
    const [newRole, setNewRole] = useState('');
    const [newLowRate, setNewLowRate] = useState('');
    const [newHighRate, setNewHighRate] = useState('');
    const [newProject, setNewProject] = useState(staticProjectOptions[0]);
    const [customNewProject, setCustomNewProject] = useState('');
    
    // State for editing a member
    const [editRole, setEditRole] = useState('');
    const [editLowRate, setEditLowRate] = useState('');
    const [editHighRate, setEditHighRate] = useState('');
    
    const toggleProject = (project: string) => {
        setOpenProjects(prev =>
            prev.includes(project) ? prev.filter(i => i !== project) : [...prev, project]
        );
    };
    
    const validateInput = (role: string, low: string, high: string, project: string): boolean => {
        if (!role.trim()) {
            addToast('Role name cannot be empty.');
            return false;
        }
        const lowRate = parseInt(low, 10);
        const highRate = parseInt(high, 10);
        if (isNaN(lowRate) || lowRate <= 0) {
            addToast('Low rate must be a positive number.');
            return false;
        }
        if (isNaN(highRate) || highRate <= 0) {
            addToast('High rate must be a positive number.');
            return false;
        }
        if (highRate < lowRate) {
            addToast('High rate must be greater than or equal to the low rate.');
            return false;
        }
        if (!project.trim()) {
            addToast('Project name cannot be empty.');
            return false;
        }
        return true;
    }


    const handleEditClick = (member: TeamMember) => {
        setEditingId(member.id);
        setEditRole(member.role);
        setEditLowRate(String(member.lowRate));
        setEditHighRate(String(member.highRate));
        setProcuringId(null); // Close procurement if editing
    };

    const handleSaveClick = (member: TeamMember) => {
        if (validateInput(editRole, editLowRate, editHighRate, member.project)) {
            updateTeamMember({ 
                ...member, 
                role: editRole.trim(),
                lowRate: parseInt(editLowRate, 10),
                highRate: parseInt(editHighRate, 10)
            });
            setEditingId(null);
        }
    };
    
    const handleSelectSuggestedRole = (role: { role: string; lowRate: number; highRate: number; }) => {
        setNewRole(role.role);
        setNewLowRate(String(role.lowRate));
        setNewHighRate(String(role.highRate));
    };

    const handleAddClick = () => {
        const project = newProject === '--other--' ? customNewProject.trim() : newProject;
        if (validateInput(newRole, newLowRate, newHighRate, project)) {
            addTeamMember({ 
                role: newRole.trim(), 
                lowRate: parseInt(newLowRate, 10),
                highRate: parseInt(newHighRate, 10),
                project
            });
            setNewRole('');
            setNewLowRate('');
            setNewHighRate('');
            setNewProject(staticProjectOptions[0]);
            setCustomNewProject('');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };
    
    // New handler for procurement
    const handleProcureClick = (memberId: string) => {
        setProcuringId(procuringId === memberId ? null : memberId);
        setEditingId(null); // Close editing if opening procurement
    };

    const handleMockPayment = (platform: string) => {
        addToast(`Payment integration requires a backend. This is a placeholder for future ${platform} functionality.`, 'info');
    };

    const groupedByProject = useMemo(() => {
        const allProjects = new Set(teamMembers.map(m => m.project));
        const sortedProjectNames = Array.from(allProjects).sort();

        return sortedProjectNames.reduce((acc, project) => {
            acc[project] = teamMembers.filter(member => member.project === project);
            return acc;
        }, {} as Record<string, TeamMember[]>);

    }, [teamMembers]);
    
    const projectNames = Object.keys(groupedByProject);

    const allProjectOptions = useMemo(() => {
        const projectsFromMembers = teamMembers.map(m => m.project);
        const projectsFromFolders = projectFolders.map(f => f.proposal.projectName);
        const combined = new Set([...staticProjectOptions, ...projectsFromMembers, ...projectsFromFolders]);
        return Array.from(combined).sort();
    }, [teamMembers, projectFolders]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Manage Resources</h2>
            <div className="space-y-2">
                {projectNames.map(project => {
                    const isOpen = openProjects.includes(project);
                    return (
                        <div key={project} className="border border-slate-200 rounded-md overflow-hidden">
                            <button
                                onClick={() => toggleProject(project)}
                                className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                                aria-expanded={isOpen}
                                title={isOpen ? 'Collapse section' : 'Expand section'}
                            >
                                <span className="font-semibold text-slate-700">{project} ({groupedByProject[project].length})</span>
                                <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpen && (
                                <div className="p-2 space-y-2">
                                    <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase px-2 py-1">
                                        <div className="col-span-6">Role</div>
                                        <div className="col-span-3 text-right">Rate/Hour</div>
                                        <div className="col-span-3 text-right">Actions</div>
                                    </div>
                                    {groupedByProject[project].map(member => (
                                        <div key={member.id} className="p-2 rounded-md hover:bg-slate-50">
                                            {editingId === member.id ? (
                                                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editRole}
                                                        onChange={(e) => setEditRole(e.target.value)}
                                                        className="w-full sm:w-1/2 px-2 py-1 border rounded-md text-sm"
                                                        placeholder="Role"
                                                    />
                                                    <div className="flex items-center gap-1">
                                                        <input type="number" value={editLowRate} onChange={(e) => setEditLowRate(e.target.value)} className="w-1/2 px-2 py-1 border rounded-md text-right text-sm" placeholder="Low"/>
                                                        <input type="number" value={editHighRate} onChange={(e) => setEditHighRate(e.target.value)} className="w-1/2 px-2 py-1 border rounded-md text-right text-sm" placeholder="High"/>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <button onClick={() => handleSaveClick(member)} className="p-1 text-green-600 hover:text-green-800" title="Save"><SaveIcon className="h-5 w-5" /></button>
                                                        <button onClick={handleCancelEdit} className="p-1 text-slate-500 hover:text-slate-700" title="Cancel"><CloseIcon className="h-5 w-5" /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex-1 min-w-[120px]">
                                                            <p className={`font-medium text-slate-800 ${member.isSuggested ? 'italic' : ''}`}
                                                               title={member.isSuggested ? 'This role was suggested by the AI based on the project proposal analysis.' : undefined}>
                                                                {member.role}
                                                            </p>
                                                            <p className="sm:hidden text-sm text-slate-600">${member.lowRate} - ${member.highRate} / hour</p>
                                                        </div>
                                                        <div className="hidden sm:block text-slate-600">${member.lowRate} - ${member.highRate}</div>
                                                        <div className="flex-shrink-0 flex items-center space-x-1">
                                                            <button onClick={() => handleProcureClick(member.id)} className="p-1 text-blue-500 hover:text-blue-700" title="Procure Resource"><PlusIcon className="h-5 w-5" /></button>
                                                            <button onClick={() => handleEditClick(member)} className="p-1 text-slate-500 hover:text-slate-800" title="Edit"><EditIcon className="h-5 w-5" /></button>
                                                            <button onClick={() => deleteTeamMember(member.id)} className="p-1 text-red-500 hover:text-red-700" title="Delete"><DeleteIcon className="h-5 w-5" /></button>
                                                        </div>
                                                    </div>
                                                    {procuringId === member.id && (
                                                        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                                                            <p className="text-sm font-semibold text-blue-800 mb-2">Procure this resource:</p>
                                                            <div className="flex flex-col sm:flex-row gap-2">
                                                                <button
                                                                    onClick={() => handleMockPayment('Google Pay')}
                                                                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-[#4285F4] rounded-md hover:bg-[#357AE8] transition-colors"
                                                                >
                                                                    Pay with Google Pay
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMockPayment('Amazon Pay')}
                                                                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-[#FF9900] rounded-md hover:bg-[#E68A00] transition-colors"
                                                                >
                                                                    Pay with Amazon Pay
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="text-md font-semibold text-slate-700 mb-2">Add New Resource</h3>
                 <div className="mb-4 p-4 bg-slate-50 border rounded-lg">
                    <h4 className="font-semibold text-slate-700 text-sm mb-2">Add by Common Role</h4>
                    <p className="text-xs text-slate-500 mb-3">Select a role to quickly populate the form below.</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestedRoles.map(role => (
                            <button
                                key={role.role}
                                onClick={() => handleSelectSuggestedRole(role)}
                                className="flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-100 hover:border-slate-400 transition-colors"
                            >
                                <PlusIcon className="h-4 w-4 mr-1.5 text-slate-500" />
                                {role.role}
                            </button>
                        ))}
                    </div>
                </div>

                <h4 className="font-semibold text-slate-700 text-sm mb-2">Resource Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="text" placeholder="Role Name (or select above)" value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
                    <div className="flex items-center space-x-1">
                        <input type="number" placeholder="Low Rate" value={newLowRate} onChange={(e) => setNewLowRate(e.target.value)} className="w-1/2 px-3 py-2 border rounded-md text-sm text-right" />
                        <input type="number" placeholder="High Rate" value={newHighRate} onChange={(e) => setNewHighRate(e.target.value)} className="w-1/2 px-3 py-2 border rounded-md text-sm text-right" />
                    </div>
                    <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                         <select
                            value={newProject}
                            onChange={(e) => setNewProject(e.target.value)}
                            className="col-span-2 sm:col-span-1 w-full px-3 py-2 border rounded-md text-sm"
                        >
                            {allProjectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            <option value="--other--">Other (Specify)</option>
                        </select>
                        {newProject === '--other--' && (
                             <input
                                type="text"
                                placeholder="New Project Name"
                                value={customNewProject}
                                onChange={(e) => setCustomNewProject(e.target.value)}
                                className="col-span-2 sm:col-span-1 w-full px-3 py-2 border rounded-md text-sm"
                            />
                        )}
                        <button onClick={handleAddClick} title="Add New Resource" className="col-start-3 w-full flex items-center justify-center bg-red-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-red-700 disabled:bg-slate-400 transition-colors">
                            <PlusIcon className="h-5 w-5 sm:mr-1"/>
                            <span className="hidden sm:inline">Add</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceEditor;