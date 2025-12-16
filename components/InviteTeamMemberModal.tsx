import React, { useState } from 'react';
import { teamAPI } from '../services/api';

interface InviteTeamMemberModalProps {
  proposalId: string;
  proposalTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onInviteSent: () => void;
  selectedCompany?: {
    email?: string;
    companyName?: string;
    profileId?: string;
  };
}

const InviteTeamMemberModal: React.FC<InviteTeamMemberModalProps> = ({
  proposalId,
  proposalTitle,
  isOpen,
  onClose,
  onInviteSent,
  selectedCompany,
}) => {
  const [email, setEmail] = useState(selectedCompany?.email || '');
  const [role, setRole] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Update email when selectedCompany changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (selectedCompany?.email) {
        setEmail(selectedCompany.email);
      } else if (!selectedCompany) {
        setEmail('');
      }
    }
  }, [selectedCompany, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !role) {
      setError('Email and role are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (minRate && maxRate && parseFloat(minRate) > parseFloat(maxRate)) {
      setError('Minimum rate cannot be greater than maximum rate');
      return;
    }

    setIsLoading(true);

    try {
      const inviteData: any = {
        proposalId,
        memberEmail: email,
        role,
      };

      if (minRate && maxRate) {
        inviteData.rateRange = {
          min: parseFloat(minRate),
          max: parseFloat(maxRate),
        };
      }

      if (message) {
        inviteData.message = message;
      }

      const response = await teamAPI.invite(inviteData);

      if (response.error) {
        setError(response.message || response.error || 'Failed to send invitation');
      } else {
        // Success!
        resetForm();
        onInviteSent();
        onClose();
      }
    } catch (err: any) {
      console.error('Invitation error:', err);
      // Try to extract error message from various possible formats
      const errorMessage = err?.response?.data?.message || 
                          err?.message || 
                          err?.error?.message ||
                          'Failed to send invitation. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    // Reset to selectedCompany email if available, otherwise empty
    setEmail(selectedCompany?.email || '');
    setRole('');
    setMinRate('');
    setMaxRate('');
    setMessage('');
    setError('');
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Invite Team Member
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
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
          <p className="text-sm text-gray-500 mt-1">
            Invite someone to collaborate on: <span className="font-medium">{proposalTitle}</span>
          </p>
          {selectedCompany?.companyName && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Inviting from Marketplace: <strong>{selectedCompany.companyName}</strong></span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="colleague@example.com"
              required
              disabled={isLoading}
            />
          </div>

          {/* Role */}
          <div className="mb-4">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Senior Developer, Project Manager"
              required
              disabled={isLoading}
            />
          </div>

          {/* Rate Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate Range (Optional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Min ($/hr)"
                  min="0"
                  step="1"
                  disabled={isLoading}
                />
              </div>
              <div>
                <input
                  type="number"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Max ($/hr)"
                  min="0"
                  step="1"
                  disabled={isLoading}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Expected hourly rate range for this role
            </p>
          </div>

          {/* Message */}
          <div className="mb-4">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Personal Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Add a personal message to your invitation..."
              disabled={isLoading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
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
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteTeamMemberModal;
