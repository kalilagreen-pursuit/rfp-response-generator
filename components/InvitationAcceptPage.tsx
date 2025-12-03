import React, { useEffect, useState } from 'react';
import { teamAPI, getAuthToken } from '../services/api';
import { useAppContext } from '../contexts/AppContext';

interface InvitationDetails {
  id: string;
  proposalId: string;
  proposalTitle: string;
  memberEmail: string;
  role: string;
  rateRange?: { min: number; max: number };
  invitedAt: string;
  inviterCompany: string;
}

interface InvitationAcceptPageProps {
  onNavigate?: (view: string) => void;
}

const InvitationAcceptPage: React.FC<InvitationAcceptPageProps> = ({ onNavigate }) => {
  const { addToast } = useAppContext();
  
  // Get token from URL query params
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Parse token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    setToken(urlToken);
  }, []);
  
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    setIsAuthenticated(!!getAuthToken());
    
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setIsLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await teamAPI.getInvitationByToken(token);

      if (response.error) {
        setError(response.message || 'Failed to load invitation');
      } else if (response.invitation) {
        setInvitation(response.invitation);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation || !token) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store token in localStorage for after login
      if (token) {
        localStorage.setItem('pendingInvitationToken', token);
      }
      addToast('Please log in to accept the invitation', 'info');
      // The AuthScreen will handle login, then we can redirect back
      if (onNavigate) {
        onNavigate('login');
      }
      return;
    }

    setIsProcessing(true);

    try {
      const response = await teamAPI.acceptInvitation(invitation.id, token);

      if (response.error) {
        addToast(response.message || 'Failed to accept invitation', 'error');
      } else {
        addToast('Invitation accepted successfully!', 'success');
        // Navigate to projects view or clear URL
        if (onNavigate) {
          setTimeout(() => {
            window.history.replaceState({}, '', '/');
            onNavigate('projects');
          }, 1500);
        } else {
          // If no navigate function, just clear URL
          setTimeout(() => {
            window.history.replaceState({}, '', '/');
            window.location.reload();
          }, 1500);
        }
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to accept invitation', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;

    if (!window.confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      addToast('Please log in to decline the invitation', 'info');
      if (token) {
        localStorage.setItem('pendingInvitationToken', token);
      }
      if (onNavigate) {
        onNavigate('login');
      }
      return;
    }

    setIsProcessing(true);

    try {
      const response = await teamAPI.declineInvitation(invitation.id);

      if (response.error) {
        addToast(response.message || 'Failed to decline invitation', 'error');
      } else {
        addToast('Invitation declined', 'info');
        if (onNavigate) {
          setTimeout(() => {
            window.history.replaceState({}, '', '/');
            onNavigate('dashboard');
          }, 1500);
        } else {
          setTimeout(() => {
            window.history.replaceState({}, '', '/');
            window.location.reload();
          }, 1500);
        }
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to decline invitation', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-12 w-12 text-red-600 mb-4"
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
            <p className="text-gray-600">Loading invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This invitation link is invalid or has expired.'}</p>
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Invited!</h1>
          <p className="text-gray-600">
            {invitation.inviterCompany} has invited you to collaborate on a proposal
          </p>
        </div>

        {/* Invitation Details */}
        <div className="bg-slate-50 rounded-lg p-6 mb-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Proposal</label>
            <p className="text-lg font-semibold text-gray-900 mt-1">{invitation.proposalTitle}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Role</label>
            <p className="text-gray-900 mt-1">{invitation.role}</p>
          </div>

          {invitation.rateRange && (
            <div>
              <label className="text-sm font-medium text-gray-500">Rate Range</label>
              <p className="text-gray-900 mt-1">
                ${invitation.rateRange.min} - ${invitation.rateRange.max}/hr
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-500">Invited On</label>
            <p className="text-gray-900 mt-1">{formatDate(invitation.invitedAt)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900 mt-1">{invitation.memberEmail}</p>
          </div>
        </div>

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg
                className="h-5 w-5 text-amber-600 mr-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <p className="text-sm text-amber-800">
                You'll need to log in to accept or decline this invitation.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
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
            className="flex-1 px-6 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Accept Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitationAcceptPage;

