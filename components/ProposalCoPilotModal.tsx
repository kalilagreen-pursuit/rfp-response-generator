
import React, { useState, useEffect, useRef } from 'react';
import type { ProjectFolder, Resource, ChatMessage, RfpInsights, Proposal } from '../types';
import { CloseIcon, EmailIcon, DownloadIcon, ChatBubbleLeftRightIcon, DocumentIcon, InformationCircleIcon, CalendarIcon, CodeIcon, UsersIcon, ClipboardCheckIcon, ViewIcon, RefreshIcon, CalendarPlusIcon, LightbulbIcon, SaveIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { useAppContext } from '../contexts/AppContext';
import { continueChatInProposal } from '@/services/geminiService';
import { generateIcsContent, downloadIcsFile } from '../utils/calendarExporter';
import { calculateProjectDatesAndPhases } from '../utils/timelineParser';
import TeamMembersList from './TeamMembersList';
import InviteTeamMemberModal from './InviteTeamMemberModal';
import { syncService } from '../services/syncService';
import { analyticsAPI } from '../services/api';

interface EditableSectionProps {
    title: string;
    content: string;
    sectionKey: string;
    isEdited: boolean;
    onContentChange: (sectionKey: string, newContent: string) => void;
    onTeach: (sectionKey: string, newContent: string) => void;
    canTeach: boolean;
}

const EditableSection: React.FC<EditableSectionProps> = ({ title, content, sectionKey, isEdited, onContentChange, onTeach, canTeach }) => {
    return (
        <section>
            <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-red-100">
                <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
                {isEdited && (
                    <button
                        onClick={() => onTeach(sectionKey, content)}
                        disabled={!canTeach}
                        title={canTeach ? "Save this version as the preferred style for future proposals using this playbook." : "A playbook must be used with a project to teach the AI."}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full hover:bg-amber-200 disabled:opacity-50 disabled:cursor-help"
                    >
                        <LightbulbIcon className="w-4 h-4" />
                        Teach AI
                    </button>
                )}
            </div>
            <textarea
                value={content}
                onChange={(e) => onContentChange(sectionKey, e.target.value)}
                className="w-full h-48 p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 text-slate-700 leading-relaxed whitespace-pre-wrap transition-colors duration-200"
                aria-label={title}
            />
        </section>
    );
};


interface ProposalCoPilotModalProps {
  projectFolder: ProjectFolder | null;
  onClose: () => void;
  onEmail: (folder: ProjectFolder) => void;
  onViewScorecard: (folder: ProjectFolder) => void;
  onViewSlideshow: (folder: ProjectFolder) => void;
  onUpdateProject: (folder: ProjectFolder) => void;
  onViewRfp: (folder: ProjectFolder) => void;
  onDownloadPdf: (folder: ProjectFolder) => void;
  isDownloadingPdf: boolean;
  onRegenerateProposal: (folder: ProjectFolder) => void;
  isRegeneratingProposal: boolean;
}

// Helper component for styled insight items
const InsightItem: React.FC<{ icon: React.FC<{className?: string}>, label: string, children: React.ReactNode, fullSpan?: boolean }> = ({ icon: Icon, label, children, fullSpan = false }) => (
    <div className={`flex items-start space-x-3 p-3 bg-white rounded-md border border-slate-200 ${fullSpan ? 'sm:col-span-2' : ''}`}>
        <Icon className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
            <p className="font-semibold text-slate-700 text-sm leading-tight">{label}</p>
            <div className="text-slate-600 text-sm mt-1">{children}</div>
        </div>
    </div>
);

// A unified section for all extracted RFP information
const RfpDetailsSection: React.FC<{ insights?: RfpInsights; proposal: Proposal }> = ({ insights, proposal }) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; 
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };
    
    const { contactPerson, contactEmail } = proposal;
    const hasInsights = insights && (insights.submissionDeadline || insights.budget || insights.keyObjectives?.length || insights.requiredTechnologies?.length || insights.keyStakeholders?.length);
    const hasContactInfo = contactPerson || contactEmail;

    if (!hasInsights && !hasContactInfo) return null;

    return (
    <section className="mb-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-500" />
            RFP Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactPerson && <InsightItem icon={UsersIcon} label="Point of Contact"><p className="font-bold">{contactPerson}</p></InsightItem>}
            {contactEmail && <InsightItem icon={EmailIcon} label="Contact Email"><a href={`mailto:${contactEmail}`} className="text-red-600 hover:underline font-bold">{contactEmail}</a></InsightItem>}

            {insights?.submissionDeadline && (
                <InsightItem icon={CalendarIcon} label="Submission Deadline">
                    <p className="font-bold">{formatDate(insights.submissionDeadline)}</p>
                </InsightItem>
            )}
             {insights?.budget && (
                <InsightItem icon={InformationCircleIcon} label="Mentioned Budget">
                    <p className="font-bold">{insights.budget}</p>
                </InsightItem>
            )}
            {insights?.requiredTechnologies && insights.requiredTechnologies.length > 0 && (
                <InsightItem icon={CodeIcon} label="Required Technologies">
                    <p>{insights.requiredTechnologies.join(', ')}</p>
                </InsightItem>
            )}
             {insights?.keyStakeholders && insights.keyStakeholders.length > 0 && (
                <InsightItem icon={UsersIcon} label="Key Stakeholders">
                   <p>{insights.keyStakeholders.join(', ')}</p>
                </InsightItem>
            )}
             {insights?.keyObjectives && insights.keyObjectives.length > 0 && (
                <InsightItem icon={ClipboardCheckIcon} label="Key Objectives" fullSpan>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                        {insights.keyObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
                    </ul>
                </InsightItem>
            )}
        </div>
    </section>
    );
};

