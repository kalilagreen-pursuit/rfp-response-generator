import React, { useEffect, useState } from 'react';
import { teamAPI, proposalsAPI } from '../services/api';
import DemoInvitationModal from './DemoInvitationModal';

interface TeamMember {
  id: string;
  memberEmail: string;
  role: string;
  rateRange?: { min: number; max: number };
  status: 'invited' | 'accepted' | 'declined';
  invitedAt: string;
  respondedAt?: string;
  company_profiles?: {
    id: string;
    company_name: string;
    contact_info: any;
  };
}

interface TeamMembersListProps {
  proposalId: string;
  proposalTitle?: string;
  inviterCompany?: string;
  isOwner: boolean;
  onInviteClick: () => void;
  refreshTrigger?: number;
}

const TeamMembersList: React.FC<TeamMembersListProps> = ({
  proposalId,
  proposalTitle,
  inviterCompany,
  isOwner,
  onInviteClick,
  refreshTrigger = 0,
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<{
    id: string;
    proposalId: string;
    proposalTitle: string;
    inviterCompany: string;
    memberEmail: string;
    role: string;
    rateRange?: { min: number; max: number };
    invitedAt: string;
  } | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, [proposalId, refreshTrigger]);

  const loadTeamMembers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await teamAPI.getProposalTeam(proposalId);

      if (response.error) {
        setError(response.message || 'Failed to load team members');
      } else {
        setTeamMembers(response.teamMembers || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const response = await teamAPI.removeTeamMember(proposalId, memberId);

      if (response.error) {
        alert(response.message || 'Failed to remove team member');
      } else {
        // Refresh the list
        loadTeamMembers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove team member');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Accepted
          </span>
        );
      case 'invited':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⏳ Pending
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ✗ Declined
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadTeamMembers}
            className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Team Members</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
            </p>
          </div>
          {isOwner && (
            <button
              onClick={onInviteClick}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 4v16m8-8H4"></path>
              </svg>
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Team Members List */}
      <div className="divide-y divide-gray-200">
        {teamMembers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p className="mt-4 text-sm text-gray-500">No team members yet</p>
            {isOwner && (
              <button
                onClick={onInviteClick}
                className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Invite your first team member
              </button>
            )}
          </div>
        ) : (
          teamMembers.map((member) => (
            <div key={member.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Email and Company */}
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.memberEmail}
                    </p>
                    {member.company_profiles?.company_name && (
                      <span className="text-sm text-gray-500">
                        ({member.company_profiles.company_name})
                      </span>
                    )}
                  </div>

                  {/* Role */}
                  <p className="text-sm text-gray-600 mb-2">{member.role}</p>

                  {/* Rate Range */}
                  {member.rateRange && (
                    <p className="text-xs text-gray-500 mb-2">
                      Rate: ${member.rateRange.min} - ${member.rateRange.max}/hr
                    </p>
                  )}

                  {/* Status and Date */}
                  <div className="flex items-center gap-3 mt-2">
                    {getStatusBadge(member.status)}
                    <span className="text-xs text-gray-500">
                      Invited {formatDate(member.invitedAt)}
                    </span>
                    {member.respondedAt && (
                      <span className="text-xs text-gray-500">
                        • Responded {formatDate(member.respondedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons (Owner Only) */}
                {isOwner && (
                  <div className="ml-4 flex gap-2">
                    {member.status === 'invited' && (
                      <button
                        onClick={() => {
                          setSelectedInvitation({
                            id: member.id,
                            proposalId,
                            proposalTitle: proposalTitle || 'Project Proposal',
                            inviterCompany: inviterCompany || 'Your Company',
                            memberEmail: member.memberEmail,
                            role: member.role,
                            rateRange: member.rateRange,
                            invitedAt: member.invitedAt,
                          });
                          setDemoModalOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        title="View as recipient"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove team member"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Demo Invitation Modal */}
      {selectedInvitation && (
        <DemoInvitationModal
          isOpen={demoModalOpen}
          onClose={() => {
            setDemoModalOpen(false);
            setSelectedInvitation(null);
          }}
          invitation={selectedInvitation}
        />
      )}
    </div>
  );
};

export default TeamMembersList;
