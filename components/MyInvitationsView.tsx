import React, { useEffect, useState } from 'react';
import { teamAPI, networkAPI } from '../services/api';

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

interface ConnectionRequest {
  id: string;
  requester_id: string;
  requester_profile_id: string;
  recipient_profile_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  requested_at: string;
  responded_at?: string;
  requester_profile?: {
    id: string;
    company_name: string;
    industry?: string;
    contact_info?: any;
  };
  recipient_profile?: {
    id: string;
    company_name: string;
    industry?: string;
    contact_info?: any;
  };
}

const MyInvitationsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'connections'>('proposals');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [sentConnectionRequests, setSentConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingConnectionId, setProcessingConnectionId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'proposals') {
      loadInvitations();
    } else {
      loadConnectionRequests();
    }
  }, [activeTab]);

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

  const loadConnectionRequests = async () => {
    setIsLoadingConnections(true);
    setError('');

    try {
      const response = await networkAPI.getMyConnectionRequests();

      if (response.error) {
        setError(response.message || 'Failed to load connection requests');
      } else {
        // Debug logging
        console.log('Connection requests response:', response);
        
        // Handle both old format (connectionRequests) and new format (receivedRequests/sentRequests)
        if (response.connectionRequests) {
          // Old format - only received requests
          console.log('Using old format - connectionRequests');
          setConnectionRequests(response.connectionRequests || []);
          setSentConnectionRequests([]);
        } else if (response.receivedRequests !== undefined || response.sentRequests !== undefined) {
          // New format - both received and sent
          console.log('Using new format - receivedRequests/sentRequests');
          setConnectionRequests(response.receivedRequests || []);
          setSentConnectionRequests(response.sentRequests || []);
          console.log('Received requests count:', (response.receivedRequests || []).length);
          console.log('Sent requests count:', (response.sentRequests || []).length);
        } else {
          // Fallback - empty arrays
          console.warn('Unexpected response format:', response);
          setConnectionRequests([]);
          setSentConnectionRequests([]);
        }
      }
    } catch (err: any) {
      console.error('Error loading connection requests:', err);
      setError(err.message || 'Failed to load connection requests');
    } finally {
      setIsLoadingConnections(false);
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

  const handleAcceptConnection = async (requestId: string) => {
    setProcessingConnectionId(requestId);

    try {
      const response = await networkAPI.acceptConnectionRequest(requestId);

      if (response.error) {
        alert(response.message || 'Failed to accept connection request');
      } else {
        // Refresh the list
        await loadConnectionRequests();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept connection request');
    } finally {
      setProcessingConnectionId(null);
    }
  };

  const handleDeclineConnection = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to decline this connection request?')) {
      return;
    }

    setProcessingConnectionId(requestId);

    try {
      const response = await networkAPI.declineConnectionRequest(requestId);

      if (response.error) {
        alert(response.message || 'Failed to decline connection request');
      } else {
        // Refresh the list
        await loadConnectionRequests();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to decline connection request');
    } finally {
      setProcessingConnectionId(null);
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
  const pendingConnectionRequests = connectionRequests.filter((req) => req.status === 'pending');
  const respondedConnectionRequests = connectionRequests.filter((req) => req.status !== 'pending');
  const pendingSentRequests = sentConnectionRequests.filter((req) => req.status === 'pending');
  const respondedSentRequests = sentConnectionRequests.filter((req) => req.status !== 'pending');

  const isLoadingCurrentTab = activeTab === 'proposals' ? isLoading : isLoadingConnections;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Invitations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your proposal collaboration invitations and connection requests
        </p>
      </div>

      {/* Tabs - Always visible */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('proposals')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'proposals'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Proposal Invitations
            {pendingInvitations.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {pendingInvitations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'connections'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Connection Requests
            {(pendingConnectionRequests.length > 0 || pendingSentRequests.length > 0) && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {pendingConnectionRequests.length + pendingSentRequests.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => {
                if (activeTab === 'proposals') {
                  loadInvitations();
                } else {
                  loadConnectionRequests();
                }
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Proposal Invitations Tab */}
      {activeTab === 'proposals' && (
        <>
          {isLoading && invitations.length === 0 ? (
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
          ) : (
            <>
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
            </>
          )}
        </>
      )}

      {/* Connection Requests Tab */}
      {activeTab === 'connections' && (
        <>
          {isLoadingConnections && connectionRequests.length === 0 && sentConnectionRequests.length === 0 ? (
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
          ) : (
            <>
              {/* Pending Connection Requests */}
              {pendingConnectionRequests.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Pending Connection Requests ({pendingConnectionRequests.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {pendingConnectionRequests.map((request) => (
                      <div
                        key={request.id}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            <h3 className="text-base font-semibold text-gray-900 mb-1">
                              {request.requester_profile?.company_name || 'Unknown Company'}
                            </h3>
                            {request.requester_profile?.industry && (
                              <p className="text-sm text-gray-600 mb-2">
                                Industry: {request.requester_profile.industry}
                              </p>
                            )}
                            {request.message && (
                              <p className="text-sm text-gray-600 mb-2 italic">
                                "{request.message}"
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Requested {formatDate(request.requested_at)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleAcceptConnection(request.id)}
                              disabled={processingConnectionId === request.id}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingConnectionId === request.id ? 'Processing...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => handleDeclineConnection(request.id)}
                              disabled={processingConnectionId === request.id}
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

              {/* Responded Connection Requests */}
              {respondedConnectionRequests.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Past Responses ({respondedConnectionRequests.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {respondedConnectionRequests.map((request) => (
                      <div
                        key={request.id}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium text-gray-900 mb-1">
                              {request.requester_profile?.company_name || 'Unknown Company'}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                              {getStatusBadge(request.status)}
                              <span className="text-xs text-gray-500">
                                Requested {formatDate(request.requested_at)}
                              </span>
                              {request.responded_at && (
                                <span className="text-xs text-gray-500">
                                  • Responded {formatDate(request.responded_at)}
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

              {/* Sent Connection Requests */}
              {sentConnectionRequests.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm mt-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Sent Connection Requests ({sentConnectionRequests.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {sentConnectionRequests.map((request) => (
                      <div
                        key={request.id}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium text-gray-900 mb-1">
                              {request.recipient_profile?.company_name || 'Unknown Company'}
                            </h3>
                            {request.recipient_profile?.industry && (
                              <p className="text-sm text-gray-600 mb-2">
                                Industry: {request.recipient_profile.industry}
                              </p>
                            )}
                            {request.message && (
                              <p className="text-sm text-gray-600 mb-2 italic">
                                "{request.message}"
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {getStatusBadge(request.status)}
                              <span className="text-xs text-gray-500">
                                Sent {formatDate(request.requested_at)}
                              </span>
                              {request.responded_at && (
                                <span className="text-xs text-gray-500">
                                  • Responded {formatDate(request.responded_at)}
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
              {connectionRequests.length === 0 && sentConnectionRequests.length === 0 && (
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
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <h3 className="mt-4 text-sm font-medium text-gray-900">No connection requests</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    You haven't sent or received any connection requests yet.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MyInvitationsView;
