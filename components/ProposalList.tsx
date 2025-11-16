



import React from 'react';
import type { ProjectFolder, SalesStage } from '../types';
import ProjectFolderCard from './ProposalCard';
import { SearchIcon, SortAscendingIcon, SortDescendingIcon } from './icons';

interface ProjectFolderListProps {
  folders: ProjectFolder[];
  onView: (folder: ProjectFolder) => void;
  onDelete: (id: string) => void;
  onEmail: (folder: ProjectFolder) => void;
  onViewScorecard: (folder: ProjectFolder) => void;
  onGenerateSlideshow: (folder: ProjectFolder) => void;
  onViewRfp: (folder: ProjectFolder) => void;
  onSalesStageChange: (id: string, stage: SalesStage) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: 'folderName' | 'generatedDate' | 'rfpFileName' | 'salesStage';
  onSortByChange: (by: 'folderName' | 'generatedDate' | 'rfpFileName' | 'salesStage') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  stageFilter: SalesStage[];
  onStageFilterChange: (stages: SalesStage[]) => void;
}

const allSalesStages: SalesStage[] = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed-Won', 'Closed-Lost'];

const ProjectFolderList: React.FC<ProjectFolderListProps> = ({ 
    folders, 
    onView, 
    onDelete, 
    onEmail, 
    onViewScorecard,
    onGenerateSlideshow,
    onViewRfp,
    onSalesStageChange,
    searchTerm,
    onSearchChange,
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderChange,
    stageFilter,
    onStageFilterChange
}) => {
  const handleStageToggle = (stage: SalesStage) => {
    const newFilter = stageFilter.includes(stage)
      ? stageFilter.filter(s => s !== stage)
      : [...stageFilter, stage];
    onStageFilterChange(newFilter.length > 0 ? newFilter : allSalesStages); 
  };
    
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg" data-tour-id="project-folders-area">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-slate-800 shrink-0">Project Folders</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
              aria-label="Search projects"
            />
          </div>
          <label htmlFor="sort-by-select" className="sr-only">Sort by</label>
          <select
            id="sort-by-select"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as 'folderName' | 'generatedDate' | 'rfpFileName' | 'salesStage')}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
          >
            <option value="generatedDate">Date</option>
            <option value="folderName">Name</option>
            <option value="rfpFileName">RFP File</option>
            <option value="salesStage">Stage</option>
          </select>
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            aria-label={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? <SortAscendingIcon className="h-5 w-5" /> : <SortDescendingIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm font-medium text-slate-600 mr-2 shrink-0">Filter by Stage:</span>
        {allSalesStages.map(stage => (
          <button
            key={stage}
            onClick={() => handleStageToggle(stage)}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
              stageFilter.includes(stage)
                ? 'bg-red-600 text-white shadow'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {stage}
          </button>
        ))}
      </div>
      {folders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <ProjectFolderCard
              key={folder.id}
              folder={folder}
              onView={onView}
              onDelete={onDelete}
              onEmail={onEmail}
              onViewScorecard={onViewScorecard}
              onGenerateSlideshow={onGenerateSlideshow}
              onViewRfp={onViewRfp}
              onSalesStageChange={onSalesStageChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
           {(() => {
              if (searchTerm) {
                return (
                  <>
                    <p className="text-slate-500">No projects found for "{searchTerm}".</p>
                    <p className="text-sm text-slate-400 mt-1">Try a different search term or adjust your filters.</p>
                  </>
                );
              }
              if (stageFilter.length < allSalesStages.length) {
                return (
                  <>
                    <p className="text-slate-500">No projects match the selected filters.</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting or clearing your stage filters.</p>
                  </>
                );
              }
              return (
                <>
                  <p className="text-slate-500">No projects have been generated yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Upload an RFP to get started.</p>
                </>
              );
           })()}
        </div>
      )}
    </div>
  );
};

export default ProjectFolderList;