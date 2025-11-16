import React, { useState, useEffect, useCallback } from 'react';
import type { ProjectFolder, EmailDraft } from '../types';
import { CloseIcon, SparklesIcon } from './icons';
import { generateEmailDraft } from '@/services/geminiService';
import { useAppContext } from '../contexts/AppContext';

interface EmailComposerModalProps {
  projectFolder: ProjectFolder;
  onClose: () => void;
}

const EmailComposerModal: React.FC<EmailComposerModalProps> = ({ projectFolder, onClose }) => {
    const { addToast } = useAppContext();
    const [draft, setDraft] = useState<Partial<EmailDraft>>({});
    const [isLoading, setIsLoading] = useState(false);
    
    const handleGenerateDraft = useCallback(async () => {
        setIsLoading(true);
        try {
            const newDraft = await generateEmailDraft(projectFolder.proposal, projectFolder.proposal.contactPerson, projectFolder.proposal.contactEmail);
            setDraft(newDraft);
        } catch (e: any) {
            addToast(`Failed to generate email draft: ${e.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [projectFolder, addToast]);
    
    useEffect(() => {
        handleGenerateDraft();
    }, [handleGenerateDraft]);

    const handleSend = () => {
        if (!draft.body || !draft.subject) {
            addToast('Draft is not ready to send.', 'error');
            return;
        }
        const mailtoLink = `mailto:${draft.recipient || ''}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
        window.open(mailtoLink, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">Compose Email</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100" title="Close">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="recipient" className="block text-sm font-medium text-slate-700">Recipient</label>
                        <input
                            id="recipient"
                            type="email"
                            value={draft.recipient || ''}
                            onChange={e => setDraft(d => ({ ...d, recipient: e.target.value }))}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm"
                            placeholder="client@example.com"
                        />
                    </div>
                     <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-700">Subject</label>
                        <input
                            id="subject"
                            type="text"
                            value={draft.subject || ''}
                            onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm"
                            placeholder="Proposal for..."
                        />
                    </div>
                     <div>
                        <label htmlFor="body" className="block text-sm font-medium text-slate-700">Body</label>
                        <textarea
                            id="body"
                            rows={12}
                            value={draft.body || ''}
                            onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm"
                            placeholder="Email content..."
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
                    <button onClick={handleGenerateDraft} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200 disabled:opacity-50">
                       <SparklesIcon className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
                       {isLoading ? 'Generating...' : 'Regenerate Draft'}
                    </button>
                    <button onClick={handleSend} className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                        Open in Email Client
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailComposerModal;