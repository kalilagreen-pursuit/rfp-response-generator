


import React from 'react';
import type { ProjectFolder, SalesStage } from '../types';
import { ViewIcon, DeleteIcon, FolderIcon, EmailIcon, ClipboardCheckIcon, PresentationIcon } from './icons';

interface ProjectFolderCardProps {
  folder: ProjectFolder;
  onView: (folder: ProjectFolder) => void;
  onDelete: (id: string) => void;
  onEmail: (folder: ProjectFolder) => void;
  onViewScorecard: (folder: ProjectFolder) => void;
  onGenerateSlideshow: (folder: ProjectFolder) => void;
  onViewRfp: (folder: ProjectFolder) => void;
  onSalesStageChange: (id: string, stage: SalesStage) => void;
}

const stageStyles: Record<SalesStage, { bg: string, text: string, ring: string, icon: string }> = {
    'Prospecting': { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'focus:ring-slate-400', icon: 'text-slate-500' },
    'Qualification': { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'focus:ring-blue-400', icon: 'text-blue-500' },
    'Proposal': { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'focus:ring-amber-400', icon: 'text-amber-500' },
    'Negotiation': { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'focus:ring-purple-400', icon: 'text-purple-500' },
    'Closed-Won': { bg: 'bg-green-100', text: 'text-green-700', ring: 'focus:ring-green-400', icon: 'text-green-500' },
    'Closed-Lost': { bg: 'bg-red-100', text: 'text-red-700', ring: 'focus:ring-red-400', icon: 'text-red-500' },
};

const getScoreColorClasses = (score: number): { bg: string, text: string } => {
    if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700' };
    if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-red-100', text: 'text-red-700' };
};

const salesStages: SalesStage[] = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed-Won', 'Closed-Lost'];

const ProjectFolderCard: React.FC<ProjectFolderCardProps> = ({ folder, onView, onDelete, onEmail, onViewScorecard, onGenerateSlideshow, onViewRfp, onSalesStageChange }) => {
  const hasScorecard = !!folder.scorecard;
  const hasSlideshow = !!folder.slideshow;
  const score = folder.scorecard?.overallFitScore;
  const currentStageStyle = stageStyles[folder.salesStage];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col text-center">
        <button onClick={() => onView(folder)} className="w-full flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-red-300 rounded-md pb-3">
            <FolderIcon className={`h-16 w-16 ${currentStageStyle.icon} mb-3 transition-colors duration-200`} />
            <h3 className="font-semibold text-slate-800 truncate w-full" title={folder.folderName}>
                {folder.folderName}
            </h3>
            <div className="flex items-center justify-center gap-1.5 w-full mt-1 px-2">
                <p className="text-xs text-slate-500 truncate" title={folder.rfpFileName}>
                    {folder.rfpFileName}
                </p>
                {folder.rfpFileDataUrl && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onViewRfp(folder); }}
                        className="p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500 rounded-full transition-colors flex-shrink-0"
                        title={`View ${folder.rfpFileName}`}
                        aria-label={`View ${folder.rfpFileName}`}
                    >
                        <ViewIcon className="h-4 w-4" />
                    </button>
                )}
            </div>
        </button>

        {hasScorecard && typeof score === 'number' ? (
            <div
                className={`inline-flex items-center justify-center gap-1.5 py-1 px-2 my-2 rounded-full text-xs font-bold self-center ${getScoreColorClasses(score).bg} ${getScoreColorClasses(score).text}`}
                title={`Project Fit Score: ${score}/100`}
            >
                <ClipboardCheckIcon className="h-3 w-3" />
                <span>{score}/100 Fit</span>
            </div>
        ) : (
            <div className="h-[26px] my-2"></div> // Placeholder for layout consistency
        )}

        <div className="w-full mb-3">
            <label htmlFor={`stage-${folder.id}`} className="sr-only">Sales Stage</label>
            <select
                id={`stage-${folder.id}`}
                value={folder.salesStage}
                onChange={(e) => {
                    e.stopPropagation();
                    onSalesStageChange(folder.id, e.target.value as SalesStage);
                }}
                className={`w-full text-sm font-semibold py-1.5 px-2 rounded-md appearance-none text-center cursor-pointer border-0 focus:outline-none focus:ring-2 ${currentStageStyle.bg} ${currentStageStyle.text} ${currentStageStyle.ring}`}
                aria-label={`Sales stage: ${folder.salesStage}`}
                onClick={(e) => e.stopPropagation()}
            >
                {salesStages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                ))}
            </select>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1 pt-3 border-t border-slate-100 w-full">
            <button
            onClick={(e) => { e.stopPropagation(); onView(folder); }}
            className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-full transition-colors duration-200"
            title="View"
            >
            <ViewIcon className="h-5 w-5 mx-auto" />
            </button>
            <button
            data-tour-id="scorecard-button"
            onClick={(e) => { e.stopPropagation(); onViewScorecard(folder); }}
            className={`p-2 rounded-full transition-colors duration-200 ${
              hasScorecard
                ? 'text-green-600 hover:bg-green-100'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
            title={hasScorecard ? `View Scorecard (${folder.scorecard?.overallFitScore}/100)` : 'Generate Scorecard'}
            >
            <ClipboardCheckIcon className="h-5 w-5 mx-auto" />
            </button>
             <button
                data-tour-id="slideshow-button"
                onClick={(e) => { e.stopPropagation(); onGenerateSlideshow(folder); }}
                disabled={!hasScorecard}
                className={`p-2 rounded-full transition-colors duration-200 disabled:text-slate-300 disabled:cursor-not-allowed ${
                  hasSlideshow
                    ? 'text-purple-600 hover:bg-purple-100'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title={!hasScorecard ? 'Generate a scorecard first' : (hasSlideshow ? 'View Presentation' : 'Generate Presentation')}
            >
                <PresentationIcon className="h-5 w-5 mx-auto" />
            </button>
             <button
            onClick={(e) => { e.stopPropagation(); onEmail(folder); }}
            className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-full transition-colors duration-200"
            title="Email Proposal"
            >
            <EmailIcon className="h-5 w-5 mx-auto" />
            </button>
            <button
            onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
            className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-full transition-colors duration-200"
            title="Delete"
            >
            <DeleteIcon className="h-5 w-5 mx-auto" />
            </button>
        </div>
    </div>
  );
};

export default ProjectFolderCard;