import React, { useState, useRef } from 'react';
import type { ProjectFolder, Slide } from '../types';
import { CloseIcon, RefreshIcon, DownloadIcon, ImageIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { useAppContext } from '../contexts/AppContext';
import { exportSlideshowToPdf } from '../utils/pdfExporter';
import { toPng } from 'html-to-image';


const SciLogoIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 69 60" className={className} aria-label="Shaun Coggins Inc. Logo">
        <g>
            <path d="M29.5,2 L41.25,20.5 L64,21 L45.75,34.5 L50.5,53 L34.5,42.5 L18.5,53 L23.25,34.5 L5,21 L28,20.5 Z" fill="#D91A2A" />
            <path d="M30.8,32.2 C29.4,32.2 28.2,32 27.2,31.6 C26.2,31.2 25.4,30.6 24.8,29.8 L26.6,28.6 C27.4,29.8 28.8,30.4 30.8,30.4 C32,30.4 33,30.2 33.8,29.6 C34.6,29.2 35,28.5 35,27.6 C35,26.6 34.6,25.9 33.8,25.4 C33,25 31.8,24.4 30.2,23.8 C28.6,23.2 27.2,22.6 26.2,22 C25.2,21.4 24.4,20.6 23.8,19.6 C23.2,18.6 23,17.4 23,16 C23,14.6 23.4,13.4 24.2,12.4 C25,11.4 26.2,10.6 27.6,10.2 C29,9.8 30.4,9.6 32,9.6 C34.6,9.6 36.8,10.4 38.4,12 L36.6,13.4 C35.4,12.2 33.8,11.6 32,11.6 C30.8,11.6 29.8,11.8 29,12.4 C28.2,12.8 27.8,13.5 27.8,14.4 C27.8,15.4 28.2,16.1 29,16.6 C29.8,17 31,17.6 32.6,18.2 C34.2,18.8 35.6,19.4 36.6,20 C37.6,20.6 38.4,21.4 39,22.4 C39.6,23.4 39.8,24.6 39.8,26 C39.8,27.6 39.4,28.8 38.6,29.8 C37.8,30.8 36.6,31.6 35.2,32 C33.8,32.4 32.2,32.6 30.8,32.2 Z" fill="#19224C" transform="translate(0, 10)" />
            <path d="M43.6,38 L43.6,10 L40,10 L40,38 L43.6,38 Z M41.8,42 C40.8,42 40,41.2 40,40.2 C40,39.2 40.8,38.4 41.8,38.4 C42.8,38.4 43.6,39.2 43.6,40.2 C43.6,41.2 42.8,42 41.8,42 Z" fill="#19224C" transform="translate(0, 10)" />
        </g>
    </svg>
);

// Individual slide components
const TitleSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
    <div className="flex flex-col justify-center items-center h-full text-center p-4 sm:p-8 bg-slate-50">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-slate-800">{slide.title}</h1>
        {slide.subtitle && <p className="mt-4 text-lg sm:text-xl md:text-2xl text-slate-600">{slide.subtitle}</p>}
        <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8">
            <SciLogoIcon className="h-12 w-12 sm:h-16 sm:w-16 opacity-50" />
        </div>
    </div>
);

const DefaultSlide: React.FC<{ slide: Slide, children?: React.ReactNode }> = ({ slide, children }) => (
     <div className="p-4 sm:p-6 md:p-10 flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-2 sm:mb-4 md:mb-8 pb-3 border-b-2 border-red-200">{slide.title}</h2>
        <div className="flex-grow text-base sm:text-lg text-slate-700">
            {children}
        </div>
        <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 text-xs sm:text-sm text-slate-400 font-semibold">
            Shaun Coggins Inc.
        </div>
    </div>
);

const SummarySlide: React.FC<{ slide: Slide }> = ({ slide }) => (
    <DefaultSlide slide={slide}>
        <ul className="space-y-2 sm:space-y-4">
            {slide.points?.map((point, index) => (
                <li key={index} className="flex items-start">
                    <span className="text-red-500 font-bold mr-2 sm:mr-4 mt-1 text-lg sm:text-2xl">✓</span>
                    <span>{point}</span>
                </li>
            ))}
        </ul>
    </DefaultSlide>
);

const SolutionSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
     <DefaultSlide slide={slide}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3">Key Features</h3>
                <ul className="space-y-3">
                    {slide.key_features?.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <span className="text-blue-500 font-bold mr-3 mt-1 text-xl">›</span>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                 <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Conceptual Architecture</h3>
                 <p className="text-sm sm:text-base text-slate-600 italic">{slide.diagram_description}</p>
            </div>
        </div>
    </DefaultSlide>
);

const ConfidenceSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
    <DefaultSlide slide={slide}>
        <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-slate-600 text-base sm:text-xl mb-2">Our Confidence Score</p>
            <p className="text-5xl sm:text-7xl font-bold text-green-600 mb-6">{slide.score}<span className="text-xl sm:text-3xl text-slate-500">/100</span></p>
            <blockquote className="text-base sm:text-xl text-slate-700 italic border-l-4 border-red-500 pl-4 sm:pl-6 max-w-2xl mx-auto">
                {slide.quote}
            </blockquote>
        </div>
    </DefaultSlide>
);