interface ProposalContentProps {
    projectFolder: ProjectFolder;
    editedProposal: Proposal;
    onViewRfp: (folder: ProjectFolder) => void;
    onContentChange: (sectionKey: string, newContent: string) => void;
    onTeach: (sectionKey: string, newContent: string) => void;
}

const ProposalContent: React.FC<ProposalContentProps> = ({ projectFolder, editedProposal, onViewRfp, onContentChange, onTeach }) => {
    const { proposal, insights } = projectFolder;
    const hasDetails = insights || proposal.contactPerson || proposal.contactDepartment || proposal.contactEmail;
    const hasCalendarEvents = proposal.calendarEvents && proposal.calendarEvents.length > 0;
    const canTeachAI = !!projectFolder.playbookId;

    const standardKeys = new Set([
      'projectName', 'executiveSummary', 'technicalApproach', 'resources', 
      'projectTimeline', 'investmentEstimate', 'valueProposition', 
      'questionsForClient', 'contactPerson', 'contactDepartment', 
      'contactEmail', 'calendarEvents', 'insights', 'folderName'
    ]);
    
    const customSections = Object.entries(proposal)
        .filter(([key]) => !standardKeys.has(key))
        .map(([key, value]) => ({
            key,
            title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
            content: value as string,
        }));
    
     const handleDownloadRfp = (e: React.MouseEvent) => {
        e.preventDefault();
        const link = document.createElement('a');
        link.href = projectFolder.rfpFileDataUrl;
        link.download = projectFolder.rfpFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAddToCalendar = () => {
        if (!hasCalendarEvents) return;
        
        const icsContent = generateIcsContent(proposal.calendarEvents!, proposal.projectName);
        downloadIcsFile(icsContent, `${proposal.projectName.replace(/\s/g, '_')}_deadlines.ics`);
    };

    return (
        <div className="space-y-8">
            {projectFolder.rfpFileName && (projectFolder.rfpFileDataUrl || projectFolder.rfpContent) && (
                 <section className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <h3 className="text-base font-semibold text-slate-700 mb-3 flex items-center">
                        <DocumentIcon className="w-5 h-5 mr-2 text-slate-500" />
                        Source RFP Document
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3 rounded-md border border-slate-200">
                        <p className="font-medium text-slate-800 truncate" title={projectFolder.rfpFileName}>
                            {projectFolder.rfpFileName}
                        </p>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-shrink-0 ml-0 sm:ml-4">
                            <button
                                onClick={() => onViewRfp(projectFolder)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center gap-1.5"
                            >
                                <ViewIcon className="w-4 h-4" />
                                View
                            </button>
                            {projectFolder.rfpFileDataUrl && (
                                <button
                                    onClick={handleDownloadRfp}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors flex items-center gap-1.5"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    Download
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {hasDetails && <RfpDetailsSection insights={insights} proposal={proposal} />}
            
            <EditableSection
                title="Executive Summary"
                sectionKey="executiveSummary"
                content={editedProposal.executiveSummary}
                onContentChange={onContentChange}
                onTeach={onTeach}
                isEdited={projectFolder.proposal.executiveSummary !== editedProposal.executiveSummary}
                canTeach={canTeachAI}
            />
            
            <EditableSection
                title="Technical Approach & Solution Architecture"
                sectionKey="technicalApproach"
                content={editedProposal.technicalApproach}
                onContentChange={onContentChange}
                onTeach={onTeach}
                isEdited={projectFolder.proposal.technicalApproach !== editedProposal.technicalApproach}
                canTeach={canTeachAI}
            />
            
            {customSections.map(section => (
              <EditableSection
                  key={section.key}
                  title={section.title}
                  sectionKey={section.key}
                  content={editedProposal[section.key] || ''}
                  onContentChange={onContentChange}
                  onTeach={onTeach}
                  isEdited={projectFolder.proposal[section.key] !== editedProposal[section.key]}
                  canTeach={canTeachAI}
              />
            ))}

            {hasCalendarEvents && (
                <section>
                    <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-red-100">
                        <h3 className="text-2xl font-bold text-slate-800">Key Dates & Deadlines</h3>
                        <button 
                            onClick={handleAddToCalendar}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-700"
                            title="Download .ics file to add events to your calendar"
                        >
                            <CalendarPlusIcon className="w-4 h-4" />
                            Add to Calendar
                        </button>
                    </div>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-left">
                                <tr className="text-xs text-slate-600 uppercase font-semibold">
                                    <th scope="col" className="px-4 py-3">Event</th>
                                    <th scope="col" className="px-4 py-3 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {proposal.calendarEvents!.map((event, index) => (
                                    <tr key={index} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{event.title}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                                            {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            <section>
                <h3 className="text-2xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-red-100">Resource Requirements</h3>
                 <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full min-w-[600px] text-sm">
                        <thead className="bg-slate-100 text-left">
                            <tr className="text-xs text-slate-600 uppercase font-semibold">
                                <th scope="col" className="px-4 py-3">Role</th>
                                <th scope="col" className="px-4 py-3 text-right">Hours</th>
                                <th scope="col" className="px-4 py-3 text-center">Rate/Hour</th>
                                <th scope="col" className="px-4 py-3 text-right">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {proposal.resources.map((res: Resource, index: number) => (
                                <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{res.role}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{res.hours}</td>
                                    <td className="px-4 py-3 text-center tabular-nums text-slate-600">{`${formatCurrency(res.lowRate)} - ${formatCurrency(res.highRate)}`}</td>
                                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{`${formatCurrency(res.hours * res.lowRate)} - ${formatCurrency(res.hours * res.highRate)}`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Role Responsibilities */}
                {proposal.resources.some(r => r.description) && (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">Role Responsibilities</h4>
                        <div className="space-y-3">
                            {proposal.resources.filter(r => r.description).map((res: Resource, index: number) => (
                                <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="font-semibold text-slate-800 mb-1">{res.role}</div>
                                    <div className="text-sm text-slate-600">{res.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            <section>
                <h3 className="text-2xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-red-100">Project Timeline</h3>
                <div className="space-y-4">
                    {proposal.projectTimeline.split(/(?=Phase \d+:)/g).filter(p => p.trim()).map((phase, index) => {
                        const parts = phase.split(':');
                        const phaseTitle = parts[0];
                        const phaseDetails = parts.slice(1).join(':').trim();
                        return (
                            <div key={index} className="flex items-start p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="mr-4 flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <span className="text-lg font-bold text-red-600">{index + 1}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-800">{phaseTitle}</div>
                                    <div className="text-slate-600 text-sm">{phaseDetails}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
            
            <section>
                <h3 className="text-2xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-red-100">Investment Estimate</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
                        <p className="text-sm font-medium text-green-800">Low Estimate (Optimistic)</p>
                        <p className="mt-2 text-4xl font-bold text-green-700">{formatCurrency(proposal.investmentEstimate.low)}</p>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 text-center">
                        <p className="text-sm font-medium text-amber-800">High Estimate (Incl. Contingency)</p>
                        <p className="mt-2 text-4xl font-bold text-amber-700">{formatCurrency(proposal.investmentEstimate.high)}</p>
                    </div>
                </div>
                
                <h4 className="text-md font-semibold text-slate-700 mb-2">Cost Breakdown</h4>
                 <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                    {proposal.investmentEstimate.breakdown.map((item, index) => (
                         <li key={index} className="flex justify-between items-center p-3 text-sm even:bg-slate-50">
                            <span className="text-slate-600">{item.component}</span>
                            <span className="font-mono font-medium text-slate-800">{formatCurrency(item.lowCost)} - {formatCurrency(item.highCost)}</span>
                         </li>
                    ))}
                </ul>
            </section>
            
            <EditableSection
                title="Value Proposition & ROI"
                sectionKey="valueProposition"
                content={editedProposal.valueProposition}
                onContentChange={onContentChange}
                onTeach={onTeach}
                isEdited={projectFolder.proposal.valueProposition !== editedProposal.valueProposition}
                canTeach={canTeachAI}
            />
            
            <section>
                <h3 className="text-2xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-red-100">Clarifying Questions</h3>
                <ul className="list-decimal list-inside space-y-3 text-slate-600 pl-2">
                    {proposal.questionsForClient.map((q, index) => <li key={index}>{q}</li>)}
                </ul>
            </section>
        </div>
    );
};


const ProposalCoPilotModal: React.FC<ProposalCoPilotModalProps> = ({ projectFolder, onClose, onEmail, onViewScorecard, onViewSlideshow, onUpdateProject, onDownloadPdf, isDownloadingPdf, onViewRfp, onRegenerateProposal, isRegeneratingProposal }) => {
  const { addToast, profileData, addLearnedPreferenceToPlaybook } = useAppContext();
  const [userInput, setUserInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [editedProposal, setEditedProposal] = useState<Proposal | null>(projectFolder?.proposal || null);
  const [activeTab, setActiveTab] = useState<'proposal' | 'team'>('proposal');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [teamRefreshTrigger, setTeamRefreshTrigger] = useState(0);
  const [syncedProposalId, setSyncedProposalId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-sync proposal when modal opens
  useEffect(() => {
    if (projectFolder && syncService.isAuthenticated()) {
      console.log('[ProposalCoPilot] Starting proposal sync for:', projectFolder.id);
      setIsSyncing(true);
      syncService.syncProject(projectFolder)
        .then((proposalId) => {
          if (proposalId) {
            console.log('[ProposalCoPilot] Proposal synced successfully:', proposalId);
            setSyncedProposalId(proposalId);
            // Update the project folder with the synced ID if it changed
            if (proposalId !== projectFolder.id) {
              console.log('[ProposalCoPilot] Updating project folder ID from', projectFolder.id, 'to', proposalId);
              onUpdateProject({ ...projectFolder, id: proposalId });
              addToast('Proposal synced to database', 'success');
            } else {
              addToast('Proposal already synced', 'info');
            }
          } else {
            console.warn('[ProposalCoPilot] Sync returned null proposal ID');
            setSyncedProposalId(projectFolder.id);
          }
        })
        .catch((error) => {
          console.error('[ProposalCoPilot] Failed to sync proposal:', error);
          addToast('Failed to sync proposal. Using local version.', 'error');
          // Still allow using the modal even if sync fails
          // Use the original ID as fallback
          setSyncedProposalId(projectFolder.id);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    } else {
      // If not authenticated, just use the folder ID
      console.log('[ProposalCoPilot] Not authenticated, skipping sync');
      setSyncedProposalId(projectFolder?.id || null);
    }
  }, [projectFolder?.id]); // Sync when proposal ID changes

  useEffect(() => {
    // Reset local state if the project folder changes
    setEditedProposal(projectFolder?.proposal || null);
  }, [projectFolder]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [projectFolder?.chatHistory, isResponding]);

  // Track proposal editing time
  useEffect(() => {
    let trackingId: string | null = null;

    if (syncedProposalId && syncService.isAuthenticated()) {
      // Start tracking the "edit" stage when modal opens
      analyticsAPI.trackStageStart(syncedProposalId, 'edit')
        .then((response) => {
          if (response.tracking?.id) {
            trackingId = response.tracking.id;
            console.log('[ProposalCoPilot] Started tracking edit stage:', response.tracking.id);
          }
        })
        .catch((error) => {
          console.error('[ProposalCoPilot] Failed to start time tracking:', error);
        });
    }

    // Complete tracking when modal closes
    return () => {
      if (trackingId) {
        analyticsAPI.trackStageComplete(trackingId)
          .then(() => {
            console.log('[ProposalCoPilot] Completed tracking edit stage');
          })
          .catch((error) => {
            console.error('[ProposalCoPilot] Failed to complete time tracking:', error);
          });
      }
    };
  }, [syncedProposalId]); // Only run when synced proposal ID is set

  if (!projectFolder || !editedProposal) return null;
  const { proposal } = projectFolder;
  const hasScorecard = !!projectFolder.scorecard;
  const hasSlideshow = !!projectFolder.slideshow;
  const isProposalEdited = JSON.stringify(projectFolder.proposal) !== JSON.stringify(editedProposal);

  const handleContentChange = (sectionKey: string, newContent: string) => {
    setEditedProposal(prev => prev ? { ...prev, [sectionKey]: newContent } : null);
  };

  const handleTeachAI = (sectionKey: string, newContent: string) => {
    if (!projectFolder.playbookId) {
        addToast('A playbook must be used with a project to teach the AI.', 'info');
        return;
    }
    addLearnedPreferenceToPlaybook(projectFolder.playbookId, sectionKey, newContent);
    addToast(`AI preference for '${sectionKey}' saved to playbook.`, 'success');
  };

  const handleDownloadWithTracking = async () => {
    // Track the export stage
    if (syncedProposalId && syncService.isAuthenticated()) {
      try {
        const trackingResponse = await analyticsAPI.trackStageStart(syncedProposalId, 'export');
        const trackingId = trackingResponse.tracking?.id;

        // Call the original download function
        onDownloadPdf(projectFolder);

        // Complete the tracking immediately after initiating download
        if (trackingId) {
          await analyticsAPI.trackStageComplete(trackingId);
          console.log('[ProposalCoPilot] Tracked export stage completion');
        }
      } catch (error) {
        console.error('[ProposalCoPilot] Failed to track export:', error);
        // Still proceed with download even if tracking fails
        onDownloadPdf(projectFolder);
      }
    } else {
      // If not synced/authenticated, just download
      onDownloadPdf(projectFolder);
    }
  };

  const handleSaveChanges = () => {
    if (editedProposal) {
        const { startDate, endDate, phases } = calculateProjectDatesAndPhases(projectFolder.generatedDate, editedProposal.projectTimeline);
        onUpdateProject({ 
            ...projectFolder, 
            proposal: editedProposal,
            startDate,
            endDate,
            phases,
        });
        addToast('Manual edits saved successfully.', 'success');
    }
  };

  const handleInviteSent = () => {
    setTeamRefreshTrigger(prev => prev + 1);
    addToast('Invitation sent successfully!', 'success');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isResponding) return;

    const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: userInput }] };
    const currentHistory = projectFolder.chatHistory || [];
    const updatedHistory = [...currentHistory, newUserMessage];

    // Optimistically update UI
    onUpdateProject({ ...projectFolder, chatHistory: updatedHistory });
    const originalHistory = projectFolder.chatHistory;
    setUserInput('');
    setIsResponding(true);

    try {
      const team = profileData.teams.find(t => t.id === projectFolder.teamId);
      const profileContext = team ? {
          capabilitiesStatement: team.capabilitiesStatement.map(d => d.content).join('\n\n---\n\n'),
          resume: team.resume.map(d => d.content).join('\n\n---\n\n'),
      } : undefined;

      const updatedProposalResponse = await continueChatInProposal(
        editedProposal, // Send the currently edited version
        currentHistory,
        userInput,
        profileContext
      );
      
      const modelResponse: ChatMessage = {
        role: 'model',
        parts: [{ text: "I've updated the proposal based on your request. Please review the changes." }],
      };
      
      const finalHistory = [...updatedHistory, modelResponse];
      
      // Re-calculate dates and phases if the timeline has changed.
      const { startDate, endDate, phases } = calculateProjectDatesAndPhases(projectFolder.generatedDate, updatedProposalResponse.projectTimeline);

      // Update the local edited state and the project folder in context
      setEditedProposal(updatedProposalResponse);
      onUpdateProject({
        ...projectFolder,
        proposal: updatedProposalResponse,
        chatHistory: finalHistory,
        startDate,
        endDate,
        phases,
      });

    } catch (err: any) {
      addToast(`Co-pilot error: ${err.message}`, 'error');
      // Revert history on error
      onUpdateProject({ ...projectFolder, chatHistory: originalHistory });
    } finally {
      setIsResponding(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="copilot-title">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 gap-3 sm:gap-0 border-b border-slate-200 bg-[#19224C] rounded-t-lg flex-shrink-0">
          <div>
            <h2 id="copilot-title" className="text-xl sm:text-2xl font-bold text-white flex items-center"><ChatBubbleLeftRightIcon className="w-7 h-7 mr-2" />Proposal Co-pilot</h2>
             <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-slate-300">{proposal.projectName}</p>
              </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 self-end sm:self-auto flex-wrap">
            <div className="flex items-center space-x-2" role="tablist" aria-label="Asset views">
                <button role="tab" aria-selected={activeTab === 'proposal'} onClick={() => setActiveTab('proposal')} className={`px-3 py-2 text-sm font-semibold border-b-2 ${activeTab === 'proposal' ? 'border-white text-white' : 'border-transparent text-slate-300 hover:text-white hover:border-slate-400'}`} title="View Proposal">Proposal</button>
                <button role="tab" aria-selected={activeTab === 'team'} onClick={() => setActiveTab('team')} className={`px-3 py-2 text-sm font-semibold border-b-2 ${activeTab === 'team' ? 'border-white text-white' : 'border-transparent text-slate-300 hover:text-white hover:border-slate-400'}`} title="View Team Members">Team</button>
                <button role="tab" aria-selected="false" onClick={() => onViewScorecard(projectFolder)} disabled={!hasScorecard} className="px-3 py-2 text-sm font-semibold border-b-2 border-transparent text-slate-300 hover:text-white hover:border-slate-400 disabled:text-slate-500 disabled:cursor-not-allowed" title={hasScorecard ? 'View Scorecard' : 'Generate Scorecard first'}>Scorecard</button>
                <button role="tab" aria-selected="false" onClick={() => onViewSlideshow(projectFolder)} disabled={!hasSlideshow} className="px-3 py-2 text-sm font-semibold border-b-2 border-transparent text-slate-300 hover:text-white hover:border-slate-400 disabled:text-slate-500 disabled:cursor-not-allowed" title={hasSlideshow ? 'View Presentation' : 'Generate Presentation first'}>Slides</button>
            </div>
            
            <div className="border-l border-slate-600 h-6 mx-1 hidden sm:block"></div>
            
            <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                title={isChatOpen ? "Hide Co-pilot Chat" : "Show Co-pilot Chat"}
                aria-label={isChatOpen ? "Hide Co-pilot Chat" : "Show Co-pilot Chat"}
                className="p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors"
            >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
            </button>
             <button
                onClick={handleSaveChanges}
                disabled={!isProposalEdited}
                title="Save manual changes to this proposal"
                className="p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <SaveIcon className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Save Edits</span>
            </button>
             <button
                onClick={() => onRegenerateProposal(projectFolder)}
                disabled={isRegeneratingProposal || isDownloadingPdf}
                title="Regenerate Proposal"
                aria-label="Regenerate Proposal"
                className="p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <RefreshIcon className={`w-5 h-5 ${isRegeneratingProposal ? 'animate-spin' : ''}`} />
            </button>
             <button
                onClick={handleDownloadWithTracking}
                disabled={isDownloadingPdf || isRegeneratingProposal}
                title="Download as PDF"
                aria-label="Download as PDF"
                className="p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
             <button onClick={() => onEmail(projectFolder)} title="Email Proposal" aria-label="Email Proposal" className="p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors">
                <EmailIcon className="w-5 h-5" />
            </button>
            <button onClick={onClose} title="Close" aria-label="Close" className="p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex-grow flex flex-col lg:flex-row min-h-0 overflow-hidden">
            <div className={`w-full ${isChatOpen ? 'lg:w-3/5' : 'lg:w-full'} overflow-y-auto border-b lg:border-b-0 ${isChatOpen ? 'lg:border-r' : ''} border-slate-200 p-6 transition-all duration-300 ease-in-out`}>
                {activeTab === 'proposal' ? (
                    <ProposalContent 
                        projectFolder={projectFolder} 
                        editedProposal={editedProposal} 
                        onViewRfp={onViewRfp}
                        onContentChange={handleContentChange}
                        onTeach={handleTeachAI}
                    />
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Team Collaboration</h3>
                            <p className="text-slate-600 mb-6">Invite team members to collaborate on this proposal.</p>
                        </div>
                        {isSyncing ? (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-center py-8">
                                    <svg
                                        className="animate-spin h-8 w-8 text-red-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    <span className="ml-3 text-gray-600">Syncing proposal...</span>
                                </div>
                            </div>
                        ) : (
                            <TeamMembersList
                                proposalId={syncedProposalId || projectFolder.id}
                                isOwner={true}
                                onInviteClick={() => setIsInviteModalOpen(true)}
                                refreshTrigger={teamRefreshTrigger}
                            />
                        )}
                    </div>
                )}
            </div>

            <div className={`w-full lg:w-2/5 flex-col bg-slate-50 ${isChatOpen ? 'flex' : 'hidden'}`}>
                <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                    <div className="flex items-start space-x-2">
                        <div className="p-2 bg-red-100 rounded-full flex-shrink-0"><ChatBubbleLeftRightIcon className="w-5 h-5 text-red-600" /></div>
                        <div className="bg-slate-200 text-slate-800 p-3 rounded-lg max-w-xs text-sm">
                            <p>I'm your AI co-pilot. How can I refine this proposal for you? Try requests like "Make the tone more formal" or "Add a section on data security."</p>
                        </div>
                    </div>
                    {(projectFolder.chatHistory || []).map((msg, index) => (
                        <div key={index} className={`flex items-start space-x-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="p-2 bg-red-100 rounded-full flex-shrink-0"><ChatBubbleLeftRightIcon className="w-5 h-5 text-red-600" /></div>}
                            <div className={`p-3 rounded-lg max-w-xs text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                <p>{msg.parts[0].text}</p>
                            </div>
                        </div>
                    ))}
                    {isResponding && (
                        <div className="flex items-start space-x-2">
                             <div className="p-2 bg-red-100 rounded-full flex-shrink-0"><ChatBubbleLeftRightIcon className="w-5 h-5 text-red-600" /></div>
                             <div className="bg-slate-200 text-slate-800 p-3 rounded-lg max-w-xs text-sm">
                                <div className="flex items-center space-x-2" aria-live="polite">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white">
                    <div className="relative">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={isResponding}
                            placeholder="Your request..."
                            aria-label="Chat with Co-pilot"
                            className="w-full px-4 py-2 pr-12 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-red-500 disabled:bg-slate-100"
                        />
                        <button type="submit" disabled={!userInput.trim() || isResponding} className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-10 text-red-600 disabled:text-slate-400" aria-label="Send message">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                           </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
      <InviteTeamMemberModal
        proposalId={syncedProposalId || projectFolder.id}
        proposalTitle={proposal.projectName}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteSent={handleInviteSent}
      />
    </div>
  );
};

export default ProposalCoPilotModal;