import React, { useState, useEffect } from 'react';
import { proposalsAPI } from '../services/api';

interface Proposal {
  id: string;
  title: string;
  status: string;
}

interface ProposalSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (proposalId: string, proposalTitle: string) => void;
  companyName: string;
  companyEmail?: string;
}

const ProposalSelectorModal: React.FC<ProposalSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  companyName,
  companyEmail,
}) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProposals();
    }
  }, [isOpen]);

  const loadProposals = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await proposalsAPI.list();
      if (response.proposals && response.proposals.length > 0) {
        setProposals(response.proposals);
      } else {
        setError('No proposals found. Please create a proposal first.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (proposal: Proposal) => {
    onSelect(proposal.id, proposal.title);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Select Proposal
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
            Choose which proposal to invite <strong>{companyName}</strong> to
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="animate-spin h-6 w-6 text-red-600"
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
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No proposals available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {proposals.map((proposal) => (
                <button
                  key={proposal.id}
                  onClick={() => handleSelect(proposal)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-red-300 transition-colors"
                >
                  <div className="font-medium text-gray-900">{proposal.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Status: {proposal.status}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalSelectorModal;

