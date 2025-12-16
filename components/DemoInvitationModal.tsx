import React, { useEffect, useState } from 'react';
import { proposalsAPI } from '../services/api';
import { useAppContext } from '../contexts/AppContext';

interface DemoInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: {
    id: string;
    proposalId: string;
    proposalTitle: string;
    inviterCompany: string;
    memberEmail: string;
    role: string;
    rateRange?: { min: number; max: number };
    invitedAt: string;
  };
}

interface ProposalDetails {
  executiveSummary?: string;
  technicalApproach?: string;
  projectTimeline?: string;
  resources?: Array<{
    role: string;
    hours: number;
    lowRate: number;
    highRate: number;
    description?: string;
  }>;
  investmentEstimate?: {
    low: number;
    high: number;
  };
}

const DemoInvitationModal: React.FC<DemoInvitationModalProps> = ({
  isOpen,
  onClose,
  invitation,
}) => {
  const { addToast } = useAppContext();
  const [proposalDetails, setProposalDetails] = useState<ProposalDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && invitation.proposalId) {
      loadProposalDetails();
    }
  }, [isOpen, invitation.proposalId]);

  const loadProposalDetails = async () => {
    setIsLoading(true);
    try {
      const response = await proposalsAPI.get(invitation.proposalId);
      if (response.proposal && response.proposal.content) {
        const content = response.proposal.content.proposal || response.proposal.content;
        setProposalDetails({
          executiveSummary: content.executiveSummary,
          technicalApproach: content.technicalApproach,
          projectTimeline: content.projectTimeline,
          resources: content.resources,
          investmentEstimate: content.investmentEstimate,
        });
      }
    } catch (error) {
      console.error('Failed to load proposal details:', error);
      addToast('Failed to load proposal details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeline = (timeline?: string): { start: string; end: string } | null => {
    if (!timeline) return null;
    
    // Try to extract dates from timeline string
    // Format: "Phase 1: Discovery (2-3 weeks)\nPhase 2: Development (8-10 weeks)"
    const phases = timeline.split('\n').filter(p => p.trim());
    if (phases.length === 0) return null;

    // For demo, assume January to March 2025
    return {
      start: 'January 2025',
      end: 'March 2025',
    };
  };

  const getDeliverablesForRole = (role: string): string[] => {
    // Generate role-specific deliverables based on the role
    const roleLower = role.toLowerCase();
    
    if (roleLower.includes('compliance')) {
      return [
        'Compliance documentation review and validation',
        'Regulatory requirement analysis and mapping',
        'Audit preparation materials and checklists',
        'Compliance gap analysis report',
        'Final compliance certification documentation',
      ];
    } else if (roleLower.includes('developer') || roleLower.includes('engineer')) {
      return [
        'Technical architecture documentation',
        'Code implementation and unit tests',
        'API integration and testing',
        'Performance optimization and monitoring',
        'Technical documentation and deployment guides',
      ];
    } else if (roleLower.includes('manager') || roleLower.includes('pm')) {
      return [
        'Project plan and timeline documentation',
        'Weekly status reports and updates',
        'Stakeholder communication and coordination',
        'Risk management and mitigation plans',
        'Final project delivery and handoff documentation',
      ];
    } else if (roleLower.includes('designer') || roleLower.includes('ux')) {
      return [
        'User research and persona development',
        'Wireframes and interactive prototypes',
        'Design system and component library',
        'Usability testing and feedback reports',
        'Final design assets and specifications',
      ];
    } else {
      return [
        'Role-specific deliverables and documentation',
        'Progress reports and status updates',
        'Quality assurance and testing',
        'Final deliverables and handoff materials',
      ];
    }
  };

  const handleViewFullProject = () => {
    // In a real scenario, this would navigate to the full proposal
    addToast('Opening full project proposal...', 'info');
    // Could navigate to proposal view here
  };

  const handleAccept = () => {
    setIsProcessing(true);
    // Simulate acceptance
    setTimeout(() => {
      addToast('Invitation accepted! (Demo mode)', 'success');
      setIsProcessing(false);
      onClose();
    }, 1000);
  };

  const handleDecline = () => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) {
      return;
    }
    setIsProcessing(true);
    // Simulate decline
    setTimeout(() => {
      addToast('Invitation declined. (Demo mode)', 'info');
      setIsProcessing(false);
      onClose();
    }, 1000);
  };

  const handleRequestChanges = () => {
    addToast('Request Changes feature coming soon', 'info');
  };

  const timeline = formatTimeline(proposalDetails?.projectTimeline);
  const deliverables = getDeliverablesForRole(invitation.role);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Team Invitation</h2>
              <p className="text-sm text-gray-500 mt-1">
                What {invitation.memberEmail} sees when they receive this invitation
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isProcessing}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
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
            </div>
          ) : (
            <div className="space-y-6">
              {/* Project Header */}
              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {invitation.proposalTitle}
                    </h3>
                    <p className="text-lg text-gray-700">
                      Invited by <span className="font-semibold">{invitation.inviterCompany}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
                      New Invitation
                    </div>
                  </div>
                </div>
              </div>

              {/* Role & Rate Section */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Role</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{invitation.role}</p>
                  </div>
                  {invitation.rateRange && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Rate Range</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        ${invitation.rateRange.min} - ${invitation.rateRange.max}/hour
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Section */}
              {timeline && (
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{timeline.start}</p>
                    </div>
                    <div className="text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{timeline.end}</p>
                    </div>
                  </div>
                  {proposalDetails?.projectTimeline && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <label className="text-sm font-medium text-gray-500">Project Phases</label>
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                        {proposalDetails.projectTimeline}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Project Scope */}
              {proposalDetails?.executiveSummary && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h4>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {proposalDetails.executiveSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Technical Approach */}
              {proposalDetails?.technicalApproach && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Technical Approach</h4>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {proposalDetails.technicalApproach}
                    </p>
                  </div>
                </div>
              )}

              {/* Deliverables */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Deliverables</h4>
                <ul className="space-y-2">
                  {deliverables.map((deliverable, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleViewFullProject}
                    className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    View Full Project
                  </button>
                  <button
                    onClick={handleRequestChanges}
                    className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Decline'}
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Accept Role'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoInvitationModal;

