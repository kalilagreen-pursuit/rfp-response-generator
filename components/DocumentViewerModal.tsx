import React from 'react';
import type { ProfileDocument } from '../types';
import { CloseIcon, DocumentIcon } from './icons';

interface DocumentViewerModalProps {
  document: ProfileDocument;
  onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ document, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="doc-viewer-title">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-2 overflow-hidden">
            <DocumentIcon className="w-6 h-6 text-slate-500 flex-shrink-0" />
            <div className="overflow-hidden">
                <h2 id="doc-viewer-title" className="text-lg font-bold text-slate-800 truncate" title={document.fileName}>
                    {document.fileName}
                </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors" aria-label="Close" title="Close">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow bg-slate-50 overflow-y-auto p-6">
          <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
            {document.content}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