const InvestmentSlide: React.FC<{ slide: Slide, folder: ProjectFolder }> = ({ slide, folder }) => (
    <DefaultSlide slide={slide}>
        <p className="text-sm sm:text-base text-slate-600 mb-6">Based on the project scope, we estimate the total investment to be in the following range:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 text-center">
            <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Low Estimate (Optimistic)</p>
                <p className="mt-1 text-2xl sm:text-4xl font-bold text-green-700">{formatCurrency(folder.proposal.investmentEstimate.low)}</p>
            </div>
            <div className="bg-amber-50 p-4 sm:p-6 rounded-lg border border-amber-200">
                <p className="text-xs sm:text-sm font-medium text-slate-500">High Estimate (Includes Contingency)</p>
                <p className="mt-1 text-2xl sm:text-4xl font-bold text-amber-700">{formatCurrency(folder.proposal.investmentEstimate.high)}</p>
            </div>
        </div>
    </DefaultSlide>
);

const NextStepsSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
    <DefaultSlide slide={slide}>
        <ol className="space-y-4 list-decimal list-inside text-base sm:text-xl">
            {slide.steps?.map((step, index) => <li key={index}><strong>{step.split(':')[0]}:</strong>{step.split(':')[1]}</li>)}
        </ol>
        <p className="mt-6 sm:mt-10 text-center text-base sm:text-lg text-slate-600">We are excited about the possibility of partnering with you.</p>
    </DefaultSlide>
);

const KeyDifferentiatorsSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
    <DefaultSlide slide={slide}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 pt-4">
            {slide.points?.map((point, index) => {
                const [title, ...description] = point.split(':');
                return (
                    <div key={index} className="text-center">
                        <div className="mx-auto bg-red-100 rounded-full h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center mb-4">
                            <span className="text-2xl sm:text-3xl font-bold text-red-600">{index + 1}</span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">{title}</h4>
                        <p className="text-sm sm:text-base text-slate-600">{description.join(':').trim()}</p>
                    </div>
                );
            })}
        </div>
    </DefaultSlide>
);

const ClientTestimonialsSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
     <DefaultSlide slide={slide}>
        <div className="flex flex-col items-center justify-center h-full space-y-8">
            <blockquote className="text-base sm:text-xl text-center text-slate-700 italic border-l-4 border-red-500 pl-6 max-w-3xl">
                "{slide.quote}"
            </blockquote>
            {slide.quote_source && <cite className="text-sm sm:text-md font-semibold text-slate-600 not-italic">— {slide.quote_source}</cite>}
        </div>
    </DefaultSlide>
);


interface SlideshowModalProps {
  projectFolder: ProjectFolder;
  isLoading: boolean;
  isRegenerating: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  onViewProposal: (folder: ProjectFolder) => void;
  onViewScorecard: (folder: ProjectFolder) => void;
}

