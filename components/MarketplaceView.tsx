import React, { useState, useEffect } from 'react';
import { profileAPI, proposalsAPI, teamAPI } from '../services/api';
import { UsersIcon, SearchIcon, CodeIcon } from './icons';
import ProfileDetailModal from './ProfileDetailModal';
import ProposalSelectorModal from './ProposalSelectorModal';
import { useAppContext } from '../contexts/AppContext';

interface MarketplaceProfile {
  id: string;
  company_name: string;
  industry?: string;
  contact_info?: {
    location?: string;
    capabilities?: string[];
    website?: string;
    phone?: string;
    email?: string;
  };
  profile_strength: number;
  created_at: string;
}

const MarketplaceView: React.FC = () => {
  const [profiles, setProfiles] = useState<MarketplaceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isProposalSelectorOpen, setIsProposalSelectorOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<{
    email?: string;
    companyName: string;
    profileId: string;
  } | null>(null);
  const { addToast } = useAppContext();

  useEffect(() => {
    loadProfiles();
  }, [searchTerm, industryFilter]);

  const loadProfiles = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (industryFilter) params.industry = industryFilter;

      const response = await profileAPI.getMarketplace(params);

      if (response.error) {
        setError(response.message || 'Failed to load marketplace profiles');
      } else {
        setProfiles(response.profiles || []);
        // Extract unique industries
        const industries = [...new Set((response.profiles || []).map((p: MarketplaceProfile) => p.industry).filter(Boolean))] as string[];
        setAvailableIndustries(industries);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load marketplace profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const getProfileStrengthColor = (strength: number) => {
    if (strength >= 80) return 'bg-green-100 text-green-800';
    if (strength >= 60) return 'bg-blue-100 text-blue-800';
    if (strength >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getProfileStrengthLabel = (strength: number) => {
    if (strength >= 80) return 'Excellent';
    if (strength >= 60) return 'Good';
    if (strength >= 40) return 'Fair';
    return 'Basic';
  };

  const handleInviteClick = (profile: MarketplaceProfile) => {
    if (!profile.contact_info?.email) {
      addToast('This company does not have an email address on file', 'error');
      return;
    }

    setSelectedCompany({
      companyName: profile.company_name,
      profileId: profile.id,
      email: profile.contact_info.email,
    });
    setIsProposalSelectorOpen(true);
  };

  const handleProposalSelected = async (proposalId: string, proposalTitle: string) => {
    if (!selectedCompany?.email) {
      addToast('Company email is missing', 'error');
      return;
    }

    setIsProposalSelectorOpen(false);

    try {
      // Send invitation with default values
      const inviteData = {
        proposalId,
        memberEmail: selectedCompany.email,
        role: 'Team Member', // Default role
        rateRange: {
          min: 100,
          max: 150,
        },
        message: `Hi ${selectedCompany.companyName}, I'd like to invite you to collaborate on "${proposalTitle}". Looking forward to working together!`,
      };

      const response = await teamAPI.invite(inviteData);

      if (response.error) {
        addToast(response.message || 'Failed to send invitation', 'error');
      } else {
        addToast(`Invitation sent to ${selectedCompany.companyName} for "${proposalTitle}"`, 'success');
      }
    } catch (err: any) {
      console.error('Invite error:', err);
      addToast(err.message || 'Failed to send invitation', 'error');
    } finally {
      setSelectedCompany(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Marketplace</h2>
        <p className="text-slate-500">Discover and connect with other companies for collaboration</p>
      </header>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
              placeholder="Search companies..."
            />
          </div>

          {/* Industry Filter */}
          <div>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">All Industries</option>
              {availableIndustries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm p-12">
          <div className="flex items-center justify-center">
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
            <span className="ml-3 text-gray-600">Loading marketplace...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadProfiles}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Profiles Grid */}
      {!isLoading && !error && (
        <>
          {profiles.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12">
              <div className="text-center">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">No profiles found</p>
                <p className="text-sm text-gray-400 mt-2">
                  {searchTerm || industryFilter
                    ? 'Try adjusting your search or filters'
                    : 'No public profiles available yet'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-4">
                Found {profiles.length} {profiles.length === 1 ? 'company' : 'companies'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    {/* Company Name & Strength */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {profile.company_name}
                        </h3>
                        {profile.industry && (
                          <div className="flex items-center text-sm text-gray-500">
                            <UsersIcon className="w-4 h-4 mr-1" />
                            {profile.industry}
                          </div>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProfileStrengthColor(
                          profile.profile_strength
                        )}`}
                      >
                        {getProfileStrengthLabel(profile.profile_strength)}
                      </span>
                    </div>

                    {/* Location */}
                    {profile.contact_info?.location && (
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <UsersIcon className="w-4 h-4 mr-1" />
                        {profile.contact_info.location}
                      </div>
                    )}

                    {/* Capabilities */}
                    {profile.contact_info?.capabilities && profile.contact_info.capabilities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Capabilities</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.contact_info.capabilities.slice(0, 5).map((capability, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                            >
                              <CodeIcon className="w-3 h-3 mr-1" />
                              {capability}
                            </span>
                          ))}
                          {profile.contact_info.capabilities.length > 5 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                              +{profile.contact_info.capabilities.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">
                          Profile Strength: {profile.profile_strength}%
                        </div>
                        <button
                          onClick={() => setSelectedProfileId(profile.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          View Profile
                        </button>
                      </div>
                      <button
                        onClick={() => handleInviteClick(profile)}
                        className="w-full mt-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Invite to Proposal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Profile Detail Modal */}
      {selectedProfileId && (
        <ProfileDetailModal
          profileId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
          onInviteToProposal={(company) => {
            setSelectedCompany(company);
            setIsProposalSelectorOpen(true);
          }}
        />
      )}

      {/* Proposal Selector Modal */}
      {selectedCompany && (
        <ProposalSelectorModal
          isOpen={isProposalSelectorOpen}
          onClose={() => {
            setIsProposalSelectorOpen(false);
            setSelectedCompany(null);
          }}
          onSelect={handleProposalSelected}
          companyName={selectedCompany.companyName}
          companyEmail={selectedCompany.email}
        />
      )}
    </div>
  );
};

export default MarketplaceView;

