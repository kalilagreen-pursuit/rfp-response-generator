
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import type { ProjectFolder, TeamMember, ProfileData, ToastMessage, ProfileDocument, SalesStage, ActivityLogEntry, TeamProfile, IndustryPlaybook, LearnedPreference } from '../types';
import { calculateProjectDatesAndPhases } from '../utils/timelineParser';
import { playbookTemplates } from '../utils/playbookTemplates';
import { profileAPI, proposalsAPI, getAuthToken } from '../services/api';

interface AppContextType {
    projectFolders: ProjectFolder[];
    teamMembers: TeamMember[];
    profileData: ProfileData;
    industryPlaybooks: IndustryPlaybook[];
    isLoading: boolean;
    toasts: ToastMessage[];
    addToast: (message: string, type?: 'error' | 'success' | 'info') => void;
    removeToast: (id: string) => void;
    setProfileData: (data: ProfileData) => void;
    addProjectFolder: (folder: ProjectFolder, idToReplace?: string) => void;
    deleteProjectFolder: (id: string) => void;
    updateProjectFolder: (folder: ProjectFolder) => void;
    addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
    updateTeamMember: (member: TeamMember) => void;
    deleteTeamMember: (id: string) => void;
    updateIndustryPlaybook: (playbook: IndustryPlaybook) => void;
    addIndustryPlaybook: (name: string, templateKey?: string) => void;
    deleteIndustryPlaybook: (id: string) => void;
    addLearnedPreferenceToPlaybook: (playbookId: string, sectionKey: string, preference: string) => void;
    deleteLearnedPreferenceFromPlaybook: (playbookId: string, preferenceId: string) => void;
    isTourOpen: boolean;
    hasCompletedOnboarding: boolean;
    openTour: () => void;
    closeTour: () => void;
    completeOnboarding: () => void;
    importData: (data: { projectFolders: ProjectFolder[], teamMembers: TeamMember[], profileData: ProfileData, industryPlaybooks?: IndustryPlaybook[] }) => void;
    refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialTeamMembers: TeamMember[] = [
    { id: crypto.randomUUID(), role: 'Project Manager', lowRate: 90, highRate: 150, project: 'General Project Resources' },
    { id: crypto.randomUUID(), role: 'Senior Full-Stack Developer', lowRate: 100, highRate: 125, project: 'General Project Resources' },
    { id: crypto.randomUUID(), role: 'Frontend Developer', lowRate: 80, highRate: 100, project: 'General Project Resources' },
    { id: crypto.randomUUID(), role: 'Backend Developer', lowRate: 85, highRate: 110, project: 'General Project Resources' },
    { id: crypto.randomUUID(), role: 'AI/ML Engineer', lowRate: 110, highRate: 140, project: 'General Project Resources' },
];

// Helper to convert backend proposal to frontend ProjectFolder
const backendToProjectFolder = (proposal: any): ProjectFolder => {
    const content = proposal.content || {};
    return {
        id: proposal.id,
        folderName: content.folderName || proposal.title,
        rfpFileName: content.rfpFileName || 'Unknown',
        rfpContent: content.rfpContent || '',
        rfpFileDataUrl: content.rfpFileDataUrl || '',
        proposal: content.proposal || {},
        generatedDate: content.generatedDate || proposal.created_at,
        chatHistory: content.chatHistory || [],
        templateId: content.templateId || proposal.template || 'standard',
        teamId: content.teamId || '',
        playbookId: content.playbookId || null,
        useGoogleSearch: content.useGoogleSearch || false,
        salesStage: content.salesStage || 'Prospecting',
        probability: content.probability ?? 10,
        nextStepDate: content.nextStepDate || null,
        activityLog: content.activityLog || [],
        crmTasks: content.crmTasks || [],
        startDate: content.startDate,
        endDate: content.endDate,
        phases: content.phases || [],
        scorecard: content.scorecard,
        slideshow: content.slideshow,
        videoScript: content.videoScript,
        insights: content.insights,
        internalNotes: content.internalNotes || [],
        internalNotesSummary: content.internalNotesSummary,
        leadScore: content.leadScore,
        leadScoreReasoning: content.leadScoreReasoning,
    };
};

// Helper to convert frontend ProjectFolder to backend format
const projectFolderToBackend = (folder: ProjectFolder) => {
    return {
        title: folder.proposal?.projectName || folder.folderName,
        status: folder.salesStage === 'Closed-Won' ? 'submitted' :
                folder.salesStage === 'Closed-Lost' ? 'withdrawn' : 'draft',
        template: folder.templateId || 'standard',
        content: {
            folderName: folder.folderName,
            rfpFileName: folder.rfpFileName,
            rfpContent: folder.rfpContent,
            rfpFileDataUrl: folder.rfpFileDataUrl,
            proposal: folder.proposal,
            generatedDate: folder.generatedDate,
            chatHistory: folder.chatHistory,
            templateId: folder.templateId,
            teamId: folder.teamId,
            playbookId: folder.playbookId,
            useGoogleSearch: folder.useGoogleSearch,
            salesStage: folder.salesStage,
            probability: folder.probability,
            nextStepDate: folder.nextStepDate,
            activityLog: folder.activityLog,
            crmTasks: folder.crmTasks,
            startDate: folder.startDate,
            endDate: folder.endDate,
            phases: folder.phases,
            scorecard: folder.scorecard,
            slideshow: folder.slideshow,
            videoScript: folder.videoScript,
            insights: folder.insights,
            internalNotes: folder.internalNotes,
            internalNotesSummary: folder.internalNotesSummary,
            leadScore: folder.leadScore,
            leadScoreReasoning: folder.leadScoreReasoning,
        }
    };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projectFolders, setProjectFolders] = useState<ProjectFolder[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
    const [profileData, setProfileDataState] = useState<ProfileData>({ teams: [], smsNumber: null });
    const [industryPlaybooks, setIndustryPlaybooks] = useState<IndustryPlaybook[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const [isTourOpen, setIsTourOpen] = useState(false);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

    const removeToast = useCallback((id: string) => {
        setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'error') => {
        const id = crypto.randomUUID();
        setToasts(currentToasts => [...currentToasts, { id, message, type }]);
    }, []);

    // Load data from backend on mount
    const loadDataFromBackend = useCallback(async () => {
        if (!getAuthToken()) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // Load proposals and profile in parallel for faster loading
            const [proposalsResponse, profileResponse] = await Promise.all([
                proposalsAPI.list(),
                profileAPI.get()
            ]);

            // Process proposals
            if (proposalsResponse.proposals) {
                const folders = proposalsResponse.proposals.map(backendToProjectFolder);
                setProjectFolders(folders);
            }

            // Process profile
            if (profileResponse.profile) {
                const profile = profileResponse.profile;
                const contactInfo = profile.contact_info || {};

                // Convert backend profile to frontend format
                // Teams, teamMembers, industryPlaybooks are stored in contact_info
                setProfileDataState({
                    teams: contactInfo.teams || [],
                    smsNumber: contactInfo.sms || null,
                    companyName: profile.company_name,
                });

                // Load team members from contact_info if available
                if (contactInfo.teamMembers) {
                    setTeamMembers(contactInfo.teamMembers);
                }

                // Load playbooks from contact_info if available
                if (contactInfo.industryPlaybooks) {
                    setIndustryPlaybooks(contactInfo.industryPlaybooks);
                }
            }

            // Check onboarding status from localStorage (UI preference)
            const savedOnboarding = localStorage.getItem('hasCompletedOnboarding');
            const completed = savedOnboarding ? JSON.parse(savedOnboarding) : false;
            setHasCompletedOnboarding(completed);
            if (!completed) {
                setIsTourOpen(true);
            }

        } catch (error) {
            console.error('Failed to load data from backend:', error);
            addToast('Failed to load data. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadDataFromBackend();
    }, [loadDataFromBackend]);

    // Save onboarding status to localStorage (UI preference only)
    useEffect(() => {
        localStorage.setItem('hasCompletedOnboarding', JSON.stringify(hasCompletedOnboarding));
    }, [hasCompletedOnboarding]);

    const refreshData = useCallback(async () => {
        await loadDataFromBackend();
    }, [loadDataFromBackend]);

    const addProjectFolder = useCallback(async (folder: ProjectFolder, idToReplace?: string) => {
        // Update local state immediately for responsiveness
        setProjectFolders(prev => {
            const filtered = idToReplace ? prev.filter(p => p.id !== idToReplace) : prev;
            return [folder, ...filtered];
        });

        // Sync to backend
        if (getAuthToken()) {
            try {
                const backendData = projectFolderToBackend(folder);

                if (idToReplace) {
                    // Update existing
                    await proposalsAPI.update(idToReplace, backendData);
                } else {
                    // Create new - we need to handle this differently since backend expects rfpId
                    // For now, we'll create a proposal directly with the content
                    const response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api'}/proposals`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getAuthToken()}`,
                        },
                        body: JSON.stringify(backendData),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Update local folder with backend ID
                        setProjectFolders(prev => prev.map(p =>
                            p.id === folder.id ? { ...p, id: data.proposal?.id || p.id } : p
                        ));
                    }
                }
            } catch (error) {
                console.error('Failed to sync project to backend:', error);
            }
        }
    }, []);

    const deleteProjectFolder = useCallback(async (id: string) => {
        // Update local state immediately
        setProjectFolders(prev => prev.filter(p => p.id !== id));

        // Sync to backend
        if (getAuthToken()) {
            try {
                await proposalsAPI.delete(id);
            } catch (error) {
                console.error('Failed to delete project from backend:', error);
            }
        }
    }, []);

    const updateProjectFolder = useCallback(async (updatedFolder: ProjectFolder) => {
        // Update local state immediately
        setProjectFolders(prev => prev.map(p => p.id === updatedFolder.id ? updatedFolder : p));

        // Sync to backend
        if (getAuthToken()) {
            try {
                const backendData = projectFolderToBackend(updatedFolder);
                await proposalsAPI.update(updatedFolder.id, backendData);
            } catch (error) {
                console.error('Failed to update project in backend:', error);
            }
        }
    }, []);

    const setProfileData = useCallback(async (data: ProfileData) => {
        // Update local state immediately
        setProfileDataState(data);

        // Sync to backend
        if (getAuthToken()) {
            try {
                await profileAPI.update({
                    company_name: (data as any).companyName,
                    contact_info: {
                        sms: data.smsNumber,
                        teams: data.teams,
                        teamMembers: teamMembers,
                        industryPlaybooks: industryPlaybooks,
                    },
                });
            } catch (error) {
                console.error('Failed to sync profile to backend:', error);
            }
        }
    }, [teamMembers, industryPlaybooks]);

    const addTeamMember = useCallback((member: Omit<TeamMember, 'id'>) => {
        const newMember = { ...member, id: crypto.randomUUID() };
        setTeamMembers(prev => [...prev, newMember]);
        // Team members are synced as part of profile
    }, []);

    const updateTeamMember = useCallback((updatedMember: TeamMember) => {
        setTeamMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    }, []);

    const deleteTeamMember = useCallback((id: string) => {
        setTeamMembers(prev => prev.filter(m => m.id !== id));
    }, []);

    const updateIndustryPlaybook = useCallback((updatedPlaybook: IndustryPlaybook) => {
        setIndustryPlaybooks(prev => prev.map(p => p.id === updatedPlaybook.id ? updatedPlaybook : p));
    }, []);

    const addIndustryPlaybook = useCallback((name: string, templateKey?: string) => {
        const template = templateKey && playbookTemplates[templateKey]
            ? playbookTemplates[templateKey]
            : null;

        const newPlaybook: IndustryPlaybook = {
            id: crypto.randomUUID(),
            name,
            glossary: template ? template.glossary.map(g => ({...g, id: crypto.randomUUID()})) : [],
            kpis: template ? [...template.kpis] : [],
            complianceProfiles: template ? template.complianceProfiles.map(c => ({...c, id: crypto.randomUUID()})) : [],
            customSections: template ? template.customSections.map(c => ({...c, id: crypto.randomUUID()})) : [],
            learnedPreferences: [],
        };
        setIndustryPlaybooks(prev => [...prev, newPlaybook]);
    }, []);

    const deleteIndustryPlaybook = useCallback((id: string) => {
        setIndustryPlaybooks(prev => prev.filter(p => p.id !== id));
    }, []);

    const addLearnedPreferenceToPlaybook = useCallback((playbookId: string, sectionKey: string, preference: string) => {
        setIndustryPlaybooks(prev => prev.map(playbook => {
            if (playbook.id === playbookId) {
                const existingPrefIndex = playbook.learnedPreferences.findIndex(p => p.sectionKey === sectionKey);
                let newPreferences;
                if (existingPrefIndex > -1) {
                    newPreferences = [...playbook.learnedPreferences];
                    newPreferences[existingPrefIndex] = { ...newPreferences[existingPrefIndex], preference };
                } else {
                    const newPref: LearnedPreference = { id: crypto.randomUUID(), sectionKey, preference };
                    newPreferences = [...playbook.learnedPreferences, newPref];
                }
                return { ...playbook, learnedPreferences: newPreferences };
            }
            return playbook;
        }));
    }, []);

    const deleteLearnedPreferenceFromPlaybook = useCallback((playbookId: string, preferenceId: string) => {
        setIndustryPlaybooks(prev => prev.map(playbook => {
            if (playbook.id === playbookId) {
                return {
                    ...playbook,
                    learnedPreferences: playbook.learnedPreferences.filter(p => p.id !== preferenceId),
                };
            }
            return playbook;
        }));
    }, []);

    const openTour = useCallback(() => setIsTourOpen(true), []);
    const closeTour = useCallback(() => setIsTourOpen(false), []);
    const completeOnboarding = useCallback(() => {
        setHasCompletedOnboarding(true);
        setIsTourOpen(false);
    }, []);

    const importData = useCallback(async (data: { projectFolders: ProjectFolder[], teamMembers: TeamMember[], profileData: ProfileData, industryPlaybooks?: IndustryPlaybook[] }) => {
        if (data && Array.isArray(data.projectFolders) && Array.isArray(data.teamMembers) && typeof data.profileData === 'object' && data.profileData !== null) {
            setProjectFolders(data.projectFolders);
            setTeamMembers(data.teamMembers);
            setProfileDataState(data.profileData);
            setIndustryPlaybooks(data.industryPlaybooks || []);

            // Sync imported data to backend
            if (getAuthToken()) {
                try {
                    // Sync profile
                    await profileAPI.update({
                        company_name: (data.profileData as any).companyName,
                        contact_info: { sms: data.profileData.smsNumber },
                        teams: data.profileData.teams,
                        teamMembers: data.teamMembers,
                        industryPlaybooks: data.industryPlaybooks || [],
                    });

                    // Sync each project
                    for (const folder of data.projectFolders) {
                        const backendData = projectFolderToBackend(folder);
                        await proposalsAPI.update(folder.id, backendData);
                    }
                } catch (error) {
                    console.error('Failed to sync imported data to backend:', error);
                }
            }

            addToast('Data imported successfully!', 'success');
        } else {
            addToast('Invalid or corrupted backup file format.', 'error');
        }
    }, [addToast]);

    const value = useMemo(() => ({
        projectFolders,
        teamMembers,
        profileData,
        industryPlaybooks,
        isLoading,
        toasts,
        addToast,
        removeToast,
        setProfileData,
        addProjectFolder,
        deleteProjectFolder,
        updateProjectFolder,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        updateIndustryPlaybook,
        addIndustryPlaybook,
        deleteIndustryPlaybook,
        addLearnedPreferenceToPlaybook,
        deleteLearnedPreferenceFromPlaybook,
        isTourOpen,
        hasCompletedOnboarding,
        openTour,
        closeTour,
        completeOnboarding,
        importData,
        refreshData,
    }), [projectFolders, teamMembers, profileData, industryPlaybooks, isLoading, toasts, addToast, removeToast, addProjectFolder, deleteProjectFolder, updateProjectFolder, addTeamMember, updateTeamMember, deleteTeamMember, updateIndustryPlaybook, addIndustryPlaybook, deleteIndustryPlaybook, addLearnedPreferenceToPlaybook, deleteLearnedPreferenceFromPlaybook, setProfileData, isTourOpen, hasCompletedOnboarding, openTour, closeTour, completeOnboarding, importData, refreshData]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
