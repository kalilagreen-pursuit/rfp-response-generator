import React, { useEffect, useState } from 'react';
import type { ProjectFolder, Scorecard } from '../types';
import { CloseIcon, RefreshIcon } from './icons';
import { formatCurrency } from '../utils/formatters';

interface ScorecardModalProps {
  isLoading: boolean;
  scorecard: Scorecard | null;
  projectFolder: ProjectFolder;
  onClose: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onViewProposal: (folder: ProjectFolder) => void;
  onViewSlideshow: (folder: ProjectFolder) => void;
}

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const getScoreColor = () => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-600';
    };

    return (
        <div className="relative flex items-center justify-center w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                    className="text-slate-200"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                    className={getScoreColor()}
                    strokeWidth="3.8"
                    strokeDasharray={`${score}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`text-4xl font-bold ${getScoreColor()}`}>{score}</span>
                <span className="text-sm text-slate-500">/ 100</span>
            </div>
        </div>
    );
};

const ScorecardModal: React.FC<ScorecardModalProps> = ({ 
    isLoading, 
    scorecard, 
    projectFolder, 
    onClose, 
    onRegenerate, 
    isRegenerating,
    onViewProposal,
    onViewSlideshow,
}) => {
  const [loadingMessage, setLoadingMessage] = useState('Generating Analysis...');
  const hasSlideshow = !!projectFolder.slideshow;

  const loadingMessages = [
    "Evaluating the generated proposal...",
    "Cross-referencing against your company's strengths...",
    "Matching project needs with team skills from resume...",
    "Scoring technical feasibility and alignment...",
    "Identifying potential resource gaps...",
    "Compiling the final scorecard..."
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isLoading && !scorecard) {
      let i = 0;
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 2500);
    } else if (!isLoading) {
      setLoadingMessage('Generating Analysis...');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, scorecard]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 gap-3 sm:gap-0 border-b border-slate-200 bg-[#19224C] rounded-t-lg flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Project Fit Scorecard</h2>
            <p className="text-sm text-slate-300">{projectFolder.proposal.projectName}</p>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <div className="flex items-center p-1 bg-slate-700/50 rounded-full">
                <button onClick={() => onViewProposal(projectFolder)} className="px-3 py-1 text-xs font-semibold rounded-full text-slate-200 hover:bg-slate-600" title="View Proposal">Proposal</button>
                <button className="px-3 py-1 text-xs font-semibold rounded-full bg-white text-slate-800" title="Current: Scorecard">Scorecard</button>
                <button onClick={() => onViewSlideshow(projectFolder)} disabled={!hasSlideshow} className="px-3 py-1 text-xs font-semibold rounded-full text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed" title={hasSlideshow ? 'View Presentation' : 'Generate Presentation first'}>Slides</button>
            </div>
            
            <div className="border-l border-slate-600 h-6 mx-1"></div>

            <button
                onClick={onRegenerate}
                disabled={isLoading}
                className="p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate Scorecard"
            >
                <RefreshIcon className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium hidden sm:inline">
                    {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </span>
            </button>
            <button onClick={onClose} title="Close" className="p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto">
          {isLoading && !scorecard && (
            <div className="flex flex-col items-center justify-center h-64">
               <svg className="animate-spin h-10 w-10 text-red-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <h3 className="text-lg font-semibold text-slate-700">{loadingMessage}</h3>
              <p className="text-slate-500">Please wait while the AI evaluates the proposal.</p>
            </div>
          )}
          {scorecard && (
            <div className={`space-y-6 ${isLoading ? 'opacity-50' : ''}`}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-8">
                    <div className="flex-shrink-0">
                        <ScoreGauge score={scorecard.overallFitScore} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 border-b-2 border-red-200 pb-2 mb-3 mt-4 sm:mt-0">Summary Analysis</h3>
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{scorecard.summary}</div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-800 border-b-2 border-red-200 pb-2 mb-3">Criteria Breakdown</h3>
                    <div className="space-y-4">
                        {scorecard.criteria.map((criterion, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-semibold text-slate-800">{criterion.name}</h4>
                                    <span className="font-bold text-lg text-slate-700">{criterion.score} <span className="text-sm text-slate-500">/ 10</span></span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${criterion.score * 10}%` }}></div>
                                </div>
                                <p className="text-sm text-slate-600 mt-2 italic">"{criterion.reasoning}"</p>
                                {criterion.name === 'Resource Gap Analysis' && criterion.missingResources && criterion.missingResources.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-slate-200">
                                        <h5 className="text-sm font-semibold text-slate-700 mb-2">Suggested New Resources to Fill Gap:</h5>
                                        <div className="overflow-x-auto border border-slate-200 rounded-md">
                                            <table className="w-full min-w-[600px] text-sm text-left text-slate-600">
                                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                                    <tr>
                                                        <th scope="col" className="px-4 py-2">Role</th>
                                                        <th scope="col" className="px-4 py-2 text-right">Est. Hours</th>
                                                        <th scope="col" className="px-4 py-2 text-right">Est. Rate/Hour</th>
                                                        <th scope="col" className="px-4 py-2 text-right">Total Cost (Low-High)</th>
                                                        <th scope="col" className="px-4 py-2">Project Area Focus</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {criterion.missingResources.map((res, resIndex) => (
                                                        <tr key={resIndex} className="border-b odd:bg-white even:bg-slate-50 hover:bg-red-50">
                                                            <td className="px-4 py-2 font-medium text-slate-900">{res.role}</td>
                                                            <td className="px-4 py-2 text-right">{res.hours}</td>
                                                            <td className="px-4 py-2 text-right">{`${formatCurrency(res.lowRate)} - ${formatCurrency(res.highRate)}`}</td>
                                                            <td className="px-4 py-2 text-right font-medium">{`${formatCurrency(res.hours * res.lowRate)} - ${formatCurrency(res.hours * res.highRate)}`}</td>
                                                            <td className="px-4 py-2">{res.projectArea}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScorecardModal;