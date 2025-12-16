import React, { useState, useEffect } from 'react';
import { profileAPI, networkAPI } from '../services/api';
import { CloseIcon, UsersIcon, PhoneIcon, EmailIcon, CodeIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';

interface ProfileDetailModalProps {
  profileId: string;
  onClose: () => void;
  onInviteToProposal?: (company: { email?: string; companyName: string; profileId: string }) => void;
}

interface FullProfile {
  id: string;
  company_name: string;
  industry?: string;
  website?: string;
  capabilities?: string[];
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
    location?: string;
    linkedin?: string;
    twitter?: string;
    dribbble?: string;
    teams?: Array<{
      name: string;
      role: string;
      bio: string;
    }>;
    industryPlaybooks?: Record<string, string>;
  };
  profile_strength: number;
  visibility: string;
  created_at: string;
}

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({ profileId, onClose, onInviteToProposal }) => {
  const { addToast } = useAppContext();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await profileAPI.getById(profileId);

      if (response.error) {
        setError(response.message || 'Failed to load profile');
      } else {
        setProfile(response.profile);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendConnectionRequest = async () => {
    if (!profile) return;

    setIsConnecting(true);
    setError('');

    try {
      console.log('Sending connection request to profile:', profile.id);
      const response = await networkAPI.sendConnectionRequest({
        recipientProfileId: profile.id,
        message: `Connection request from marketplace profile`
      });

      console.log('Connection request response:', response);

      if (response.error) {
        console.error('Connection request error:', response);
        if (response.error === 'Connection exists' || response.error === 'Request already exists') {
          setError('You have already sent a connection request to this company');
        } else if (response.error === 'Invalid request') {
          setError('You cannot send a connection request to yourself');
        } else if (response.error === 'Not found') {
          setError('The connection request endpoint is not available. Please check if the backend has been deployed.');
        } else {
          setError(response.message || response.error || 'Failed to send connection request');
        }
      } else {
        setConnectionSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Connection request exception:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      setError(err.message || 'Failed to send connection request. Check console for details.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Company Profile</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
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
              <span className="ml-3 text-gray-600">Loading profile...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadProfile}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {profile && !isLoading && !error && (
            <div className="space-y-6">
              {/* Company Header */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {profile.company_name}
                    </h3>
                    {profile.industry && (
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <UsersIcon className="w-4 h-4 mr-2" />
                        {profile.industry}
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Profile Strength: {profile.profile_strength}%
                  </span>
                </div>

                {/* Website */}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    🌐 {profile.website}
                  </a>
                )}
              </div>

              {/* Contact Information */}
              {profile.contact_info && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.contact_info.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <EmailIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <a href={`mailto:${profile.contact_info.email}`} className="hover:text-red-600">
                          {profile.contact_info.email}
                        </a>
                      </div>
                    )}
                    {profile.contact_info.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                        {profile.contact_info.phone}
                      </div>
                    )}
                    {profile.contact_info.address && (
                      <div className="flex items-center text-sm text-gray-600 col-span-2">
                        <UsersIcon className="w-4 h-4 mr-2 text-gray-400" />
                        {profile.contact_info.address}
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {(profile.contact_info.linkedin || profile.contact_info.twitter || profile.contact_info.dribbble) && (
                    <div className="mt-4 flex gap-3">
                      {profile.contact_info.linkedin && (
                        <a
                          href={profile.contact_info.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          LinkedIn
                        </a>
                      )}
                      {profile.contact_info.twitter && (
                        <a
                          href={`https://twitter.com/${profile.contact_info.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-500"
                        >
                          Twitter
                        </a>
                      )}
                      {profile.contact_info.dribbble && (
                        <a
                          href={profile.contact_info.dribbble}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-pink-600 hover:text-pink-700"
                        >
                          Dribbble
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Capabilities */}
              {profile.capabilities && profile.capabilities.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.capabilities.map((capability, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-slate-100 text-slate-700"
                      >
                        <CodeIcon className="w-4 h-4 mr-1.5" />
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Members */}
              {profile.contact_info?.teams && profile.contact_info.teams.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Team</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.contact_info.teams.map((member, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900">{member.name}</h5>
                        <p className="text-sm text-red-600 mb-2">{member.role}</p>
                        <p className="text-sm text-gray-600">{member.bio}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Industry Playbooks */}
              {profile.contact_info?.industryPlaybooks && Object.keys(profile.contact_info.industryPlaybooks).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Industry Expertise</h4>
                  <div className="space-y-3">
                    {Object.entries(profile.contact_info.industryPlaybooks).map(([industry, description], idx) => (
                      <div key={idx} className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 capitalize mb-1">{industry}</h5>
                        <p className="text-sm text-gray-600">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          {profile && (
            <>
              {onInviteToProposal && (
                <button
                  onClick={() => {
                    if (!profile.contact_info?.email) {
                      addToast('This company does not have an email address on file', 'error');
                      return;
                    }
                    onInviteToProposal({
                      email: profile.contact_info.email,
                      companyName: profile.company_name,
                      profileId: profile.id,
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Invite to Proposal
                </button>
              )}
              <button
                onClick={handleSendConnectionRequest}
                disabled={isConnecting || connectionSuccess}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  connectionSuccess
                    ? 'bg-green-600'
                    : isConnecting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {connectionSuccess
                  ? '✓ Connection Request Sent!'
                  : isConnecting
                  ? 'Sending...'
                  : 'Send Connection Request'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailModal;
