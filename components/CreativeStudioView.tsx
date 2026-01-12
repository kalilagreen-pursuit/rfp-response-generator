import React, { useState, useEffect, useMemo } from 'react';
import type { ProjectFolder } from '../types';
import { SparklesIcon, RefreshIcon, ImageIcon } from './icons';
import VideoPitcherView from './VideoPitcherView';
import { ai, generateVideoPitch } from '@/services/geminiService';

interface CreativeStudioViewProps {
    projects: ProjectFolder[];
    onGenerateScript: (project: ProjectFolder) => Promise<void>;
    isLoading: boolean;
    loadingMessage: string;
    onUpdateProject: (project: ProjectFolder) => void;
    onGenerateImage: (project: ProjectFolder, sceneIndex: number) => void;
}

const CreativeStudioView: React.FC<CreativeStudioViewProps> = ({ projects, onGenerateScript, isLoading, loadingMessage, onUpdateProject, onGenerateImage }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    
    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId);
    }, [selectedProjectId, projects]);

    useEffect(() => {
        // If no project is selected and there are projects available, select the first one.
        if (!selectedProjectId && projects.length > 0) {
            setSelectedProjectId(projects[0].id);
        }
        // If the selected project is no longer in the list, reset selection.
        if (selectedProjectId && !projects.find(p => p.id === selectedProjectId)) {
            setSelectedProjectId(projects.length > 0 ? projects[0].id : '');
        }
    }, [projects, selectedProjectId]);

    const handleGenerateClick = async (isRegen = false) => {
        if (!selectedProject) return;
        if (isRegen) {
            setIsRegenerating(true);
        }
        await onGenerateScript(selectedProject);
        if (isRegen) {
            setIsRegenerating(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <header className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Creative Studio</h2>
                        <p className="text-slate-500 mt-1">Generate marketing assets for your proposals.</p>
                    </div>
                    {projects.length > 0 && (
                         <select 
                            id="project-select-creative" 
                            value={selectedProjectId} 
                            onChange={(e) => setSelectedProjectId(e.target.value)} 
                            className="w-full sm:w-72 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                            aria-label="Select a project"
                        >
                            {projects.map(p => <option key={p.id} value={p.id}>{p.proposal.projectName}</option>)}
                        </select>
                    )}
                </div>
            </header>

            {!selectedProject ? (
                 <div className="text-center py-16 bg-white rounded-lg shadow-lg">
                    <SparklesIcon className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">No Projects Found</h3>
                    <p className="text-slate-500 mt-1">Generate a proposal to start creating assets.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                             <h2 className="text-xl font-semibold text-slate-800">1. Visual Script & Storyboard</h2>
                             <button 
                                onClick={() => handleGenerateClick(!!selectedProject.videoScript)} 
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-slate-400"
                            >
                                {selectedProject.videoScript ? <RefreshIcon className={`w-4 h-4 ${(isLoading && isRegenerating) ? 'animate-spin' : ''}`} /> : <SparklesIcon className="w-4 h-4" />}
                                <span>
                                    {isLoading 
                                        ? loadingMessage
                                        : selectedProject.videoScript 
                                        ? 'Regenerate Script' 
                                        : 'Generate Script'
                                    }
                                </span>
                            </button>
                        </div>
                        
                        {isLoading && !isRegenerating && !selectedProject.videoScript ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <svg className="animate-spin h-10 w-10 text-red-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <h3 className="text-lg font-semibold text-slate-700">{loadingMessage}</h3>
                                <p className="text-slate-500">The AI is warming up its director's chair...</p>
                            </div>
                        ) : selectedProject.videoScript ? (
                            <div className={`space-y-4 transition-opacity duration-300 ${(isLoading && isRegenerating) ? 'opacity-50' : ''}`}>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-slate-800">{selectedProject.videoScript.title}</h3>
                                    <p className="text-sm text-slate-600 italic mt-1">"{selectedProject.videoScript.logline}"</p>
                                </div>
                                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                                    {selectedProject.videoScript.scenes.map(scene => (
                                        <div key={scene.scene} className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-12 gap-4 bg-white items-center">
                                            <div className="md:col-span-1 flex items-start justify-start md:justify-center">
                                                <span className="text-2xl font-bold text-red-600 bg-red-100 rounded-full h-10 w-10 flex items-center justify-center">{scene.scene}</span>
                                            </div>
                                            <div className="md:col-span-7">
                                                <h4 className="font-semibold text-slate-700 mb-1">VISUAL</h4>
                                                <p className="text-sm text-slate-600 mb-3">{scene.visual}</p>
                                                <h4 className="font-semibold text-slate-700 mb-1">AUDIO</h4>
                                                <p className="text-sm text-slate-600">{scene.audio}</p>
                                            </div>
                                            <div className="md:col-span-4 flex flex-col items-center justify-center">
                                                {scene.isGeneratingImage ? (
                                                    <div className="w-full aspect-video bg-slate-100 rounded-md flex flex-col items-center justify-center text-slate-500">
                                                        <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                        <p className="text-sm mt-2">Generating Image...</p>
                                                    </div>
                                                ) : scene.imageUrl ? (
                                                    <div className="w-full group relative">
                                                        <img src={scene.imageUrl} alt={`Storyboard for scene ${scene.scene}`} className="w-full aspect-video object-cover rounded-md shadow-sm" />
                                                        <button 
                                                            onClick={() => onGenerateImage(selectedProject, scene.scene - 1)}
                                                            className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Regenerate Image"
                                                        >
                                                            <RefreshIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-full aspect-video bg-slate-50 border-2 border-dashed rounded-md flex flex-col items-center justify-center">
                                                        <button 
                                                            onClick={() => onGenerateImage(selectedProject, scene.scene - 1)}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-700"
                                                        >
                                                            <ImageIcon className="w-4 h-4" />
                                                            Generate Image
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                             <div className="text-center py-16">
                                <SparklesIcon className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                <h3 className="text-md font-semibold text-slate-600">No Script Generated Yet</h3>
                                <p className="text-slate-400 text-sm mt-1">Select a project and click "Generate Script" to begin.</p>
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <VideoPitcherView
                            project={selectedProject}
                            onUpdateProject={onUpdateProject}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreativeStudioView;