


import React, { useState, useCallback, useMemo } from 'react';
import type { ProjectFolder, Scorecard, ProposalTemplate, View, SalesStage, IndustryPlaybook, ProfileDocument } from './types';
import Header from './components/Header';
import RfpUpload, { RfpQueueItem } from './components/RfpUpload';
import ProjectFolderList from './components/ProposalList';
import ProposalCoPilotModal from './components/ProposalCoPilotModal';
import ScorecardModal from './components/ScorecardModal';
import SlideshowModal from './components/SlideshowModal';
import { generateProposal, generateScorecard, generateSlideshow, generateVideoScript, generateStoryboardImage } from '@/services/geminiService';
import ResourceEditor from './components/ResourceEditor';
import Profile from './components/Profile';
import CalendarView from './components/CalendarView';
import { useAppContext } from './contexts/AppContext';
import { formatProposalForDownload } from './utils/formatters';
import { exportProposalToPdf } from './utils/pdfExporter';
import { proposalsAPI, getAuthToken } from './services/api';
import ToastContainer from './components/ToastContainer';
import OnboardingTour from './components/OnboardingTour';
import Sidebar from './components/Sidebar';
import CRMView from './components/CRMView';
import { extractTextFromFile, fileToDataUrl } from './utils/fileParser';
import DashboardView from './components/DashboardView';
import CreativeStudioView from './components/CreativeStudioView';
import EmailComposerModal from './components/EmailComposerModal';
import RfpViewerModal from './components/RfpViewerModal';
import WhitepaperStudioView from './components/WhitepaperStudioView';
import IndustryPlaybookEditor from './components/IndustryPlaybookEditor';
import DocumentViewerModal from './components/DocumentViewerModal';
import MyInvitationsView from './components/MyInvitationsView';

const allSalesStages: SalesStage[] = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed-Won', 'Closed-Lost'];

const stageProbabilityMap: Record<SalesStage, number> = {
    'Prospecting': 10,
    'Qualification': 25,
    'Proposal': 50,
    'Negotiation': 75,
    'Closed-Won': 100,
    'Closed-Lost': 0,
};

const App: React.FC = () => {
    const { 
        projectFolders, 
        addProjectFolder, 
        deleteProjectFolder, 
        profileData,
        updateProjectFolder,
        teamMembers,
        addTeamMember,
        addToast,
        industryPlaybooks,
    } = useAppContext();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('Generating...');
    const [selectedProjectForCoPilot, setSelectedProjectForCoPilot] = useState<ProjectFolder | null>(null);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortBy, setSortBy] = useState<'folderName' | 'generatedDate' | 'rfpFileName' | 'salesStage'>('generatedDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [stageFilter, setStageFilter] = useState<SalesStage[]>(allSalesStages);

    const [selectedProjectForScorecard, setSelectedProjectForScorecard] = useState<ProjectFolder | null>(null);
    const [scorecardData, setScorecardData] = useState<Scorecard | null>(null);
    const [isGeneratingScorecard, setIsGeneratingScorecard] = useState<boolean>(false);
    const [isForceRegeneratingScorecard, setIsForceRegeneratingScorecard] = useState(false);

    const [selectedProjectForSlideshow, setSelectedProjectForSlideshow] = useState<ProjectFolder | null>(null);
    const [isGeneratingSlideshow, setIsGeneratingSlideshow] = useState<boolean>(false);
    const [isForceRegeneratingSlideshow, setIsForceRegeneratingSlideshow] = useState(false);
    
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isRegeneratingProposal, setIsRegeneratingProposal] = useState(false);
    
    const [selectedProjectForEmail, setSelectedProjectForEmail] = useState<ProjectFolder | null>(null);
    const [projectForRfpView, setProjectForRfpView] = useState<ProjectFolder | null>(null);
    const [documentToView, setDocumentToView] = useState<ProfileDocument | null>(null);


    const isProfileComplete = useMemo(() => {
        return !!(profileData.smsNumber && profileData.teams.some(t => t.capabilitiesStatement.length > 0 && t.resume.length > 0));
    }, [profileData]);

    const filteredAndSortedFolders = useMemo(() => {
        const stageOrder: Record<SalesStage, number> = {
            'Prospecting': 1, 'Qualification': 2, 'Proposal': 3, 'Negotiation': 4,
            'Closed-Won': 5, 'Closed-Lost': 6,
        };

        return projectFolders
            .filter(folder => {
                const matchesSearch = folder.folderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    folder.rfpFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    folder.proposal.projectName.toLowerCase().includes(searchTerm.toLowerCase());
                
                const matchesStage = stageFilter.includes(folder.salesStage);

                return matchesSearch && matchesStage;
            })
            .sort((a, b) => {
                if (sortBy === 'salesStage') {
                    const comparison = stageOrder[a.salesStage] - stageOrder[b.salesStage];
                    return sortOrder === 'asc' ? comparison : -comparison;
                }
                if (sortBy === 'folderName') {
                    const comparison = a.folderName.localeCompare(b.folderName);
                    return sortOrder === 'asc' ? comparison : -comparison;
                }
                if (sortBy === 'rfpFileName') {
                    const comparison = a.rfpFileName.localeCompare(b.rfpFileName);
                    return sortOrder === 'asc' ? comparison : -comparison;
                }
                const descComparison = new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime();
                return sortOrder === 'desc' ? descComparison : -descComparison;
            });
    }, [projectFolders, searchTerm, sortBy, sortOrder, stageFilter]);

     const handleViewChange = useCallback((view: View) => {
        setCurrentView(view);
        setIsSidebarOpen(false); // Close sidebar on navigation
    }, []);

    const handleGenerate = useCallback(async (queue: RfpQueueItem[], template: ProposalTemplate, useGoogleSearch: boolean, teamId: string, playbookId: string | null) => {
        setIsLoading(true);

        const selectedTeam = profileData.teams.find(t => t.id === teamId);
        if (!selectedTeam) {
            addToast('Selected team profile could not be found.', 'error');
            setIsLoading(false);
            return;
        }

        const selectedPlaybook = industryPlaybooks.find(p => p.id === playbookId) || null;

        const profileContext = {
            capabilitiesStatement: selectedTeam.capabilitiesStatement.map(d => d.content).join('\n\n---\n\n'),
            resume: selectedTeam.resume.map(d => d.content).join('\n\n---\n\n'),
        };

        let successCount = 0;
        let errorCount = 0;

        for (const [index, item] of queue.entries()) {
            setLoadingMessage(`Processing ${index + 1} of ${queue.length}: ${item.name}`);
            try {
                const existingFolder = projectFolders.find(p => p.rfpFileName === item.name);
                if (existingFolder) {
                    if (!window.confirm(`A project for "${item.name}" (${existingFolder.folderName}) already exists. Do you want to overwrite it?`)) {
                        addToast(`Skipped generation for "${item.name}".`, 'info');
                        continue;
                    }
                }
                
                let rfpContent: string;
                let rfpFileDataUrl = '';

                if (item.type === 'file') {
                    const file = item.data as File;
                    [rfpContent, rfpFileDataUrl] = await Promise.all([extractTextFromFile(file), fileToDataUrl(file)]);
                } else {
                    rfpContent = item.data as string;
                }
                
                if (!rfpContent || rfpContent.trim().length === 0) throw new Error('Could not extract any text from the document.');

                const newFolder = await generateProposal(rfpContent, item.name, rfpFileDataUrl, useGoogleSearch, profileContext, template, teamId, selectedPlaybook);
                addProjectFolder(newFolder, existingFolder?.id);
                addToast(`Proposal for '${newFolder.proposal.projectName}' created successfully!`, 'success');
                successCount++;
            } catch (e: any) {
                errorCount++;
                addToast(`Failed to generate proposal for "${item.name}": ${e.message}`, 'error');
            }
        }
        
        if (queue.length > 1) {
            addToast(`Batch processing complete. Success: ${successCount}, Failed: ${errorCount}.`, 'info');
        }

        if (successCount > 0) {
            handleViewChange('projects');
        }
        
        setIsLoading(false);
        setLoadingMessage('Generating...');
    }, [projectFolders, profileData, addProjectFolder, addToast, industryPlaybooks, handleViewChange]);

    const handleDeleteProposal = useCallback((id: string) => {
        if (window.confirm('Are you sure you want to delete this project folder?')) deleteProjectFolder(id);
    }, [deleteProjectFolder]);

    const handleCloseAllAssetModals = useCallback(() => {
        setSelectedProjectForCoPilot(null);
        setSelectedProjectForScorecard(null);
        setScorecardData(null);
        setSelectedProjectForSlideshow(null);
        setSelectedProjectForEmail(null);
    }, []);

    const handleViewProposal = useCallback((folder: ProjectFolder) => {
        setSelectedProjectForScorecard(null);
        setScorecardData(null);
        setSelectedProjectForSlideshow(null);
        setSelectedProjectForCoPilot(folder);
    }, []);

    const handleRegenerateProposal = useCallback(async (folderToRegenerate: ProjectFolder) => {
        if (!window.confirm(`Are you sure you want to regenerate the proposal for "${folderToRegenerate.proposal.projectName}"? All manual changes and chat history will be lost.`)) {
            return;
        }

        setIsRegeneratingProposal(true);
        
        try {
            const teamToUse = profileData.teams.find(t => t.id === folderToRegenerate.teamId) || profileData.teams.find(t => t.capabilitiesStatement.length > 0 && t.resume.length > 0);
            
            if (!teamToUse) {
                throw new Error("No team with required documents found for regeneration.");
            }

            const playbookToUse = industryPlaybooks.find(p => p.id === folderToRegenerate.playbookId) || null;

            const profileContext = {
                capabilitiesStatement: teamToUse.capabilitiesStatement.map(d => d.content).join('\n\n---\n\n'),
                resume: teamToUse.resume.map(d => d.content).join('\n\n---\n\n'),
            };

            const rfpContent = folderToRegenerate.rfpContent;
            if (!rfpContent) {
                throw new Error("Original RFP content is missing and cannot be used for regeneration.");
            }

            const newFolder = await generateProposal(
                rfpContent,
                folderToRegenerate.rfpFileName,
                folderToRegenerate.rfpFileDataUrl,
                folderToRegenerate.useGoogleSearch || false,
                profileContext,
                folderToRegenerate.templateId || 'standard',
                teamToUse.id,
                playbookToUse
            );

            addProjectFolder(newFolder, folderToRegenerate.id);
            setSelectedProjectForCoPilot(newFolder);
            addToast(`Proposal for '${newFolder.proposal.projectName}' regenerated successfully!`, 'success');
        } catch (e: any) {
            addToast(`Failed to regenerate proposal: ${e.message}`, 'error');
        } finally {
            setIsRegeneratingProposal(false);
        }
    }, [profileData.teams, addProjectFolder, addToast, industryPlaybooks]);


    const handleViewScorecard = useCallback(async (folder: ProjectFolder, forceRegenerate = false) => {
        if (!profileData.teams.some(t => t.capabilitiesStatement.length > 0 && t.resume.length > 0)) {
            addToast("Please upload Capabilities Statement and Resume in 'Company Profile'.", 'error');
            return;
        }
        
        setSelectedProjectForCoPilot(null);
        setSelectedProjectForSlideshow(null);

        setSelectedProjectForScorecard(folder);
        if (folder.scorecard && !forceRegenerate) {
            setScorecardData(folder.scorecard);
            setIsGeneratingScorecard(false);
            return;
        }
        setIsGeneratingScorecard(true); setScorecardData(null); setIsForceRegeneratingScorecard(forceRegenerate);
        try {
            const proposalText = formatProposalForDownload(folder);
            // NOTE: This uses the first available team's docs. A more advanced implementation could let the user choose.
            const primaryTeam = profileData.teams.find(t => t.capabilitiesStatement.length > 0 && t.resume.length > 0);
            if (!primaryTeam) throw new Error("No team with required documents found for scorecard generation.");
            
            const capabilitiesContent = primaryTeam.capabilitiesStatement.map(d => d.content).join('\n\n');
            const resumeContent = primaryTeam.resume.map(d => d.content).join('\n\n');
            const newScorecard = await generateScorecard(proposalText, capabilitiesContent, resumeContent);
            setScorecardData(newScorecard);
            const updatedFolder = { ...folder, scorecard: newScorecard };
            updateProjectFolder(updatedFolder);
            const gapCriterion = newScorecard.criteria.find(c => c.name === 'Resource Gap Analysis');
            if (gapCriterion?.missingResources?.length) {
                const newMembers = gapCriterion.missingResources.map(res => ({ ...res, project: folder.proposal.projectName, isSuggested: true }));
                const existingRoles = new Set(teamMembers.filter(m => m.project === folder.proposal.projectName).map(m => m.role.toLowerCase()));
                const membersToAdd = newMembers.filter(m => !existingRoles.has(m.role.toLowerCase()));
                if (membersToAdd.length > 0) {
                    membersToAdd.forEach(addTeamMember);
                    addToast(`Added ${membersToAdd.length} suggested resource(s) for '${folder.proposal.projectName}'.`, 'success');
                }
            }
        } catch (e: any) {
            addToast(e.message || 'An unknown error occurred.', 'error');
        } finally {
            setIsGeneratingScorecard(false); setIsForceRegeneratingScorecard(false);
        }
    }, [addToast, profileData, updateProjectFolder, teamMembers, addTeamMember]);

    const handleGenerateSlideshow = useCallback(async (folder: ProjectFolder, forceRegenerate = false) => {
        if (!folder.scorecard) { addToast("A scorecard must be generated first.", 'error'); return; }
        
        setSelectedProjectForCoPilot(null);
        setSelectedProjectForScorecard(null);
        setScorecardData(null);
        
        setSelectedProjectForSlideshow(folder);
        if (folder.slideshow && !forceRegenerate) { setIsGeneratingSlideshow(false); return; }
        setIsGeneratingSlideshow(true); setIsForceRegeneratingSlideshow(forceRegenerate);
        try {
             // NOTE: This uses the first available team's docs. A more advanced implementation could let the user choose.
            const primaryTeam = profileData.teams.find(t => t.capabilitiesStatement.length > 0);
            if (!primaryTeam) throw new Error("No team with a capabilities statement found for slideshow generation.");
            const capabilitiesContent = primaryTeam.capabilitiesStatement.map(d => d.content).join('\n\n');
            
            const newSlideshow = await generateSlideshow(folder.proposal, folder.scorecard, capabilitiesContent);
            const updatedFolder = { ...folder, slideshow: newSlideshow };
            updateProjectFolder(updatedFolder);
            setSelectedProjectForSlideshow(updatedFolder);
        } catch (e: any) {
            addToast(e.message || 'Error generating slideshow.', 'error');
        } finally {
            setIsGeneratingSlideshow(false); setIsForceRegeneratingSlideshow(false);
        }
    }, [addToast, updateProjectFolder, profileData.teams]);
    
    const handleGenerateVideoScript = useCallback(async (folder: ProjectFolder) => {
        setIsLoading(true);
        setLoadingMessage('Generating Video Script...');
        try {
            const newVideoScript = await generateVideoScript(folder.proposal);
            const updatedFolder = { ...folder, videoScript: newVideoScript };
            updateProjectFolder(updatedFolder);
            addToast('Video script generated successfully!', 'success');
        } catch(e: any) {
            addToast(e.message || 'Error generating video script.', 'error');
        } finally {
            setIsLoading(false);
            setLoadingMessage('Generating...');
        }
    }, [updateProjectFolder, addToast]);

    const handleGenerateStoryboardImage = useCallback(async (project: ProjectFolder, sceneIndex: number) => {
        if (!project.videoScript) return;
    
        const scene = project.videoScript.scenes[sceneIndex];
        if (!scene) return;
    
        const updatedScenes = project.videoScript.scenes.map((s, i) => 
            i === sceneIndex ? { ...s, isGeneratingImage: true } : s
        );
        updateProjectFolder({ ...project, videoScript: { ...project.videoScript, scenes: updatedScenes } });
    
        try {
            const imageUrl = await generateStoryboardImage(scene.visual);
            
            const finalScenes = project.videoScript.scenes.map((s, i) => 
                i === sceneIndex ? { ...s, imageUrl: imageUrl, isGeneratingImage: false } : s
            );
            updateProjectFolder({ ...project, videoScript: { ...project.videoScript, scenes: finalScenes } });
            addToast('Storyboard image generated!', 'success');
    
        } catch (e: any) {
            addToast(e.message || 'Error generating image.', 'error');
            const revertedScenes = project.videoScript.scenes.map((s, i) =>
                i === sceneIndex ? { ...s, isGeneratingImage: false } : s
            );
            updateProjectFolder({ ...project, videoScript: { ...project.videoScript, scenes: revertedScenes } });
        }
    }, [updateProjectFolder, addToast]);

    const handleEmailProposal = useCallback((folder: ProjectFolder) => {
        setSelectedProjectForEmail(folder);
    }, []);

    const handleViewRfp = (folder: ProjectFolder) => {
        setProjectForRfpView(folder);
    };
    
    const handleViewDocument = (doc: ProfileDocument) => {
        setDocumentToView(doc);
    };

    const handleDownloadProposalPdf = useCallback(async (folder: ProjectFolder) => {
        setIsDownloadingPdf(true);
        addToast('Preparing PDF download...', 'info');
        try {
            // For now, always use client-side export since proposals are generated locally
            // Backend export will be enabled when full backend integration is complete
            await exportProposalToPdf(folder);
            addToast('PDF downloaded successfully', 'success');
        } catch (error: any) {
            addToast(`Failed to generate PDF: ${error.message}`, 'error');
            console.error(error);
        } finally {
            setIsDownloadingPdf(false);
        }
    }, [addToast]);

    const handleSalesStageChange = (id: string, stage: SalesStage) => {
        const folder = projectFolders.find(f => f.id === id);
        if (folder) {
            updateProjectFolder({ ...folder, salesStage: stage, probability: stageProbabilityMap[stage] });
        }
    };

    const renderCurrentView = () => {
        switch(currentView) {
            case 'dashboard':
                return <DashboardView projects={projectFolders} onViewChange={setCurrentView} />;
            case 'createProject':
                 return (
                    <div className="max-w-3xl mx-auto">
                        <RfpUpload 
                            onGenerate={handleGenerate} 
                            isLoading={isLoading} 
                            isProfileComplete={isProfileComplete} 
                            onNavigateToProfile={() => handleViewChange('profile')}
                            loadingMessage={loadingMessage} 
                        />
                    </div>
                );
            case 'projects':
                return (
                    <ProjectFolderList
                        folders={filteredAndSortedFolders}
                        onView={handleViewProposal}
                        onDelete={handleDeleteProposal}
                        onEmail={handleEmailProposal}
                        onViewScorecard={handleViewScorecard}
                        onGenerateSlideshow={handleGenerateSlideshow}
                        onViewRfp={handleViewRfp}
                        onSalesStageChange={handleSalesStageChange}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        sortBy={sortBy}
                        onSortByChange={setSortBy}
                        sortOrder={sortOrder}
                        onSortOrderChange={setSortOrder}
                        stageFilter={stageFilter}
                        onStageFilterChange={setStageFilter}
                    />
                );
            case 'resources': return <ResourceEditor />;
            case 'profile': return <Profile onViewDocument={handleViewDocument} />;
            case 'playbooks': return <IndustryPlaybookEditor />;
            case 'calendar': return <CalendarView projects={projectFolders} />;
            case 'creativeStudio':
                return (
                    <CreativeStudioView
                        projects={projectFolders}
                        onGenerateScript={handleGenerateVideoScript}
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                        onUpdateProject={updateProjectFolder}
                        onGenerateImage={handleGenerateStoryboardImage}
                    />
                );
            case 'crm':
                return (
                    <CRMView 
                        projects={projectFolders}
                        updateProjectFolder={updateProjectFolder}
                        onViewProposal={handleViewProposal}
                        onViewScorecard={handleViewScorecard}
                        onGenerateSlideshow={handleGenerateSlideshow}
                    />
                );
            case 'whitepaperStudio':
                return <WhitepaperStudioView projects={projectFolders} />;
            case 'invitations':
                return <MyInvitationsView />;
            default: return null;
        }
    };

    return (
        <div className="bg-slate-100 font-sans">
            <div className="relative min-h-screen lg:flex">
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    currentView={currentView}
                    onViewChange={handleViewChange}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
                    <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <div className="max-w-screen-2xl mx-auto">
                            {renderCurrentView()}
                        </div>
                    </main>
                </div>
                {selectedProjectForCoPilot && (
                    <ProposalCoPilotModal
                        projectFolder={selectedProjectForCoPilot}
                        onClose={handleCloseAllAssetModals} 
                        onEmail={handleEmailProposal} 
                        onViewScorecard={handleViewScorecard}
                        onViewSlideshow={handleGenerateSlideshow}
                        onUpdateProject={updateProjectFolder}
                        onDownloadPdf={handleDownloadProposalPdf}
                        onViewRfp={handleViewRfp}
                        isDownloadingPdf={isDownloadingPdf}
                        onRegenerateProposal={handleRegenerateProposal}
                        isRegeneratingProposal={isRegeneratingProposal}
                    />
                )}
                {selectedProjectForScorecard && (
                    <ScorecardModal 
                        projectFolder={selectedProjectForScorecard}
                        scorecard={scorecardData} 
                        isLoading={isGeneratingScorecard} 
                        onClose={handleCloseAllAssetModals} 
                        onRegenerate={() => handleViewScorecard(selectedProjectForScorecard, true)} 
                        isRegenerating={isGeneratingScorecard && isForceRegeneratingScorecard}
                        onViewProposal={handleViewProposal}
                        onViewSlideshow={handleGenerateSlideshow}
                    />
                )}
                {selectedProjectForSlideshow && (
                    <SlideshowModal 
                        projectFolder={selectedProjectForSlideshow} 
                        isLoading={isGeneratingSlideshow} 
                        onClose={handleCloseAllAssetModals} 
                        onRegenerate={() => handleGenerateSlideshow(selectedProjectForSlideshow, true)} 
                        isRegenerating={isGeneratingSlideshow && isForceRegeneratingSlideshow}
                        onViewProposal={handleViewProposal}
                        onViewScorecard={handleViewScorecard}
                    />
                )}
                 {selectedProjectForEmail && (
                    <EmailComposerModal
                        projectFolder={selectedProjectForEmail}
                        onClose={handleCloseAllAssetModals}
                    />
                )}
                {projectForRfpView && (
                    <RfpViewerModal
                        projectFolder={projectForRfpView}
                        onClose={() => setProjectForRfpView(null)}
                    />
                )}
                {documentToView && (
                    <DocumentViewerModal
                        document={documentToView}
                        onClose={() => setDocumentToView(null)}
                    />
                )}
                <ToastContainer />
                <OnboardingTour currentView={currentView} onViewChange={handleViewChange} />
            </div>
        </div>
    );
};

export default App;