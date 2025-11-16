

import React, { useState, useCallback, useMemo } from 'react';
import type { ProfileData, ProfileDocument, TeamProfile } from '../types';
import { UploadIcon, DocumentIcon, DeleteIcon, EditIcon, SaveIcon, CheckCircleIcon, InformationCircleIcon, PlusIcon, DownloadIcon } from './icons';
import { extractTextFromFile, fileToDataUrl } from '../utils/fileParser';
import { useAppContext } from '../contexts/AppContext';

interface ProfileStrengthMeterProps {
    profileData: ProfileData;
}

const ProfileStrengthMeter: React.FC<ProfileStrengthMeterProps> = ({ profileData }) => {
    const completionSteps = useMemo(() => {
        const hasSms = !!profileData.smsNumber;
        const hasTeamWithDocs = profileData.teams.some(team => team.capabilitiesStatement.length > 0 && team.resume.length > 0);
        return [
            { name: 'At least one team has documents', completed: hasTeamWithDocs, weight: 66 },
            { name: 'SMS Number for Security', completed: hasSms, weight: 34 },
        ];
    }, [profileData]);

    const strength = useMemo(() =>
        completionSteps.reduce((acc, step) => acc + (step.completed ? step.weight : 0), 0)
    , [completionSteps]);

    const getBarColor = () => {
        if (strength > 99) return 'bg-green-500';
        if (strength > 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg" data-tour-id="profile-strength">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile Strength</h2>
            <p className="text-slate-600 mb-4">A complete profile helps the AI generate higher quality proposals.</p>
            
            <div className="flex items-center mb-4">
                <div className="w-full bg-slate-200 rounded-full h-4">
                    <div
                        className={`h-4 rounded-full transition-all duration-500 ${getBarColor()}`}
                        style={{ width: `${strength}%` }}
                    />
                </div>
                <span className="text-lg font-bold text-slate-700 ml-4 w-16 text-right">{Math.round(strength)}%</span>
            </div>

            <ul className="space-y-2">
                {completionSteps.map(step => (
                    <li key={step.name} className="flex items-center text-sm">
                        {step.completed ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        ) : (
                            <InformationCircleIcon className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
                        )}
                        <span className={step.completed ? 'text-slate-800' : 'text-slate-500'}>
                            {step.completed ? `Completed: ${step.name}` : `Needed: ${step.name}`}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


interface UploaderZoneProps {
    onUpload: (doc: Omit<ProfileDocument, 'id'>) => void;
    inputId: string;
}

const UploaderZone: React.FC<UploaderZoneProps> = ({ onUpload, inputId }) => {
    const [isParsing, setIsParsing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { addToast } = useAppContext();

    const processFile = async (file: File | null) => {
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) { // 20MB limit
            addToast('File size cannot exceed 20MB.');
            return;
        }

        setIsParsing(true);
        try {
            const [content, dataUrl] = await Promise.all([
                extractTextFromFile(file),
                fileToDataUrl(file)
            ]);

            if (!content || content.trim().length === 0) {
                addToast('Could not extract any text from the document.');
                return;
            }

            onUpload({ fileName: file.name, content, fileDataUrl: dataUrl });

        } catch (err: any) {
            addToast(`Failed to process document: ${err.message}`);
        } finally {
            setIsParsing(false);
        }
    };

    const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    }, [processFile]);

    return (
        <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${isParsing ? 'cursor-wait' : ''} ${isDragging ? 'border-red-600 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
        >
            <input
                type="file"
                id={inputId}
                className="hidden"
                onChange={(e) => processFile(e.target.files ? e.target.files[0] : null)}
                accept=".txt,.md,.pdf,.docx"
                disabled={isParsing}
            />
            {isParsing ? (
                <>
                   <svg className="animate-spin mx-auto h-10 w-10 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-sm font-medium text-slate-600">Processing Document...</p>
                </>
            ) : (
                <>
                    <UploadIcon className="mx-auto h-10 w-10 text-slate-400" />
                    <label htmlFor={inputId} className="mt-2 block text-sm font-medium text-red-600 hover:text-red-500 cursor-pointer">
                        Choose a file
                    </label>
                    <p className="text-xs text-slate-500 mt-1">or drag and drop</p>
                </>
            )}
        </div>
    );
}

interface ProfileProps {
    onViewDocument: (doc: ProfileDocument) => void;
}

const Profile: React.FC<ProfileProps> = ({ onViewDocument }) => {
    const { profileData, setProfileData, addToast, projectFolders, teamMembers, importData } = useAppContext();
    const [sms, setSms] = useState(profileData.smsNumber || '');
    const [isEditingSms, setIsEditingSms] = useState(!profileData.smsNumber);
    const [newTeamName, setNewTeamName] = useState('');

    const handleSmsSave = () => {
        if (sms.replace(/\D/g, '').length >= 10) {
            setProfileData({ ...profileData, smsNumber: sms });
            setIsEditingSms(false);
            addToast('SMS number saved successfully.', 'success');
        } else {
            addToast('Please enter a valid phone number with at least 10 digits.');
        }
    };

    const handleAddTeam = () => {
        if (!newTeamName.trim()) {
            addToast('Team name cannot be empty.');
            return;
        }
        if (profileData.teams.some(team => team.name.toLowerCase() === newTeamName.trim().toLowerCase())) {
            addToast('A team with this name already exists.');
            return;
        }
        const newTeam: TeamProfile = {
            id: crypto.randomUUID(),
            name: newTeamName.trim(),
            capabilitiesStatement: [],
            resume: [],
        };
        setProfileData({ ...profileData, teams: [...profileData.teams, newTeam] });
        setNewTeamName('');
    };

    const handleDeleteTeam = (teamId: string) => {
        if (window.confirm('Are you sure you want to delete this team and all its documents?')) {
            setProfileData({ ...profileData, teams: profileData.teams.filter(t => t.id !== teamId) });
        }
    };
    
    const handleFileUpload = (teamId: string, docType: 'capabilities' | 'resume', doc: Omit<ProfileDocument, 'id'>) => {
        const newDoc = { ...doc, id: crypto.randomUUID() };
        const updatedTeams = profileData.teams.map(team => {
            if (team.id === teamId) {
                if (docType === 'capabilities') {
                    return { ...team, capabilitiesStatement: [...team.capabilitiesStatement, newDoc] };
                } else {
                    return { ...team, resume: [...team.resume, newDoc] };
                }
            }
            return team;
        });
        setProfileData({ ...profileData, teams: updatedTeams });
    };

    const handleFileDelete = (teamId: string, docType: 'capabilities' | 'resume', docId: string) => {
        const updatedTeams = profileData.teams.map(team => {
            if (team.id === teamId) {
                if (docType === 'capabilities') {
                    return { ...team, capabilitiesStatement: team.capabilitiesStatement.filter(d => d.id !== docId) };
                } else {
                    return { ...team, resume: team.resume.filter(d => d.id !== docId) };
                }
            }
            return team;
        });
        setProfileData({ ...profileData, teams: updatedTeams });
    };

    const handleExport = () => {
        try {
            const dataToExport = {
                projectFolders,
                teamMembers,
                profileData,
            };
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            link.download = `rfp-app-backup-${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            addToast('Data exported successfully!', 'success');
        } catch (error) {
            console.error("Export failed:", error);
            addToast('Failed to export data.', 'error');
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm('Are you sure you want to import this file? This will overwrite all existing data in the application and cannot be undone.')) {
            e.target.value = ''; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') {
                    throw new Error('File could not be read as text.');
                }
                const importedData = JSON.parse(result);
                importData(importedData);
            } catch (error) {
                console.error("Import failed:", error);
                addToast('Failed to import data. The file may be corrupted or in the wrong format.', 'error');
            } finally {
                e.target.value = ''; // Reset file input
            }
        };
        reader.onerror = () => {
            addToast('Failed to read the file.', 'error');
            e.target.value = ''; // Reset file input
        };
        reader.readAsText(file);
    };


    return (
        <div className="space-y-8">
            <ProfileStrengthMeter profileData={profileData} />

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-slate-800">Security Information</h3>
                <p className="text-sm text-slate-500 mb-4">An SMS number is required to enable proposal generation.</p>
                <div className="flex items-center space-x-4">
                    <div className="flex-grow">
                        <label htmlFor="sms-number" className="block text-sm font-medium text-slate-700">SMS Number</label>
                        <input
                            id="sms-number"
                            type="tel"
                            placeholder="e.g., (555) 123-4567"
                            value={sms}
                            onChange={(e) => setSms(e.target.value)}
                            disabled={!isEditingSms}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                                focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500
                                disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
                            aria-describedby="sms-error"
                        />
                    </div>
                    {isEditingSms ? (
                        <button onClick={handleSmsSave} className="self-end p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors" title="Save SMS Number">
                            <SaveIcon className="h-6 w-6" />
                        </button>
                    ) : (
                        <button onClick={() => setIsEditingSms(true)} className="self-end p-2 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition-colors" title="Edit SMS Number">
                            <EditIcon className="h-6 w-6" />
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Manage Teams</h3>
                <div className="flex gap-2 mb-6 pb-6 border-b">
                    <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="New team name..."
                        className="flex-grow w-full px-3 py-2 border rounded-md text-sm"
                    />
                    <button onClick={handleAddTeam} title="Add New Team" className="flex-shrink-0 flex items-center justify-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">
                        <PlusIcon className="h-5 w-5 mr-1" /> Add Team
                    </button>
                </div>

                <div className="space-y-6">
                    {profileData.teams.map(team => (
                        <div key={team.id} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-bold text-slate-700">{team.name}</h4>
                                <button onClick={() => handleDeleteTeam(team.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Delete Team">
                                    <DeleteIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h5 className="font-semibold text-slate-800 mb-2">Capabilities Statements</h5>
                                    {team.capabilitiesStatement.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            {team.capabilitiesStatement.map(doc => (
                                                <div key={doc.id} className="bg-slate-50 p-2 rounded-md flex items-center justify-between">
                                                    <button onClick={() => onViewDocument(doc)} className="flex items-center space-x-2 overflow-hidden text-left hover:text-red-600 transition-colors">
                                                        <DocumentIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                                                        <p className="font-medium text-slate-800 text-sm truncate" title={doc.fileName}>{doc.fileName}</p>
                                                    </button>
                                                    <button onClick={() => handleFileDelete(team.id, 'capabilities', doc.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full" title="Delete"><DeleteIcon className="h-4 w-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <UploaderZone onUpload={(doc) => handleFileUpload(team.id, 'capabilities', doc)} inputId={`caps-upload-${team.id}`} />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-slate-800 mb-2">Resumes / Company Bios</h5>
                                    {team.resume.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            {team.resume.map(doc => (
                                                 <div key={doc.id} className="bg-slate-50 p-2 rounded-md flex items-center justify-between">
                                                    <button onClick={() => onViewDocument(doc)} className="flex items-center space-x-2 overflow-hidden text-left hover:text-red-600 transition-colors">
                                                        <DocumentIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                                                        <p className="font-medium text-slate-800 text-sm truncate" title={doc.fileName}>{doc.fileName}</p>
                                                    </button>
                                                    <button onClick={() => handleFileDelete(team.id, 'resume', doc.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full" title="Delete"><DeleteIcon className="h-4 w-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <UploaderZone onUpload={(doc) => handleFileUpload(team.id, 'resume', doc)} inputId={`resume-upload-${team.id}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                    {profileData.teams.length === 0 && (
                        <div className="text-center text-slate-500 py-8">
                            <p>No teams created yet. Add a team to start uploading documents.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Data Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                    <div>
                        <h4 className="font-semibold text-slate-700">Export All Data</h4>
                        <p className="text-sm text-slate-500 mb-3">Download a JSON file of all projects, resources, and settings. Keep this file safe as a backup.</p>
                        <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                            <DownloadIcon className="w-5 h-5" />
                            Export Backup File
                        </button>
                    </div>
                    <div>
                         <h4 className="font-semibold text-slate-700">Import from Backup</h4>
                         <p className="text-sm text-slate-500 mb-3">Restore your workspace from a backup file. This action will overwrite all current data.</p>
                         <label htmlFor="import-file" className="w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-700 transition-colors">
                            <UploadIcon className="w-5 h-5" />
                            Import from Backup
                         </label>
                         <input type="file" id="import-file" accept=".json" className="hidden" onChange={handleImport} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;