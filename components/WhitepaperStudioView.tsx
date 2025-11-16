import React, { useState } from 'react';
import type { ProjectFolder, Whitepaper } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { generateWhitepaper } from '@/services/geminiService';
import { exportWhitepaperToPdf } from '../utils/pdfExporter';
import { SparklesIcon, DownloadIcon, DocumentIcon } from './icons';

const WhitepaperStudioView: React.FC<{ projects: ProjectFolder[] }> = ({ projects }) => {
    const { addToast } = useAppContext();
    const [title, setTitle] = useState('The Power of AI in Proposal Generation');
    const [introduction, setIntroduction] = useState('In today\'s competitive landscape, the speed and quality of proposal responses can make or break a deal. This document explores how leveraging Artificial Intelligence, as demonstrated by Shaun Coggins Inc., transforms the Request for Proposal (RFP) process from a time-consuming chore into a strategic advantage.');
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const [generatedWhitepaper, setGeneratedWhitepaper] = useState<Whitepaper | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleProjectToggle = (id: string) => {
        setSelectedProjectIds(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedProjectIds.length === projects.length) {
            setSelectedProjectIds([]);
        } else {
            setSelectedProjectIds(projects.map(p => p.id));
        }
    };
    
    const handleGenerate = async () => {
        if (selectedProjectIds.length === 0) {
            addToast('Please select at least one project to feature as a case study.', 'info');
            return;
        }
        setIsLoading(true);
        setGeneratedWhitepaper(null);
        try {
            const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));
            const result = await generateWhitepaper(title, introduction, selectedProjects);
            setGeneratedWhitepaper(result);
            addToast('Whitepaper generated successfully!', 'success');
        } catch (e: any) {
            addToast(`Failed to generate whitepaper: ${e.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleExport = () => {
        if (!generatedWhitepaper) {
            addToast('Please generate the whitepaper first.', 'info');
            return;
        }
        exportWhitepaperToPdf(generatedWhitepaper).catch(err => {
            addToast(`Failed to export PDF: ${err.message}`, 'error');
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Whitepaper Studio</h2>
                    <p className="text-slate-500 mt-1">Generate a professional whitepaper with AI-powered case studies.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="wp-title" className="block text-sm font-medium text-slate-700">Title</label>
                        <input id="wp-title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm" />
                    </div>
                    <div>
                        <label htmlFor="wp-intro" className="block text-sm font-medium text-slate-700">Introduction</label>
                        <textarea id="wp-intro" value={introduction} onChange={e => setIntroduction(e.target.value)} rows={5} className="mt-1 w-full px-3 py-2 border rounded-md text-sm" />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-slate-800">Select Projects for Case Studies</h3>
                        <button onClick={handleSelectAll} className="text-sm font-medium text-red-600 hover:text-red-800">
                            {selectedProjectIds.length === projects.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                        {projects.map(p => (
                            <label key={p.id} className="flex items-center p-2 rounded hover:bg-slate-50 cursor-pointer">
                                <input type="checkbox" checked={selectedProjectIds.includes(p.id)} onChange={() => handleProjectToggle(p.id)} className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                                <span className="ml-3 text-sm text-slate-700">{p.proposal.projectName}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col space-y-2">
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-slate-400">
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg>
                        ) : (
                            <SparklesIcon className="w-5 h-5" />
                        )}
                        <span>{isLoading ? 'Generating...' : 'Generate Whitepaper'}</span>
                    </button>
                    <button onClick={handleExport} disabled={!generatedWhitepaper} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed">
                        <DownloadIcon className="w-5 h-5" />
                        <span>Export to PDF</span>
                    </button>
                </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
                <div className="max-h-[80vh] overflow-y-auto pr-4">
                    {generatedWhitepaper ? (
                        <article className="prose max-w-none">
                            <h1>{generatedWhitepaper.title}</h1>
                            <p className="lead">{generatedWhitepaper.introduction}</p>
                            
                            <h2>Case Studies</h2>
                            {generatedWhitepaper.caseStudies.map((study, index) => (
                                <div key={index} className="p-4 border-l-4 border-red-500 bg-slate-50 my-6">
                                    <h3>{study.anonymizedTitle}</h3>
                                    <h4>Challenge</h4>
                                    <p>{study.challenge}</p>
                                    <h4>Solution</h4>
                                    <p>{study.solution}</p>
                                    <h4>Outcome</h4>
                                    <p>{study.outcome}</p>
                                    <div className="flex space-x-8 not-prose text-sm font-semibold">
                                        <p><strong>Investment:</strong> {study.investmentRange}</p>
                                        <p><strong>Timeline:</strong> {study.timeline}</p>
                                    </div>
                                </div>
                            ))}
                            
                            <h2>Conclusion</h2>
                            <p>{generatedWhitepaper.conclusion}</p>
                        </article>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                             <DocumentIcon className="w-16 h-16 mb-4 text-slate-300" />
                             <h3 className="text-lg font-semibold text-slate-700">Whitepaper Preview</h3>
                             <p>Your generated content will appear here.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhitepaperStudioView;