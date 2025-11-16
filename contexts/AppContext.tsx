
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import type { ProjectFolder, TeamMember, ProfileData, ToastMessage, ProfileDocument, SalesStage, ActivityLogEntry, TeamProfile, IndustryPlaybook, LearnedPreference } from '../types';
import { calculateProjectDatesAndPhases } from '../utils/timelineParser';
import { playbookTemplates } from '../utils/playbookTemplates';

// This is a type definition for the old status system, used only for migration.
type OldProjectStatus = 'Draft' | 'In Progress' | 'Completed' | 'Archived';

interface AppContextType {
    projectFolders: ProjectFolder[];
    teamMembers: TeamMember[];
    profileData: ProfileData;
    industryPlaybooks: IndustryPlaybook[];
    isOfflineMode: boolean;
    toasts: ToastMessage[];
    addToast: (message: string, type?: 'error' | 'success' | 'info') => void;
    removeToast: (id: string) => void;
    setOfflineMode: (isOffline: boolean) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialTeamMembers: TeamMember[] = [
    { id: crypto.randomUUID(), role: 'Project Manager', lowRate: 90, highRate: 150, project: 'General Project Resources' },
    { id: crypto.randomUUID(), role: 'Senior Full-Stack Developer', lowRate: 100, highRate: 125, project: 'General Project Resources' },
    { id: crypto.randomUUID(), role: 'Frontend Developer', lowRate: 80, highRate: 100, project: 'General Project Resources' },
    { id: crypto.randomUUID(), role: 'Backend Developer', lowRate: 85, highRate: 110, project: 'General Project Resources' },
    { id: crypto.randomUUID(), role: 'AI/ML Engineer', lowRate: 110, highRate: 140, project: 'General Project Resources' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projectFolders, setProjectFolders] = useState<ProjectFolder[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [profileData, setProfileData] = useState<ProfileData>({ teams: [], smsNumber: null });
    const [industryPlaybooks, setIndustryPlaybooks] = useState<IndustryPlaybook[]>([]);
    const [isOfflineMode, setIsOfflineMode] = useState<boolean>(true);
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    
    const [isTourOpen, setIsTourOpen] = useState(false);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

    useEffect(() => {
        try {
            const savedOfflineMode = localStorage.getItem('isOfflineMode');
            const offlineMode = savedOfflineMode ? JSON.parse(savedOfflineMode) : true;
            setIsOfflineMode(offlineMode);

            if (offlineMode) {
                const savedFolders = localStorage.getItem('projectFolders');
                if (savedFolders) {
                    const parsedFolders: any[] = JSON.parse(savedFolders);
                    
                    const migratedFolders = parsedFolders.map((folder): ProjectFolder => {
                        // --- START MIGRATION LOGIC ---
                        let salesStage: SalesStage = 'Proposal';
                        let probability = 50;

                        if (folder.status) { // if old status field exists, migrate it
                            const oldStatus = folder.status as OldProjectStatus;
                            switch (oldStatus) {
                                case 'Draft':       salesStage = 'Qualification'; probability = 25; break;
                                case 'In Progress': salesStage = 'Proposal'; probability = 50; break;
                                case 'Completed':   salesStage = 'Closed-Won'; probability = 100; break;
                                case 'Archived':    salesStage = 'Closed-Lost'; probability = 0; break;
                                default:            salesStage = 'Proposal'; probability = 50;
                            }
                        }

                        let activityLog: ActivityLogEntry[] = folder.activityLog || [];
                        if (folder.crmNotes && typeof folder.crmNotes === 'string' && folder.crmNotes.trim().length > 0) {
                            const noteExists = activityLog.some(entry => entry.details === folder.crmNotes);
                            if (!noteExists) {
                                activityLog.unshift({
                                    id: crypto.randomUUID(),
                                    type: 'Note',
                                    date: folder.generatedDate,
                                    details: folder.crmNotes
                                });
                            }
                        }

                        const { startDate, endDate, phases } = calculateProjectDatesAndPhases(folder.generatedDate, folder.proposal.projectTimeline);
                        
                        const newFolder: ProjectFolder = {
                            ...folder,
                            salesStage: folder.salesStage || salesStage,
                            probability: folder.probability ?? probability,
                            nextStepDate: folder.nextStepDate || null,
                            activityLog: activityLog,
                            crmTasks: folder.crmTasks || [],
                            startDate: folder.startDate || startDate,
                            endDate: folder.endDate || endDate,
                            phases: folder.phases || phases,
                            chatHistory: folder.chatHistory || [],
                            useGoogleSearch: folder.useGoogleSearch || false,
                        };

                        delete (newFolder as any).status;
                        delete (newFolder as any).crmNotes;
                        delete (newFolder as any).visualAsset;
                        delete (newFolder as any).generatedImageAsset;
                        delete (newFolder as any).videoPitchUri;
                        delete (newFolder as any).visualScript;

                        
                        return newFolder;
                    });
                    setProjectFolders(migratedFolders);
                }
                
                const savedMembers = localStorage.getItem('teamMembers');
                setTeamMembers(savedMembers ? JSON.parse(savedMembers) : initialTeamMembers);
                
                const savedProfileData = localStorage.getItem('profileData');
                if (savedProfileData) {
                    const parsedData = JSON.parse(savedProfileData);
                    // Migration from old single-profile to new multi-team structure
                    if (parsedData.capabilitiesStatement || parsedData.resume) {
                        const defaultTeam: TeamProfile = {
                            id: crypto.randomUUID(),
                            name: 'General Team',
                            capabilitiesStatement: (Array.isArray(parsedData.capabilitiesStatement) ? parsedData.capabilitiesStatement : []).map((d: any) => ({...d, id: d.id || crypto.randomUUID()})),
                            resume: (Array.isArray(parsedData.resume) ? parsedData.resume : []).map((d: any) => ({...d, id: d.id || crypto.randomUUID()})),
                        };
                        setProfileData({
                            teams: [defaultTeam],
                            smsNumber: parsedData.smsNumber || null,
                        });
                    } else { // It's the new format
                        setProfileData(parsedData);
                    }
                }
                const savedPlaybooks = localStorage.getItem('industryPlaybooks');
                setIndustryPlaybooks(savedPlaybooks ? JSON.parse(savedPlaybooks) : []);

            } else {
                 setTeamMembers(initialTeamMembers);
            }

            const savedOnboarding = localStorage.getItem('hasCompletedOnboarding');
            const completed = savedOnboarding ? JSON.parse(savedOnboarding) : false;
            setHasCompletedOnboarding(completed);

            if (!completed) {
                setIsTourOpen(true);
            }

        } catch (error) {
            console.error("Failed to parse from localStorage on initial load", error);
            setTeamMembers(initialTeamMembers);
            setHasCompletedOnboarding(false);
            setIsTourOpen(true);
        } finally {
            setIsInitialLoad(false);
        }
    }, []);

    useEffect(() => {
        if (isInitialLoad) return;
        try {
            localStorage.setItem('isOfflineMode', JSON.stringify(isOfflineMode));
            if (isOfflineMode) {
                // Sanitize project folders to remove large file data before saving
                const foldersToSave = projectFolders.map(folder => {
                    const { rfpFileDataUrl, ...restOfFolder } = folder;
                    
                    const sanitizedVideoScript = folder.videoScript
                        ? {
                            ...folder.videoScript,
                            scenes: folder.videoScript.scenes.map(scene => {
                                const { imageUrl, ...restOfScene } = scene;
                                return restOfScene;
                            }),
                          }
                        : undefined;
                    
                    return { ...restOfFolder, videoScript: sanitizedVideoScript };
                });
                localStorage.setItem('projectFolders', JSON.stringify(foldersToSave));

                localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
                localStorage.setItem('industryPlaybooks', JSON.stringify(industryPlaybooks));

                // Sanitize profile data to remove large file data before saving
                const profileDataToSave = {
                    ...profileData,
                    teams: profileData.teams.map(team => ({
                        ...team,
                        capabilitiesStatement: team.capabilitiesStatement.map(({ fileDataUrl, ...rest }) => rest),
                        resume: team.resume.map(({ fileDataUrl, ...rest }) => rest),
                    })),
                };
                localStorage.setItem('profileData', JSON.stringify(profileDataToSave));
                
                localStorage.setItem('hasCompletedOnboarding', JSON.stringify(hasCompletedOnboarding));
            }
        } catch(error) {
             console.error("Failed to save to localStorage", error);
             addToast('Could not save data to local storage. It may be full.', 'error');
        }
    }, [projectFolders, teamMembers, profileData, industryPlaybooks, isOfflineMode, isInitialLoad, hasCompletedOnboarding]);
    
    const addProjectFolder = useCallback((folder: ProjectFolder, idToReplace?: string) => {
        setProjectFolders(prev => {
            const filtered = idToReplace ? prev.filter(p => p.id !== idToReplace) : prev;
            return [folder, ...filtered];
        });
    }, []);
    
    const deleteProjectFolder = useCallback((id: string) => {
        setProjectFolders(prev => prev.filter(p => p.id !== id));
    }, []);

    const updateProjectFolder = useCallback((updatedFolder: ProjectFolder) => {
        setProjectFolders(prev => prev.map(p => p.id === updatedFolder.id ? updatedFolder : p));
    }, []);

    const addTeamMember = useCallback((member: Omit<TeamMember, 'id'>) => {
        setTeamMembers(prev => [...prev, { ...member, id: crypto.randomUUID() }]);
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
                    // Update existing preference for this section
                    newPreferences = [...playbook.learnedPreferences];
                    newPreferences[existingPrefIndex] = { ...newPreferences[existingPrefIndex], preference };
                } else {
                    // Add new preference
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

    const removeToast = useCallback((id: string) => {
        setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'error') => {
        const id = crypto.randomUUID();
        setToasts(currentToasts => [...currentToasts, { id, message, type }]);
    }, []);

    const openTour = useCallback(() => setIsTourOpen(true), []);
    const closeTour = useCallback(() => setIsTourOpen(false), []);
    const completeOnboarding = useCallback(() => {
        setHasCompletedOnboarding(true);
        setIsTourOpen(false);
    }, []);

    const importData = useCallback((data: { projectFolders: ProjectFolder[], teamMembers: TeamMember[], profileData: ProfileData, industryPlaybooks?: IndustryPlaybook[] }) => {
        // Basic validation
        if (data && Array.isArray(data.projectFolders) && Array.isArray(data.teamMembers) && typeof data.profileData === 'object' && data.profileData !== null) {
            setProjectFolders(data.projectFolders);
            setTeamMembers(data.teamMembers);
            setProfileData(data.profileData);
            setIndustryPlaybooks(data.industryPlaybooks || []);
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
        isOfflineMode,
        toasts,
        addToast,
        removeToast,
        setOfflineMode: setIsOfflineMode,
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
    }), [projectFolders, teamMembers, profileData, industryPlaybooks, isOfflineMode, toasts, addToast, removeToast, addProjectFolder, deleteProjectFolder, updateProjectFolder, addTeamMember, updateTeamMember, deleteTeamMember, updateIndustryPlaybook, addIndustryPlaybook, deleteIndustryPlaybook, addLearnedPreferenceToPlaybook, deleteLearnedPreferenceFromPlaybook, setIsOfflineMode, setProfileData, isTourOpen, hasCompletedOnboarding, openTour, closeTour, completeOnboarding, importData]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