const SlideshowModal: React.FC<SlideshowModalProps> = ({ 
    projectFolder, 
    isLoading, 
    isRegenerating, 
    onClose, 
    onRegenerate,
    onViewProposal,
    onViewScorecard,
}) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [isDownloadingImage, setIsDownloadingImage] = useState(false);
    const slideRef = useRef<HTMLDivElement>(null);
    const { addToast } = useAppContext();
    const slideshow = projectFolder.slideshow;
    const hasScorecard = !!projectFolder.scorecard;

    const handleNext = () => {
        if (slideshow && currentSlideIndex < slideshow.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };
    
    const handleExportPdf = async () => {
        if (!slideshow) {
            addToast('No slideshow data available to export.');
            return;
        }
        setIsExporting(true);
        try {
            await exportSlideshowToPdf(projectFolder);
        } catch (error) {
            addToast('Failed to export presentation as PDF.', 'error');
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadSlideAsImage = async () => {
        if (!slideRef.current) {
            addToast('Could not find slide content to download.');
            return;
        }
        setIsDownloadingImage(true);
        try {
            // Give the browser a moment to ensure styles are painted
            await new Promise(resolve => setTimeout(resolve, 50));

            const dataUrl = await toPng(slideRef.current, { 
                cacheBust: true,
                pixelRatio: 2, // for higher quality
                style: {
                    // html-to-image doesn't always pick up inherited font styles
                    fontFamily: 'sans-serif',
                }
            });
            const link = document.createElement('a');
            link.download = `${projectFolder.proposal.projectName.replace(/\s/g, '_')}_slide_${currentSlideIndex + 1}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error: any) {
            addToast(`Failed to download slide as image: ${error.message}`, 'error');
            console.error(error);
        } finally {
            setIsDownloadingImage(false);
        }
    };


    const renderSlide = (slide: Slide) => {
        switch (slide.type) {
            case 'title': return <TitleSlide slide={slide} />;
            case 'summary': return <SummarySlide slide={slide} />;
            case 'solution': return <SolutionSlide slide={slide} />;
            case 'investment': return <InvestmentSlide slide={slide} folder={projectFolder} />;
            case 'confidence': return <ConfidenceSlide slide={slide} />;
            case 'next_steps': return <NextStepsSlide slide={slide} />;
            case 'key_differentiators': return <KeyDifferentiatorsSlide slide={slide} />;
            case 'client_testimonials': return <ClientTestimonialsSlide slide={slide} />;
            default:
                return (
                    <DefaultSlide slide={slide}>
                        <p className="text-sm">{JSON.stringify(slide, null, 2)}</p>
                    </DefaultSlide>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 gap-3 sm:gap-0 border-b border-slate-200 bg-[#19224C] rounded-t-lg flex-shrink-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Presentation</h2>
                    <p className="text-sm text-slate-300">{projectFolder.proposal.projectName}</p>
                  </div>
                   <div className="flex items-center space-x-1 sm:space-x-2 self-end sm:self-auto flex-wrap justify-end">
                        <div className="flex items-center p-1 bg-slate-700/50 rounded-full">
                            <button onClick={() => onViewProposal(projectFolder)} className="px-3 py-1 text-xs font-semibold rounded-full text-slate-200 hover:bg-slate-600" title="View Proposal">Proposal</button>
                            <button onClick={() => onViewScorecard(projectFolder)} disabled={!hasScorecard} className="px-3 py-1 text-xs font-semibold rounded-full text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed" title="View Scorecard">Scorecard</button>
                            <button className="px-3 py-1 text-xs font-semibold rounded-full bg-white text-slate-800" title="Current: Slides">Slides</button>
                        </div>

                        <div className="border-l border-slate-600 h-6 mx-1 hidden sm:block"></div>

                        <button
                            onClick={handleDownloadSlideAsImage}
                            disabled={isLoading || isRegenerating || isExporting || isDownloadingImage}
                            className="p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download current slide as PNG"
                        >
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:inline">
                                {isDownloadingImage ? 'Saving...' : 'Save Slide'}
                            </span>
                        </button>
                        <button
                            onClick={handleExportPdf}
                            disabled={isLoading || isRegenerating || isExporting || isDownloadingImage}
                            className="p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Export as PDF"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:inline">
                                {isExporting ? 'Exporting...' : 'Export PDF'}
                            </span>
                        </button>
                        <button
                            onClick={onRegenerate}
                            disabled={isLoading || isExporting || isDownloadingImage}
                            className="p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Regenerate Presentation"
                        >
                            <RefreshIcon className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`} />
                             <span className="text-sm font-medium hidden sm:inline">
                                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                            </span>
                        </button>
                        <button onClick={onClose} title="Close" className="p-2 rounded-full text-slate-300 hover:bg-slate-700">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow p-2 sm:p-4 relative bg-slate-200 flex items-center justify-center">
                    <div className={`w-full max-w-4xl aspect-video transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        {slideshow && slideshow.length > 0 ? (
                            <div className="bg-white w-full h-full rounded-md shadow-inner overflow-hidden relative">
                                <div ref={slideRef} className="w-full h-full">
                                    {renderSlide(slideshow[currentSlideIndex])}
                                </div>
                            </div>
                        ) : (
                             <div className="flex w-full h-full items-center justify-center bg-white rounded-md">
                                <div className="text-center text-slate-500">
                                    <p>Could not load presentation.</p>
                                    <p className="text-sm">Try regenerating to fix this issue.</p>
                                </div>
                             </div>
                        )}
                    </div>
                    {(isLoading || isExporting || isDownloadingImage) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80">
                            <svg className="animate-spin h-10 w-10 text-red-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <h3 className="text-lg font-semibold text-slate-700">
                                {isExporting 
                                    ? 'Exporting PDF...' 
                                    : isDownloadingImage
                                    ? 'Saving Image...'
                                    : 'Generating Presentation...'}
                            </h3>
                            <p className="text-slate-500">
                                {isExporting 
                                    ? 'Please wait while we prepare your document.' 
                                    : isDownloadingImage
                                    ? 'Generating high-quality image...'
                                    : 'The AI is crafting your slideshow, please wait.'}
                            </p>
                        </div>
                    )}
                </div>

                {slideshow && slideshow.length > 0 && (
                    <div className="flex justify-between items-center p-4 border-t border-slate-200 flex-shrink-0">
                        <button onClick={handlePrev} disabled={currentSlideIndex === 0 || isLoading || isExporting} className="px-6 py-2 text-sm font-medium bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            Previous
                        </button>
                        <span className="text-sm text-slate-500">
                            Slide {currentSlideIndex + 1} of {slideshow.length}
                        </span>
                        <button onClick={handleNext} disabled={currentSlideIndex === slideshow.length - 1 || isLoading || isExporting} className="px-6 py-2 text-sm font-medium bg-red-600 text-white border border-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SlideshowModal;
