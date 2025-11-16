

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { View } from '../types';

interface TourStep {
    target?: string;
    title: string;
    content: string;
    view?: View;
}

interface OnboardingTourProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ currentView, onViewChange }) => {
    const { isTourOpen, closeTour, completeOnboarding } = useAppContext();
    const [stepIndex, setStepIndex] = useState(0);

    const tourSteps: TourStep[] = useMemo(() => [
        {
            title: "Welcome to the RFP Response Generator!",
            content: "This quick tour will guide you through the key features to get you started.",
        },
        {
            target: "[data-tour-id='profile-nav']",
            title: "1. Complete Your Profile",
            content: "Start here. Uploading your capabilities statement and resume provides the AI with the context it needs to generate high-quality, relevant proposals.",
            view: 'profile',
        },
        {
            target: "[data-tour-id='profile-strength']",
            title: "Track Your Profile Strength",
            content: "This meter shows how complete your profile is. A full profile is crucial for the best results. Upload your documents below.",
            view: 'profile',
        },
        {
            target: "[data-tour-id='resources-nav']",
            title: "2. Manage Your Resources",
            content: "This is where you can pre-define your team members and their hourly rates. The AI will use this information when estimating project costs.",
            view: 'resources',
        },
        {
            target: "[data-tour-id='create-project-button']",
            title: "3. Generate a Proposal",
            content: "Once your profile is set up, you're ready to generate proposals! Click this button to start a new project.",
            view: 'dashboard',
        },
        {
            target: "[data-tour-id='rfp-upload-area']",
            title: "Upload Your RFP",
            content: "Simply drag and drop or select an RFP document here. Choose a template, then click 'Generate Proposal'.",
            view: 'createProject',
        },
        {
            target: "[data-tour-id='project-folders-area']",
            title: "View Your Projects",
            content: "After generation, your proposals will appear here. From the project card, you can view the proposal or generate an internal 'Scorecard' to analyze its fit.",
            view: 'projects',
        },
         {
            target: "[data-tour-id='slideshow-button']",
            title: "Create a Presentation",
            content: "After generating a scorecard, you can create a client-ready slideshow with one click. You can then view and export it as a PDF.",
            view: 'projects',
        },
        {
            target: "[data-tour-id='calendar-nav']",
            title: "4. Track Your Projects",
            content: "Use the Calendar view to visualize all your project timelines. This helps you manage resources and spot potential scheduling conflicts.",
            view: 'calendar',
        },
        {
            title: "You're All Set!",
            content: "You now know the basics. Click the 'Help' icon in the header if you ever want to see this tour again. Happy generating!",
        },
    ], []);
    
    const currentStep = useMemo(() => tourSteps[stepIndex], [stepIndex, tourSteps]);
    const [position, setPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ display: 'none' });

    const updatePosition = useCallback(() => {
        const targetElement = currentStep.target ? document.querySelector(currentStep.target) : null;
        
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            const rect = targetElement.getBoundingClientRect();
            
            setHighlightStyle({
                top: `${rect.top - 4}px`,
                left: `${rect.left - 4}px`,
                width: `${rect.width + 8}px`,
                height: `${rect.height + 8}px`,
                opacity: 1,
            });

            const popoverTop = rect.bottom + 10;
            const popoverLeft = rect.left + rect.width / 2;
            setPosition({ top: `${popoverTop}px`, left: `${popoverLeft}px`, transform: 'translateX(-50%)' });

        } else {
            setHighlightStyle({ opacity: 0 });
            setPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
        }
    }, [currentStep]);

    useEffect(() => {
        if (!isTourOpen) {
            // Reset to first step when tour is closed/reopened
            setTimeout(() => setStepIndex(0), 300); 
            return;
        }
        
        const timeoutId = setTimeout(updatePosition, 100);

        window.addEventListener('resize', updatePosition);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updatePosition);
        };
    }, [stepIndex, isTourOpen, currentView, updatePosition]);

    const handleNext = () => {
        if (stepIndex < tourSteps.length - 1) {
            const nextStep = tourSteps[stepIndex + 1];
            if (nextStep.view && nextStep.view !== currentView) {
                onViewChange(nextStep.view);
            }
            setStepIndex(stepIndex + 1);
        } else {
            completeOnboarding();
        }
    };
    
    const handlePrev = () => {
        if (stepIndex > 0) {
            const prevStep = tourSteps[stepIndex - 1];
            if (prevStep.view && prevStep.view !== currentView) {
                onViewChange(prevStep.view);
            }
            setStepIndex(stepIndex - 1);
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    if (!isTourOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000]">
            <div className="absolute inset-0 bg-black bg-opacity-60 transition-opacity duration-300" onClick={handleSkip} />
            <div
                className="absolute rounded-md shadow-2xl transition-all duration-300 ring-4 ring-red-500 bg-transparent pointer-events-none"
                style={highlightStyle}
            />
            <div 
                className="absolute bg-white rounded-lg shadow-xl p-5 w-80 text-slate-800 transition-all duration-300"
                style={position}
                role="dialog"
                aria-labelledby="tour-title"
                aria-describedby="tour-content"
            >
                <h3 id="tour-title" className="text-lg font-bold mb-2">{currentStep.title}</h3>
                <p id="tour-content" className="text-sm text-slate-600 mb-6">{currentStep.content}</p>

                <div className="flex justify-between items-center">
                    <button onClick={handleSkip} className="text-sm text-slate-500 hover:text-slate-800">Skip</button>
                    <div className="flex items-center space-x-2">
                        {stepIndex > 0 && (
                            <button onClick={handlePrev} className="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-100">Back</button>
                        )}
                        <button onClick={handleNext} className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700">
                            {stepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
                 <div className="absolute -top-2 -right-2">
                    <button onClick={handleSkip} className="bg-white rounded-full p-1 shadow-md hover:bg-slate-100" aria-label="Close tour" title="Close tour">
                        <svg className="h-5 w-5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTour;