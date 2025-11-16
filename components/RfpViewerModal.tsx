import React, { useEffect, useState } from 'react';
import type { ProjectFolder } from '../types';
import { CloseIcon, DocumentIcon } from './icons';

interface RfpViewerModalProps {
  projectFolder: ProjectFolder;
  onClose: () => void;
}

const RfpViewerModal: React.FC<RfpViewerModalProps> = ({ projectFolder, onClose }) => {
  const [viewableUrl, setViewableUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isPdfFile = false;

    const generateUrl = async () => {
      if (projectFolder.rfpFileDataUrl && projectFolder.rfpFileDataUrl.startsWith('data:')) {
        try {
          const response = await fetch(projectFolder.rfpFileDataUrl);
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          isPdfFile = blob.type === 'application/pdf' || projectFolder.rfpFileName.toLowerCase().endsWith('.pdf');
        } catch (e) {
          console.error("Error converting data URL to blob URL", e);
        }
      } else if (projectFolder.rfpContent) {
        try {
          const blob = new Blob([projectFolder.rfpContent], { type: 'text/plain;charset=utf-8' });
          objectUrl = URL.createObjectURL(blob);
          isPdfFile = false;
        } catch (e) {
          console.error("Error creating blob URL for RFP content", e);
        }
      }

      setViewableUrl(objectUrl);
      setIsPdf(isPdfFile);
    };

    generateUrl();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [projectFolder]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="rfp-viewer-title">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-2 overflow-hidden">
            <DocumentIcon className="w-6 h-6 text-slate-500 flex-shrink-0" />
            <div className="overflow-hidden">
                <h2 id="rfp-viewer-title" className="text-lg font-bold text-slate-800 truncate">
                    RFP Viewer
                </h2>
                <p className="text-sm text-slate-500 truncate" title={projectFolder.rfpFileName}>
                    {projectFolder.rfpFileName}
                </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors" aria-label="Close" title="Close">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow bg-slate-100 overflow-hidden">
          {viewableUrl ? (
            isPdf ? (
              <iframe
                src={viewableUrl}
                title={`RFP Viewer: ${projectFolder.rfpFileName}`}
                className="w-full h-full border-none"
              />
            ) : (
              <pre className="w-full h-full p-6 overflow-auto whitespace-pre-wrap text-sm text-slate-800 bg-white">
                {projectFolder.rfpContent}
              </pre>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-slate-500">Loading document...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RfpViewerModal;