

import React, { useState, useCallback, useMemo } from 'react';
import { UploadIcon, DocumentIcon, LightbulbIcon, CodeIcon, CheckCircleIcon, DeleteIcon, SearchIcon as GoogleSearchIcon, UsersIcon, BookOpenIcon } from './icons';
import type { ProposalTemplate } from '../types';
import { useAppContext } from '../contexts/AppContext';

export interface RfpQueueItem {
  id: string;
  type: 'file' | 'text';
  name: string;
  data: File | string;
}

interface RfpUploadProps {
  onGenerate: (queue: RfpQueueItem[], template: ProposalTemplate, useGoogleSearch: boolean, teamId: string, playbookId: string | null) => void;
  isLoading: boolean;
  isProfileComplete: boolean;
  onNavigateToProfile: () => void;
  loadingMessage: string;
}

const templates: { id: ProposalTemplate; name: string; description: string; icon: React.FC<{className?: string}> }[] = [
    { id: 'standard', name: 'Standard Professional', description: 'A classic, formal proposal for corporate clients.', icon: DocumentIcon },
    { id: 'creative', name: 'Creative & Modern', description: 'A more engaging, narrative-driven proposal.', icon: LightbulbIcon },
    { id: 'technical', name: 'Technical Deep-Dive', description: 'A data-driven proposal focused on specifications.', icon: CodeIcon }
];

const RfpUpload: React.FC<RfpUploadProps> = ({ onGenerate, isLoading, isProfileComplete, onNavigateToProfile, loadingMessage }) => {
  const [queue, setQueue] = useState<RfpQueueItem[]>([]);
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate>('standard');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('');
  const [pastedText, setPastedText] = useState('');
  const [pastedTextName, setPastedTextName] = useState('');
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const { addToast, profileData, industryPlaybooks } = useAppContext();

  const eligibleTeams = useMemo(() => 
    profileData.teams.filter(team => team.capabilitiesStatement.length > 0 && team.resume.length > 0)
  , [profileData.teams]);

  const addFilesToQueue = useCallback((incomingFiles: FileList | null) => {
    if (!incomingFiles) return;
    const newItems = Array.from(incomingFiles).filter(file => {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        addToast(`File "${file.name}" exceeds 20MB limit.`, 'error');
        return false;
      }
      if (queue.some(item => item.type === 'file' && item.name === file.name)) {
        addToast(`File "${file.name}" is already in the queue.`, 'error');
        return false;
      }
      return true;
    }).map(file => ({
      id: crypto.randomUUID(),
      type: 'file' as const,
      name: file.name,
      data: file
    }));
    if (newItems.length > 0) setQueue(prev => [...prev, ...newItems]);
  }, [queue, addToast]);
  
  const addTextToQueue = () => {
    if (!pastedText.trim() || !pastedTextName.trim()) {
      addToast('Please provide a name and content for the pasted RFP.', 'error');
      return;
    }
    const nameWithExt = pastedTextName.endsWith('.txt') ? pastedTextName : `${pastedTextName}.txt`;
    if (queue.some(item => item.type === 'text' && item.name === nameWithExt)) {
      addToast(`An entry named "${nameWithExt}" is already in the queue.`, 'error');
      return;
    }
    const newItem: RfpQueueItem = {
      id: crypto.randomUUID(),
      type: 'text',
      name: nameWithExt,
      data: pastedText
    };
    setQueue(prev => [...prev, newItem]);
    setPastedText('');
    setPastedTextName('');
  };

  const handleRemoveItem = (id: string) => setQueue(prev => prev.filter(item => item.id !== id));
  
  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (uploadMode === 'file') setIsDragging(true); }, [uploadMode]);
  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (uploadMode === 'file' && e.dataTransfer.files) addFilesToQueue(e.dataTransfer.files); }, [uploadMode, addFilesToQueue]);
  
  const handleGenerateClick = async () => {
    if (queue.length === 0) {
      addToast('Please add at least one RFP to the queue.', 'error');
      return;
    }
    if (!selectedTeamId) {
      addToast('Please select a team profile to use for generation.', 'error');
      return;
    }
    onGenerate(queue, selectedTemplate, useGoogleSearch, selectedTeamId, selectedPlaybookId || null);
    setQueue([]);
  };

  if (!isProfileComplete) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Complete Your Profile to Begin</h2>
        <p className="text-slate-600 mb-6">Please add an <strong>SMS number</strong> and upload a <strong>Capabilities Statement</strong> and <strong>Resume</strong> for at least one team.</p>
        <button onClick={onNavigateToProfile} className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700">Go to Company Profile</button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg" data-tour-id="rfp-upload-area">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Add RFP(s) to Queue</h2>
      
      <div className="flex justify-center mb-4 bg-slate-100 rounded-full p-1">
          <button onClick={() => setUploadMode('file')} className={`w-1/2 py-1.5 text-sm font-semibold rounded-full ${uploadMode === 'file' ? 'bg-white text-red-600 shadow' : 'text-slate-600'}`}>Upload File(s)</button>
          <button onClick={() => setUploadMode('text')} className={`w-1/2 py-1.5 text-sm font-semibold rounded-full ${uploadMode === 'text' ? 'bg-white text-red-600 shadow' : 'text-slate-600'}`}>Paste Text</button>
      </div>
      
      {uploadMode === 'file' ? (
        <div onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop} className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-red-600 bg-red-50' : 'border-slate-300 hover:border-slate-400'}`}>
          <input type="file" id="file-upload" className="hidden" multiple onChange={(e) => addFilesToQueue(e.target.files)} accept=".txt,.md,.pdf,.docx" />
          <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
          <label htmlFor="file-upload" className="mt-2 block text-sm font-medium text-red-600 hover:text-red-500 cursor-pointer">Choose files</label>
          <p className="text-xs text-slate-500 mt-1">or drag and drop</p>
        </div>
      ) : (
        <div className="space-y-3">
          <input type="text" value={pastedTextName} onChange={(e) => setPastedTextName(e.target.value)} placeholder="Enter a name for this RFP..." className="w-full px-3 py-2 border rounded-md text-sm" />
          <textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)} rows={4} placeholder="Paste RFP content here..." className="w-full px-3 py-2 border rounded-md text-sm" />
          <button onClick={addTextToQueue} className="w-full bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-700">Add to Queue</button>
        </div>
      )}
      
      {queue.length > 0 && (
        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
          <h3 className="text-sm font-medium text-slate-700">RFP Queue: ({queue.length})</h3>
          {queue.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
              <div className="flex items-center space-x-2 overflow-hidden">
                <DocumentIcon className="h-5 w-5 text-slate-500 flex-shrink-0" />
                <span className="text-sm text-slate-800 truncate" title={item.name}>{item.name}</span>
                {item.type === 'text' && <span className="text-xs text-slate-500">(Pasted)</span>}
              </div>
              <button onClick={() => handleRemoveItem(item.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full flex-shrink-0 ml-2" title="Remove">
                <DeleteIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Select Proposal Template</h2>
          <div className="grid grid-cols-1 gap-4">
              {templates.map((template) => (
                  <button key={template.id} onClick={() => setSelectedTemplate(template.id)} className={`relative p-4 border rounded-lg text-left transition-all ${selectedTemplate === template.id ? 'border-red-600 bg-red-50 shadow-md' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
                      {selectedTemplate === template.id && (<CheckCircleIcon className="absolute top-3 right-3 h-6 w-6 text-red-600" />)}
                      <div className="flex items-start space-x-4">
                        <template.icon className="h-8 w-8 text-slate-500 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-base text-slate-800">{template.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                        </div>
                      </div>
                  </button>
              ))}
          </div>
      </div>
      
       <div className="mt-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Select Context</h2>
           <div className="space-y-4">
                <div className="relative">
                  <UsersIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                    disabled={eligibleTeams.length === 0}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                      <option value="" disabled>-- Select a team profile --</option>
                      {eligibleTeams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                  </select>
                </div>
                {eligibleTeams.length === 0 && (
                   <p className="text-xs text-amber-600 mt-2">No teams with both Capabilities and Resume documents found. Please update in <button onClick={onNavigateToProfile} className="font-semibold underline">Company Profile</button>.</p>
                )}

                <div className="relative">
                  <BookOpenIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedPlaybookId}
                    onChange={e => setSelectedPlaybookId(e.target.value)}
                    disabled={industryPlaybooks.length === 0}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                      <option value="">-- Select Industry Playbook (Optional) --</option>
                      {industryPlaybooks.map(playbook => (
                          <option key={playbook.id} value={playbook.id}>{playbook.name}</option>
                      ))}
                  </select>
                </div>
           </div>
      </div>

       <div className="mt-6 pt-4 border-t border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">4. Generation Options</h2>
           <label htmlFor="google-search-toggle" className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border hover:bg-slate-100 cursor-pointer">
              <div className="flex items-center">
                <GoogleSearchIcon className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <span className="font-semibold text-slate-800">Use Google Search</span>
                  <p className="text-xs text-slate-500">Ground results with real-time web info for better accuracy.</p>
                </div>
              </div>
              <div className="relative">
                  <input 
                      id="google-search-toggle" 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={useGoogleSearch}
                      onChange={(e) => setUseGoogleSearch(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </div>
           </label>
      </div>

      <button onClick={handleGenerateClick} disabled={!queue.length || isLoading || !selectedTeamId} className="mt-6 w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-slate-400 flex items-center justify-center">
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg>
            {loadingMessage}
          </>
        ) : (
          `Generate ${queue.length > 1 ? `${queue.length} Proposals` : 'Proposal'}`
        )}
      </button>
    </div>
  );
};

export default RfpUpload;
