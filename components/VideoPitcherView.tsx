import React, { useState, useEffect } from 'react';
import type { ProjectFolder } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { ai, generateVideoPitch } from '../services/geminiService';
import { getAuthToken } from '../services/api';
import { VideoIcon } from './icons';

interface VideoPitcherViewProps {
    project: ProjectFolder;
    onUpdateProject: (project: ProjectFolder) => void;
}

const loadingMessages = [
    "Warming up the virtual cameras...",
    "Consulting with the AI director...",
    "Rendering the first few frames...",
    "Adding special effects and animations...",
    "Optimizing audio and sound design...",
    "Performing final color grading...",
    "Preparing the final cut for screening..."
];

const VideoPitcherView: React.FC<VideoPitcherViewProps> = ({ project, onUpdateProject }) => {
    const { addToast } = useAppContext();
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);

    // Effect to cycle through loading messages
    useEffect(() => {
        let messageInterval: number | undefined;
        if (project.isVideoGenerating) {
            let i = 0;
            messageInterval = window.setInterval(() => {
                i = (i + 1) % loadingMessages.length;
                setCurrentLoadingMessage(loadingMessages[i]);
            }, 3000);
        }
        return () => {
            if (messageInterval) clearInterval(messageInterval);
        };
    }, [project.isVideoGenerating]);


    const handleGenerateVideo = async () => {
        if (!project.videoScript) {
            addToast('A video script must be generated first.', 'error');
            return;
        }

        // Set initial generating state
        onUpdateProject({ ...project, isVideoGenerating: true, videoPitchUrl: undefined, videoGenerationOperationName: undefined });
        addToast("Starting video generation. This may take several minutes...", 'info');

        try {
            let operation = await generateVideoPitch(project.videoScript);

            // Persist the operation name. Polling won't auto-resume on reload, but it's useful for reference.
            if (operation.name) {
                onUpdateProject({ ...project, isVideoGenerating: true, videoGenerationOperationName: operation.name });
            } else {
                throw new Error("Failed to get an operation name from the video generation API.");
            }

            // Start polling within this session. This is the correct way to use the SDK.
            while (operation && !operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10s
                operation = await ai.operations.getVideosOperation({ operation });
            }

            const downloadLink = operation?.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                onUpdateProject({ ...project, isVideoGenerating: false, videoPitchUrl: downloadLink, videoGenerationOperationName: undefined });
                addToast('Video pitch generated successfully!', 'success');
            } else {
                throw new Error("Operation finished but no video URL was found.");
            }
        } catch (e: any) {
            onUpdateProject({ ...project, isVideoGenerating: false, videoGenerationOperationName: undefined });
            addToast(`Video generation failed: ${e.message}`, 'error');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800">2. Automated Video Pitch</h2>
                <button
                    onClick={handleGenerateVideo}
                    disabled={!project.videoScript || project.isVideoGenerating}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-slate-400"
                >
                    <VideoIcon className="w-4 h-4" />
                    <span>{project.videoPitchUrl ? 'Regenerate Video' : 'Generate Full Video Pitch'}</span>
                </button>
            </div>

            <div className="w-full aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                {project.isVideoGenerating ? (
                    <div className="text-center">
                         <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         <h3 className="text-lg font-semibold text-slate-700">Generation in Progress...</h3>
                         <p className="text-slate-500">{currentLoadingMessage}</p>
                    </div>
                ) : project.videoPitchUrl ? (
                    <video
                        controls
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/video/proxy?url=${encodeURIComponent(project.videoPitchUrl)}`}
                        className="w-full h-full rounded-lg"
                        crossOrigin="anonymous"
                    >
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <div className="text-center text-slate-500">
                        <VideoIcon className="w-12 h-12 mx-auto mb-2" />
                        <p>Your generated video will appear here.</p>
                        <p className="text-xs">Ensure you have a script before generating.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPitcherView;