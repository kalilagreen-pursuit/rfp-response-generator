

import React, { useState, useMemo, useEffect } from 'react';
import type { ProjectFolder, SalesStage, ActivityLogEntry, ActivityType, CrmTask, InternalNote } from '../types';
import { formatCurrency } from '../utils/formatters';
import { DocumentIcon, ClipboardCheckIcon, PresentationIcon, PlusIcon, DeleteIcon, UsersIcon, PhoneIcon, EmailIcon, PencilIcon, CheckCircleIcon, LightbulbIcon, InformationCircleIcon } from './icons';
import { summarizeInternalNotes, suggestNextCrmActions, generateLeadScore } from '@/services/geminiService';
import { useAppContext } from '../contexts/AppContext';

const stageProbabilityMap: Record<SalesStage, number> = {
    'Prospecting': 10,
    'Qualification': 25,
    'Proposal': 50,
    'Negotiation': 75,
    'Closed-Won': 100,
    'Closed-Lost': 0,
};

const salesStages: SalesStage[] = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed-Won', 'Closed-Lost'];

interface CRMViewProps {
    projects: ProjectFolder[];
    updateProjectFolder: (folder: ProjectFolder) => void;
    onViewProposal: (folder: ProjectFolder) => void;
    onViewScorecard: (folder: ProjectFolder) => void;
    onGenerateSlideshow: (folder: ProjectFolder) => void;
}

const SalesFunnel: React.FC<{ currentStage: SalesStage, onStageChange: (stage: SalesStage) => void }> = ({ currentStage, onStageChange }) => {
    const currentIndex = salesStages.indexOf(currentStage);

     if (currentStage === 'Closed-Lost') {
        return (
            <div className="flex items-center justify-center bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm font-bold text-red-700">Opportunity: Closed-Lost</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                {salesStages.filter(s => s !== 'Closed-Lost').map((stage, index) => (
                    <React.Fragment key={stage}>
                        <div className="flex flex-col items-center text-center">
                             <div 
                                className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all ${
                                    index < currentIndex ? 'bg-green-500 border-green-500' : 
                                    index === currentIndex ? 'bg-red-500 border-red-500' : 
                                    'bg-white border-slate-300'
                                }`}
                            >
                                {index < currentIndex && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <button
                                onClick={() => onStageChange(stage)}
                                className={`mt-1 text-xs font-bold transition-colors ${
                                    index <= currentIndex ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                aria-pressed={currentStage === stage}
                            >
                                {stage}
                            </button>
                             <p className={`text-xs ${ index <= currentIndex ? 'text-slate-600' : 'text-slate-400'}`}>
                                {stageProbabilityMap[stage]}%
                            </p>
                        </div>
                        {index < salesStages.length - 2 && (
                            <div className={`flex-grow h-0.5 mb-8 ${index < currentIndex ? 'bg-green-500' : 'bg-slate-200'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};


const ActivityIcon: React.FC<{type: ActivityType}> = ({ type }) => {
    const iconMap: Record<ActivityType, React.ReactNode> = {
        'Call': <PhoneIcon className="w-4 h-4 text-blue-500" />,
        'Email': <EmailIcon className="w-4 h-4 text-green-500" />,
        'Meeting': <UsersIcon className="w-4 h-4 text-purple-500" />,
        'Note': <PencilIcon className="w-4 h-4 text-slate-500" />,
    };
    return <div className="p-2 bg-slate-100 rounded-full">{iconMap[type]}</div>;
}

const CRMView: React.FC<CRMViewProps> = ({ 
    projects, 
    updateProjectFolder,
    onViewProposal,
    onViewScorecard,
    onGenerateSlideshow,
}) => {
    const { addToast } = useAppContext();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [newActivityType, setNewActivityType] = useState<ActivityType>('Note');
    const [newActivityDetails, setNewActivityDetails] = useState('');
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newInternalNote, setNewInternalNote] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isScoringLead, setIsScoringLead] = useState(false);


    useEffect(() => {
        if (projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projects[0].id);
        }
        if (selectedProjectId && !projects.find(p => p.id === selectedProjectId)) {
            setSelectedProjectId(projects.length > 0 ? projects[0].id : '');
        }
    }, [projects, selectedProjectId]);
    
    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId);
    }, [selectedProjectId, projects]);

    const handleStageChange = (stage: SalesStage) => {
        if (!selectedProject) return;
        updateProjectFolder({ ...selectedProject, salesStage: stage, probability: stageProbabilityMap[stage] });
    };

    const handleNextStepDateChange = (date: string) => {
        if (!selectedProject) return;
        const newDate = date ? new Date(date).toISOString() : null;
        updateProjectFolder({ ...selectedProject, nextStepDate: newDate });
    };

    const handleAddActivity = () => {
        if (!selectedProject || !newActivityDetails.trim()) return;
        const newActivity: ActivityLogEntry = {
            id: crypto.randomUUID(),
            type: newActivityType,
            date: new Date().toISOString(),
            details: newActivityDetails.trim(),
        };
        const updatedLog = [newActivity, ...(selectedProject.activityLog || [])];
        updateProjectFolder({ ...selectedProject, activityLog: updatedLog });
        setNewActivityDetails('');
        setNewActivityType('Note');
    };

    const handleDeleteActivity = (activityId: string) => {
        if (!selectedProject) return;
        const updatedLog = (selectedProject.activityLog || []).filter(entry => entry.id !== activityId);
        updateProjectFolder({ ...selectedProject, activityLog: updatedLog });
    };

    const handleAddTask = () => {
        if (!selectedProject || !newTaskText.trim()) return;
        const newTask: CrmTask = {
            id: crypto.randomUUID(),
            text: newTaskText.trim(),
            completed: false,
            dueDate: newTaskDueDate || undefined,
        };
        const updatedTasks = [...(selectedProject.crmTasks || []), newTask];
        updateProjectFolder({ ...selectedProject, crmTasks: updatedTasks });
        setNewTaskText('');
        setNewTaskDueDate('');
    };


    const handleToggleTask = (taskId: string) => {
        if (!selectedProject) return;
        const updatedTasks = (selectedProject.crmTasks || []).map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        updateProjectFolder({ ...selectedProject, crmTasks: updatedTasks });
    };

    const handleDeleteTask = (taskId: string) => {
        if (!selectedProject) return;
        const updatedTasks = (selectedProject.crmTasks || []).filter(task => task.id !== taskId);
        updateProjectFolder({ ...selectedProject, crmTasks: updatedTasks });
    };

    const handleSuggestActions = async () => {
        if (!selectedProject) return;
        setIsSuggesting(true);
        try {
            const suggestions = await suggestNextCrmActions(selectedProject.proposal, selectedProject.activityLog || []);
            const newTasks: CrmTask[] = suggestions.map(text => ({
                id: crypto.randomUUID(),
                text,
                completed: false,
            }));
            const updatedTasks = [...(selectedProject.crmTasks || []), ...newTasks];
            updateProjectFolder({ ...selectedProject, crmTasks: updatedTasks });
            addToast(`Added ${suggestions.length} suggested actions.`, 'success');
        } catch (e: any) {
            addToast(e.message || 'Could not suggest actions.', 'error');
        } finally {
            setIsSuggesting(false);
        }
    };
    
    const handleAddInternalNote = () => {
        if (!selectedProject || !newInternalNote.trim()) return;
        const newNote: InternalNote = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            content: newInternalNote.trim(),
        };
        const updatedNotes = [newNote, ...(selectedProject.internalNotes || [])];
        updateProjectFolder({ ...selectedProject, internalNotes: updatedNotes, internalNotesSummary: '' }); // Clear summary on new note
        setNewInternalNote('');
    };

    const handleDeleteInternalNote = (noteId: string) => {
        if (!selectedProject) return;
        const updatedNotes = (selectedProject.internalNotes || []).filter(note => note.id !== noteId);
        updateProjectFolder({ ...selectedProject, internalNotes: updatedNotes });
    };

    const handleSummarizeNotes = async () => {
        if (!selectedProject || !selectedProject.internalNotes || selectedProject.internalNotes.length === 0) {
            addToast('There are no notes to summarize.', 'info');
            return;
        }
        setIsSummarizing(true);
        try {
            const summary = await summarizeInternalNotes(selectedProject.internalNotes);
            updateProjectFolder({ ...selectedProject, internalNotesSummary: summary });
            addToast('Notes summarized successfully.', 'success');
        } catch (e: any) {
            addToast(e.message || 'Could not summarize notes.', 'error');
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleGenerateLeadScore = async () => {
        if (!selectedProject) return;
        setIsScoringLead(true);
        try {
            const { score, reasoning } = await generateLeadScore(selectedProject);
            updateProjectFolder({ ...selectedProject, leadScore: score, leadScoreReasoning: reasoning });
            addToast(`Lead score calculated: ${score}/100`, 'success');
        } catch (e: any) {
            addToast(e.message || 'Could not calculate lead score.', 'error');
        } finally {
            setIsScoringLead(false);
        }
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-600';
    };


    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Customer Relationship Management</h2>
                {projects.length > 0 && (
                    <select 
                        id="project-select-crm" 
                        value={selectedProjectId} 
                        onChange={(e) => setSelectedProjectId(e.target.value)} 
                        className="w-full sm:w-72 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                        aria-label="Select a project"
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.proposal.projectName}</option>)}
                    </select>
                )}
            </header>

            {!selectedProject ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg">
                    <UsersIcon className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">No Projects Found</h3>
                    <p className="text-slate-500 mt-1">Generate a proposal to start managing opportunities.</p>
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <SalesFunnel currentStage={selectedProject.salesStage} onStageChange={handleStageChange} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-slate-50 border rounded-lg p-4">
                                <h3 className="font-semibold text-slate-800 mb-3 text-lg">Opportunity Snapshot</h3>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex justify-between"><span>Contact:</span><strong className="text-slate-800">{selectedProject.proposal.contactPerson || 'N/A'}</strong></li>
                                    <li className="flex justify-between"><span>Value:</span><strong className="text-slate-800">{formatCurrency(selectedProject.proposal.investmentEstimate.high)}</strong></li>
                                    {selectedProject.insights?.budget && (
                                        <li className="flex justify-between"><span>Budget:</span><strong className="text-slate-800">{selectedProject.insights.budget}</strong></li>
                                    )}
                                    {selectedProject.insights?.submissionDeadline && (
                                        <li className="flex justify-between"><span>Deadline:</span><strong className="text-slate-800">{new Date(selectedProject.insights.submissionDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</strong></li>
                                    )}
                                    <li className="flex justify-between"><span>Probability:</span><strong className="text-slate-800">{selectedProject.probability}%</strong></li>
                                    <li className="flex justify-between items-center">
                                        <span>Next Step:</span>
                                        <input
                                            type="date"
                                            value={selectedProject.nextStepDate ? selectedProject.nextStepDate.split('T')[0] : ''}
                                            onChange={(e) => handleNextStepDateChange(e.target.value)}
                                            className="w-32 text-right border-slate-200 rounded-md text-sm p-1"
                                        />
                                    </li>
                                </ul>
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    {selectedProject.leadScore !== undefined ? (
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-700">Lead Score:</span>
                                                <strong className={`text-xl font-bold ${getScoreColor(selectedProject.leadScore)}`}>
                                                    {selectedProject.leadScore}/100
                                                </strong>
                                                <span title={selectedProject.leadScoreReasoning} className="cursor-help">
                                                    <InformationCircleIcon className="w-4 h-4 text-slate-400" />
                                                </span>
                                            </div>
                                            <button onClick={handleGenerateLeadScore} disabled={isScoringLead} className="text-xs font-semibold text-slate-500 hover:text-red-600">
                                                {isScoringLead ? 'Analyzing...' : 'Recalculate'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={handleGenerateLeadScore} disabled={isScoringLead} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-700 disabled:opacity-50">
                                            <LightbulbIcon className="w-4 h-4" />
                                            {isScoringLead ? 'Analyzing Lead...' : 'Analyze Lead with AI'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="bg-slate-50 border rounded-lg p-4">
                                <h3 className="font-semibold text-slate-800 mb-3 text-lg flex items-center gap-2"><InformationCircleIcon className="w-5 h-5 text-blue-500" /> Key Insights from RFP</h3>
                                {selectedProject.insights && (selectedProject.insights.keyObjectives?.length > 0 || selectedProject.insights.requiredTechnologies?.length > 0 || selectedProject.insights.keyStakeholders?.length > 0) ? (
                                    <ul className="space-y-3 text-sm text-slate-600">
                                        {selectedProject.insights.keyObjectives && selectedProject.insights.keyObjectives.length > 0 && (
                                            <li>
                                                <strong className="text-slate-700 block mb-1">Key Objectives:</strong>
                                                <ul className="list-disc list-inside space-y-1 pl-2">
                                                    {selectedProject.insights.keyObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                                </ul>
                                            </li>
                                        )}
                                        {selectedProject.insights.requiredTechnologies && selectedProject.insights.requiredTechnologies.length > 0 && (
                                                <li>
                                                <strong className="text-slate-700 block mb-1">Required Technologies:</strong>
                                                <p>{selectedProject.insights.requiredTechnologies.join(', ')}</p>
                                            </li>
                                        )}
                                        {selectedProject.insights.keyStakeholders && selectedProject.insights.keyStakeholders.length > 0 && (
                                                <li>
                                                <strong className="text-slate-700 block mb-1">Key Stakeholders:</strong>
                                                <p>{selectedProject.insights.keyStakeholders.join(', ')}</p>
                                            </li>
                                        )}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500">No specific insights were extracted from the RFP.</p>
                                )}
                            </div>
                            <div className="bg-slate-50 border rounded-lg p-4">
                                <h3 className="font-semibold text-slate-800 mb-3 text-lg">Generated Assets</h3>
                                <div className="space-y-2">
                                    <button onClick={() => onViewProposal(selectedProject)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                                        <DocumentIcon className="w-4 h-4" /> View Proposal
                                    </button>
                                    <button onClick={() => onViewScorecard(selectedProject)} disabled={!selectedProject.scorecard} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-white border rounded-md hover:bg-slate-100 disabled:opacity-50">
                                        <ClipboardCheckIcon className="w-4 h-4" /> View Scorecard
                                    </button>
                                    <button onClick={() => onGenerateSlideshow(selectedProject)} disabled={!selectedProject.slideshow} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-white border rounded-md hover:bg-slate-100 disabled:opacity-50">
                                        <PresentationIcon className="w-4 h-4" /> View Presentation
                                    </button>
                                </div>
                            </div>
                             <div className="bg-slate-50 border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold text-slate-800 text-lg">Internal Team Notes</h3>
                                    <button onClick={handleSummarizeNotes} disabled={isSummarizing || !selectedProject.internalNotes?.length} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 disabled:opacity-50">
                                        <LightbulbIcon className="w-3.5 h-3.5" /> {isSummarizing ? 'Working...' : 'Summarize'}
                                    </button>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    <input value={newInternalNote} onChange={e => setNewInternalNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddInternalNote()} placeholder="Add an internal note..." className="flex-grow w-full px-3 py-2 border rounded-md text-sm" />
                                    <button onClick={handleAddInternalNote} className="p-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"><PlusIcon className="w-5 h-5" /></button>
                                </div>
                                 {selectedProject.internalNotesSummary && (
                                    <div className="mb-3 p-3 bg-purple-50 border-l-4 border-purple-300 text-sm text-purple-800">
                                        <strong>AI Summary:</strong> {selectedProject.internalNotesSummary}
                                    </div>
                                )}
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {(selectedProject.internalNotes || []).map(note => (
                                        <div key={note.id} className="bg-white p-2 rounded-md border group">
                                            <p className="text-sm text-slate-700">{note.content}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-xs text-slate-400">{new Date(note.date).toLocaleString()}</p>
                                                <button onClick={() => handleDeleteInternalNote(note.id)} className="p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><DeleteIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-slate-50 border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold text-slate-800 text-lg">Next Actions</h3>
                                    <button onClick={handleSuggestActions} disabled={isSuggesting} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full hover:bg-amber-200 disabled:opacity-50">
                                        <LightbulbIcon className={`w-3.5 h-3.5 ${isSuggesting ? 'animate-pulse' : ''}`} /> {isSuggesting ? 'Suggesting...' : 'Suggest Actions'}
                                    </button>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                    <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} placeholder="Add a new task..." className="flex-grow w-full px-3 py-2 border rounded-md text-sm" />
                                    <input type="date" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} className="w-full sm:w-auto px-3 py-2 border rounded-md text-sm" />
                                    <button onClick={handleAddTask} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"><PlusIcon className="w-5 h-5" /></button>
                                </div>
                                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {(selectedProject.crmTasks || []).length > 0 ? (
                                        (selectedProject.crmTasks || []).map(task => {
                                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                                            return (
                                                <div key={task.id} className="flex items-center gap-2 bg-white p-2 rounded-md border group">
                                                    <button onClick={() => handleToggleTask(task.id)} className="flex-shrink-0">
                                                        {task.completed ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 border-2 border-slate-300 rounded-full" />}
                                                    </button>
                                                    <div className="flex-grow">
                                                        <p className={`text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.text}</p>
                                                        {task.dueDate && <p className={`text-xs mt-0.5 ${isOverdue && !task.completed ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                                                    </div>
                                                    <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><DeleteIcon className="w-4 h-4" /></button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-sm text-slate-500">No tasks have been added.</p>
                                            <p className="text-xs text-slate-400 mt-1">Use the form above or let AI suggest some actions.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-slate-50 border rounded-lg p-4 flex flex-col">
                                <h3 className="font-semibold text-slate-800 mb-3 text-lg">Client Activity Log</h3>
                                <div className="flex gap-2 mb-3">
                                    <select value={newActivityType} onChange={e => setNewActivityType(e.target.value as ActivityType)} className="border-slate-300 rounded-md text-sm p-2">
                                        <option value="Note">Note</option><option value="Call">Call</option><option value="Email">Email</option><option value="Meeting">Meeting</option>
                                    </select>
                                    <input value={newActivityDetails} onChange={e => setNewActivityDetails(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddActivity()} placeholder="Log activity details..." className="flex-grow w-full px-3 py-2 border rounded-md text-sm" />
                                    <button onClick={handleAddActivity} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"><PlusIcon className="w-5 h-5" /></button>
                                </div>
                                <div className="space-y-3 flex-grow overflow-y-auto pr-2 max-h-[40vh]">
                                    {(selectedProject.activityLog || []).map(entry => (
                                        <div key={entry.id} className="flex items-start gap-3 bg-white p-2.5 rounded-md border group">
                                            <ActivityIcon type={entry.type} />
                                            <div className="flex-grow">
                                                <p className="text-sm text-slate-800">{entry.details}</p>
                                                <p className="text-xs text-slate-400 mt-1">{new Date(entry.date).toLocaleString()}</p>
                                            </div>
                                            <button onClick={() => handleDeleteActivity(entry.id)} className="p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><DeleteIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CRMView;
