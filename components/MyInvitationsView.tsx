import React, { useEffect, useState } from 'react';
import { teamAPI } from '../services/api';

interface Invitation {
  id: string;
  proposal_id: string;
  memberEmail: string;
  role: string;
  rateRange?: { min: number; max: number };
  status: 'invited' | 'accepted' | 'declined';
  invitedAt: string;
  respondedAt?: string;
  proposals: {
    id: string;
    title: string;
    status: string;
    company_profiles?: {
      company_name: string;
    } | null;
  };
}

const MyInvitationsView: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await teamAPI.getMyInvitations();

      if (response.error) {
        setError(response.message || 'Failed to load invitations');
      } else {
        setInvitations(response.invitations || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    setProcessingId(invitationId);

    try {
      const response = await teamAPI.acceptInvitation(invitationId);

      if (response.error) {
        alert(response.message || 'Failed to accept invitation');
      } else {
        // Refresh the list
        await loadInvitations();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    setProcessingId(invitationId);

    try {
      const response = await teamAPI.declineInvitation(invitationId);

      if (response.error) {
        alert(response.message || 'Failed to decline invitation');
      } else {
        // Refresh the list
        await loadInvitations();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to decline invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  const pendingInvitations = invitations.filter((inv) => inv.status === 'invited');
  const respondedInvitations = invitations.filter((inv) => inv.status !== 'invited');

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadInvitations}
              className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Invitations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your proposal collaboration invitations
        </p>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Pending Invitations ({pendingInvitations.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    {/* Proposal Title */}
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {invitation.proposals.title}
                    </h3>

                    {/* Company */}
                    {invitation.proposals.company_profiles?.company_name && (
                      <p className="text-sm text-gray-600 mb-2">
                        From: {invitation.proposals.company_profiles.company_name}
                      </p>
                    )}

                    {/* Role */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Role:</span> {invitation.role}
                      </span>
                    </div>

                    {/* Rate Range */}
                    {invitation.rateRange && (
                      <p className="text-sm text-gray-600 mb-2">
                        Rate: ${invitation.rateRange.min} - ${invitation.rateRange.max}/hr
                      </p>
                    )}

                    {/* Invited Date */}
                    <p className="text-xs text-gray-500">
                      Invited {formatDate(invitation.invitedAt)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleAccept(invitation.id)}
                      disabled={processingId === invitation.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === invitation.id ? 'Processing...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleDecline(invitation.id)}
                      disabled={processingId === invitation.id}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Responded Invitations */}
      {respondedInvitations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Past Responses ({respondedInvitations.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {respondedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Proposal Title */}
                    <h3 className="text-base font-medium text-gray-900 mb-1">
                      {invitation.proposals.title}
                    </h3>

                    {/* Company and Role */}
                    <p className="text-sm text-gray-600 mb-2">
                      {invitation.proposals.company_profiles?.company_name || 'Unknown Company'} • {invitation.role}
                    </p>

                    {/* Status and Dates */}
                    <div className="flex items-center gap-3 mt-2">
                      {getStatusBadge(invitation.status)}
                      <span className="text-xs text-gray-500">
                        Invited {formatDate(invitation.invitedAt)}
                      </span>
                      {invitation.respondedAt && (
                        <span className="text-xs text-gray-500">
                          • Responded {formatDate(invitation.respondedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {invitations.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          <h3 className="mt-4 text-sm font-medium text-gray-900">No invitations</h3>
          <p className="mt-2 text-sm text-gray-500">
            You haven't received any proposal collaboration invitations yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyInvitationsView;
