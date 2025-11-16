

import jsPDF from 'jspdf';
import type { ProjectFolder, Resource, Slide, Whitepaper } from '../types';
import { formatCurrency } from './formatters';

// --- PDF Generation Constants ---
const PAGE_WIDTH = 210; // A4 portrait
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const BRAND_COLOR_RED = '#D91A2A';
const BRAND_COLOR_DARK = '#19224C';
const TEXT_COLOR_DARK = '#1F2937';
const TEXT_COLOR_LIGHT = '#6B7280';
const GREEN_TEXT = '#15803d';
const AMBER_TEXT = '#b45309';
const FONT_BOLD = 'helvetica-bold';
const FONT_NORMAL = 'helvetica';

const addSlideTemplate = (doc: jsPDF, slide: Slide, pageNumber: number, totalPages: number) => {
    // Footer
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(TEXT_COLOR_LIGHT);
    doc.text('Shaun Coggins Inc. | Confidential', MARGIN, PAGE_HEIGHT - 10);
    doc.text(`Page ${pageNumber} of ${totalPages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
    
    // Header
    doc.setFont(FONT_BOLD, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(TEXT_COLOR_DARK);
    const titleLines = doc.splitTextToSize(slide.title, CONTENT_WIDTH);
    doc.text(titleLines, MARGIN, MARGIN + 10);
    
    // Header underline
    doc.setDrawColor(BRAND_COLOR_RED);
    doc.setLineWidth(0.75);
    const titleHeight = (titleLines.length - 1) * 8;
    doc.line(MARGIN, MARGIN + 12 + titleHeight, MARGIN + 80, MARGIN + 12 + titleHeight);
};

const renderTitleSlide = (doc: jsPDF, slide: Slide) => {
    doc.setFillColor(BRAND_COLOR_DARK);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    
    doc.setFont(FONT_BOLD, 'bold');
    doc.setFontSize(36);
    doc.setTextColor('#FFFFFF');
    doc.text(slide.title, PAGE_WIDTH / 2, PAGE_HEIGHT / 2 - 10, { align: 'center' });

    if (slide.subtitle) {
        doc.setFont(FONT_NORMAL, 'normal');
        doc.setFontSize(20);
        doc.setTextColor('#D1D5DB');
        doc.text(slide.subtitle, PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 5, { align: 'center' });
    }
};

const renderSummarySlide = (doc: jsPDF, slide: Slide, pageNumber: number, totalPages: number) => {
    addSlideTemplate(doc, slide, pageNumber, totalPages);
    
    if (slide.points) {
        let yPos = MARGIN + 40;
        doc.setFontSize(12);
        doc.setTextColor(TEXT_COLOR_DARK);

        slide.points.forEach(point => {
            doc.setTextColor(BRAND_COLOR_RED);
            doc.setFont(FONT_BOLD, 'bold');
            doc.text('✓', MARGIN + 5, yPos);

            doc.setTextColor(TEXT_COLOR_DARK);
            doc.setFont(FONT_NORMAL, 'normal');
            const lines = doc.splitTextToSize(point, CONTENT_WIDTH - 20);
            doc.text(lines, MARGIN + 15, yPos);
            yPos += lines.length * 7 + 8; // Increased spacing
        });
    }
};

const renderSolutionSlide = (doc: jsPDF, slide: Slide, pageNumber: number, totalPages: number) => {
    addSlideTemplate(doc, slide, pageNumber, totalPages);

    const halfWidth = CONTENT_WIDTH / 2 - 10;
    let yPos = MARGIN + 40;
    
    // Key Features
    doc.setFont(FONT_BOLD, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(TEXT_COLOR_DARK);
    doc.text('Key Features', MARGIN, yPos);
    yPos += 10;
    
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(11);
    slide.key_features?.forEach(feature => {
        doc.setTextColor(BRAND_COLOR_DARK);
        doc.text('›', MARGIN + 3, yPos);
        doc.setTextColor(TEXT_COLOR_DARK);
        const lines = doc.splitTextToSize(feature, halfWidth - 10);
        doc.text(lines, MARGIN + 10, yPos);
        yPos += lines.length * 5 + 4;
    });

    // Conceptual Architecture
    const rightColX = MARGIN + CONTENT_WIDTH / 2 + 10;
    doc.setFillColor('#F3F4F6');
    doc.roundedRect(rightColX - 5, MARGIN + 30, halfWidth + 10, 100, 3, 3, 'F');
    
    doc.setFont(FONT_BOLD, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(TEXT_COLOR_DARK);
    doc.text('Conceptual Architecture', rightColX, MARGIN + 40);
    
    doc.setFont(FONT_NORMAL, 'italic');
    doc.setFontSize(11);
    doc.setTextColor(TEXT_COLOR_LIGHT);
    const diagLines = doc.splitTextToSize(slide.diagram_description || '', halfWidth);
    doc.text(diagLines, rightColX, MARGIN + 50);
};

const renderInvestmentSlide = (doc: jsPDF, slide: Slide, folder: ProjectFolder, pageNumber: number, totalPages: number) => {
    addSlideTemplate(doc, slide, pageNumber, totalPages);
    
    const est = folder.proposal.investmentEstimate;
    let yPos = MARGIN + 45;

    doc.setFontSize(12);
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setTextColor(TEXT_COLOR_DARK);
    const introLines = doc.splitTextToSize('Based on the project scope, we estimate the total investment to be in the following range:', CONTENT_WIDTH);
    doc.text(introLines, MARGIN, yPos);
    yPos += introLines.length * 7 + 15;

    const boxWidth = CONTENT_WIDTH / 2 - 10;
    // Low Estimate Box
    doc.setFillColor('#F0FDF4');
    doc.setDrawColor('#BBF7D0');
    doc.roundedRect(MARGIN, yPos, boxWidth, 30, 3, 3, 'FD');
    doc.setFontSize(10);
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setTextColor(TEXT_COLOR_LIGHT);
    doc.text('Low Estimate (Optimistic)', MARGIN + 5, yPos + 8);
    doc.setFontSize(22);
    doc.setFont(FONT_BOLD, 'bold');
    doc.setTextColor(GREEN_TEXT);
    doc.text(formatCurrency(est.low), MARGIN + 5, yPos + 20);

    // High Estimate Box
    const rightColX = MARGIN + boxWidth + 20;
    doc.setFillColor('#FFFBEB');
    doc.setDrawColor('#FDE68A');
    doc.roundedRect(rightColX, yPos, boxWidth, 30, 3, 3, 'FD');
    doc.setFontSize(10);
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setTextColor(TEXT_COLOR_LIGHT);
    doc.text('High Estimate (Includes Contingency)', rightColX + 5, yPos + 8);
    doc.setFontSize(22);
    doc.setFont(FONT_BOLD, 'bold');
    doc.setTextColor(AMBER_TEXT);
    doc.text(formatCurrency(est.high), rightColX + 5, yPos + 20);
};

const renderConfidenceSlide = (doc: jsPDF, slide: Slide, pageNumber: number, totalPages: number) => {
    addSlideTemplate(doc, slide, pageNumber, totalPages);

    let yPos = MARGIN + 60;
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(14);
    doc.setTextColor(TEXT_COLOR_LIGHT);
    doc.text('Our Confidence Score', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 30;

    doc.setFontSize(60);
    doc.setFont(FONT_BOLD, 'bold');
    doc.setTextColor(GREEN_TEXT);
    doc.text(`${slide.score}`, PAGE_WIDTH / 2, yPos, { align: 'center' });

    doc.setFontSize(20);
    doc.setTextColor(TEXT_COLOR_LIGHT);
    doc.text('/100', PAGE_WIDTH / 2 + doc.getTextWidth(`${slide.score}`) / 2 + 5, yPos);
    yPos += 30;
    
    doc.setFont(FONT_NORMAL, 'italic');
    doc.setFontSize(12);
    doc.setTextColor(TEXT_COLOR_DARK);
    const quoteLines = doc.splitTextToSize(`"${slide.quote}"`, CONTENT_WIDTH - 40);
    doc.text(quoteLines, PAGE_WIDTH / 2, yPos, { align: 'center' });
};

const renderNextStepsSlide = (doc: jsPDF, slide: Slide, pageNumber: number, totalPages: number) => {
    addSlideTemplate(doc, slide, pageNumber, totalPages);

    if (slide.steps) {
        let yPos = MARGIN + 45;
        doc.setFontSize(12);
        
        slide.steps.forEach((step, index) => {
            const [title, ...rest] = step.split(':');
            const description = rest.join(':').trim();

            doc.setTextColor(TEXT_COLOR_DARK);
            doc.setFont(FONT_BOLD, 'bold');
            doc.text(`${index + 1}. ${title}:`, MARGIN, yPos);
            
            doc.setFont(FONT_NORMAL, 'normal');
            doc.setTextColor(TEXT_COLOR_LIGHT);
            const lines = doc.splitTextToSize(description, CONTENT_WIDTH - 20);
            doc.text(lines, MARGIN + 5, yPos + 7);
            
            yPos += lines.length * 6 + 15;
        });
    }
};

const renderKeyDifferentiatorsSlide = (doc: jsPDF, slide: Slide, pageNumber: number, totalPages: number) => {
    addSlideTemplate(doc, slide, pageNumber, totalPages);
    
    if (slide.points && slide.points.length > 0) {
        const numPoints = slide.points.length;
        const colWidth = (CONTENT_WIDTH - (numPoints - 1) * 10) / numPoints;
        let xPos = MARGIN;
        const yPos = MARGIN + 60;

        slide.points.forEach(point => {
            const [title, ...description] = point.split(':');

            doc.setFont(FONT_BOLD, 'bold');
            doc.setFontSize(14);
            doc.setTextColor(BRAND_COLOR_RED);
            doc.text(title.trim(), xPos + colWidth / 2, yPos, { align: 'center' });

            doc.setFont(FONT_NORMAL, 'normal');
            doc.setFontSize(10);
            doc.setTextColor(TEXT_COLOR_DARK);
            const descLines = doc.splitTextToSize(description.join(':').trim(), colWidth - 10);
            doc.text(descLines, xPos + colWidth / 2, yPos + 10, { align: 'center' });
            
            xPos += colWidth + 10;
        });
    }
};

const renderClientTestimonialsSlide = (doc: jsPDF, slide: Slide, pageNumber: number, totalPages: number) => {
    addSlideTemplate(doc, slide, pageNumber, totalPages);

    const yPos = PAGE_HEIGHT / 2 - 20;

    doc.setFont(FONT_NORMAL, 'italic');
    doc.setFontSize(16);
    doc.setTextColor(TEXT_COLOR_DARK);
    const quoteLines = doc.splitTextToSize(`"${slide.quote}"`, CONTENT_WIDTH - 40);
    doc.text(quoteLines, PAGE_WIDTH / 2, yPos, { align: 'center' });

    if (slide.quote_source) {
        doc.setFont(FONT_BOLD, 'bold');
        doc.setFontSize(12);
        doc.setTextColor(TEXT_COLOR_LIGHT);
        const yOffset = yPos + quoteLines.length * 7 + 10;
        doc.text(`— ${slide.quote_source}`, PAGE_WIDTH / 2, yOffset, { align: 'center' });
    }
};


export const exportSlideshowToPdf = async (projectFolder: ProjectFolder) => {
    if (!projectFolder.slideshow) {
        throw new Error("Slideshow data is missing.");
    }
    
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    
    // Switch width/height for landscape
    const tempWidth = PAGE_WIDTH;
    const landscapePageWidth = PAGE_HEIGHT;
    const landscapePageHeight = tempWidth;

    const totalPages = projectFolder.slideshow.length;

    projectFolder.slideshow.forEach((slide, index) => {
        if (index > 0) {
            doc.addPage();
        }
        
        const pageNumber = index + 1;
        
        switch (slide.type) {
            case 'title':
                renderTitleSlide(doc, slide);
                break;
            case 'summary':
                renderSummarySlide(doc, slide, pageNumber, totalPages);
                break;
            case 'solution':
                renderSolutionSlide(doc, slide, pageNumber, totalPages);
                break;
            case 'investment':
                renderInvestmentSlide(doc, slide, projectFolder, pageNumber, totalPages);
                break;
            case 'confidence':
                renderConfidenceSlide(doc, slide, pageNumber, totalPages);
                break;
            case 'next_steps':
                renderNextStepsSlide(doc, slide, pageNumber, totalPages);
                break;
            case 'key_differentiators':
                renderKeyDifferentiatorsSlide(doc, slide, pageNumber, totalPages);
                break;
            case 'client_testimonials':
                renderClientTestimonialsSlide(doc, slide, pageNumber, totalPages);
                break;
            default:
                addSlideTemplate(doc, slide, pageNumber, totalPages);
                doc.text('Unsupported slide type.', MARGIN, MARGIN + 40);
                break;
        }
    });

    doc.save(`Presentation - ${projectFolder.proposal.projectName.replace(/\s/g, '_')}.pdf`);
};

// --- Proposal PDF Generation ---

class PdfProposalGenerator {
    private doc: jsPDF;
    private y: number;
    private pageNumber: number;

    constructor() {
        this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        this.y = MARGIN;
        this.pageNumber = 1;
    }

    private checkPageBreak(neededSpace: number) {
        if (this.y + neededSpace > PAGE_HEIGHT - MARGIN) {
            this.addPageFooter();
            this.doc.addPage();
            this.pageNumber++;
            this.y = MARGIN;
            this.addPageHeader();
        }
    }

    private addPageHeader() {
        this.doc.setFont(FONT_NORMAL, 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(TEXT_COLOR_LIGHT);
        this.doc.text('Project Proposal', MARGIN, MARGIN - 5);
        this.doc.line(MARGIN, MARGIN - 2, PAGE_WIDTH - MARGIN, MARGIN - 2);
    }

    private addPageFooter() {
        this.doc.setFont(FONT_NORMAL, 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(TEXT_COLOR_LIGHT);
        this.doc.text('Shaun Coggins Inc. | Confidential', MARGIN, PAGE_HEIGHT - 10);
        // Page number is added at the end once total is known
    }

    private addSectionTitle(title: string) {
        const titleHeight = 15;
        this.checkPageBreak(this.y + titleHeight > PAGE_HEIGHT - MARGIN ? titleHeight + 10 : titleHeight);
        
        this.doc.setFont(FONT_BOLD, 'bold');
        this.doc.setFontSize(16);
        this.doc.setTextColor(TEXT_COLOR_DARK);
        this.doc.text(title, MARGIN, this.y);
        this.y += 8;

        this.doc.setDrawColor(BRAND_COLOR_RED);
        this.doc.setLineWidth(0.5);
        this.doc.line(MARGIN, this.y, MARGIN + 60, this.y);
        this.y += 8;
    }

    private addParagraph(text: string) {
        this.doc.setFont(FONT_NORMAL, 'normal');
        this.doc.setFontSize(11);
        this.doc.setTextColor(TEXT_COLOR_DARK);
        const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH);
        const textHeight = lines.length * 6; // Approx height
        
        this.checkPageBreak(textHeight);
        
        this.doc.text(lines, MARGIN, this.y);
        this.y += textHeight + 5;
    }
    
    private addBulletList(items: string[]) {
        this.doc.setFont(FONT_NORMAL, 'normal');
        this.doc.setFontSize(11);
        this.doc.setTextColor(TEXT_COLOR_DARK);

        items.forEach(item => {
            const lines = this.doc.splitTextToSize(item, CONTENT_WIDTH - 8);
            const itemHeight = lines.length * 6;
            this.checkPageBreak(itemHeight + 4);
            
            this.doc.text('•', MARGIN, this.y);
            this.doc.text(lines, MARGIN + 5, this.y);
            this.y += itemHeight + 4;
        });
        this.y += 5;
    }
    
    private addResourcesTable(resources: Resource[]) {
        const head = [['Role', 'Hours', 'Rate/Hour', 'Total Cost']];
        const body = resources.map(res => [
            res.role,
            String(res.hours),
            `${formatCurrency(res.lowRate)} - ${formatCurrency(res.highRate)}`,
            `${formatCurrency(res.hours * res.lowRate)} - ${formatCurrency(res.hours * res.highRate)}`
        ]);

        // Dynamically import jspdf-autotable to keep initial bundle small
        import('jspdf-autotable').then(({ default: autoTable }) => {
            this.checkPageBreak(20); // Check for header space
            autoTable(this.doc, {
                head,
                body,
                startY: this.y,
                theme: 'grid',
                headStyles: { fillColor: BRAND_COLOR_DARK, textColor: '#FFFFFF' },
                styles: { fontSize: 9 },
                didDrawPage: () => {
                    this.addPageHeader();
                },
                didParseCell: (data) => {
                     if (data.column.index > 0 && data.section === 'body') {
                        data.cell.styles.halign = 'right';
                    }
                }
            });
            // autotable doesn't update the original doc's y-pos, so we get it from the table
            this.y = (this.doc as any).lastAutoTable.finalY + 10;
        }).catch(e => {
            console.error("Could not load jspdf-autotable", e);
            this.addParagraph("Error: Could not display resources table. The 'jspdf-autotable' library failed to load.");
        });
    }

    public generate(projectFolder: ProjectFolder) {
        const { proposal, generatedDate } = projectFolder;
        // --- TITLE PAGE ---
        this.doc.setFillColor(BRAND_COLOR_DARK);
        this.doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
        
        this.doc.setFont(FONT_BOLD, 'bold');
        this.doc.setFontSize(28);
        this.doc.setTextColor('#FFFFFF');
        this.doc.text('Project Proposal', PAGE_WIDTH / 2, PAGE_HEIGHT / 2 - 20, { align: 'center' });

        this.doc.setFontSize(20);
        this.doc.text(proposal.projectName, PAGE_WIDTH / 2, PAGE_HEIGHT / 2 - 5, { align: 'center' });

        this.doc.setFont(FONT_NORMAL, 'normal');
        this.doc.setFontSize(12);
        this.doc.setTextColor('#D1D5DB');
        this.doc.text(`Prepared for: ${proposal.contactPerson || 'Valued Client'}`, PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 20, { align: 'center' });
        this.doc.text(`Date: ${new Date(generatedDate).toLocaleDateString()}`, PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 28, { align: 'center' });
        this.doc.text('Prepared by: Shaun Coggins Inc.', PAGE_WIDTH / 2, PAGE_HEIGHT - 30, { align: 'center' });
        
        // --- CONTENT PAGES ---
        this.doc.addPage();
        this.pageNumber++;
        this.y = MARGIN;
        this.addPageHeader();

        this.addSectionTitle('Executive Summary');
        this.addParagraph(proposal.executiveSummary);

        this.addSectionTitle('Technical Approach');
        this.addParagraph(proposal.technicalApproach);
        
        this.addSectionTitle('Resource Requirements');
        this.addResourcesTable(proposal.resources);

        this.addSectionTitle('Project Timeline');
        this.addParagraph(proposal.projectTimeline.split(/(?=Phase \d+:)/g).filter(p => p.trim()).join('\n'));

        this.addSectionTitle('Investment Estimate');
        const investmentText = `Low Estimate: ${formatCurrency(proposal.investmentEstimate.low)}\nHigh Estimate: ${formatCurrency(proposal.investmentEstimate.high)}`;
        this.addParagraph(investmentText);

        this.addSectionTitle('Value Proposition & ROI');
        this.addParagraph(proposal.valueProposition);

        if (proposal.questionsForClient && proposal.questionsForClient.length > 0) {
            this.addSectionTitle('Clarifying Questions');
            this.addBulletList(proposal.questionsForClient);
        }
        
        // --- FINAL PAGE NUMBERING ---
        const totalPages = this.doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            this.doc.setPage(i);
            this.addPageFooter();
            this.doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
        }
        
        this.doc.save(`Proposal - ${proposal.projectName.replace(/\s/g, '_')}.pdf`);
    }
}

export const exportProposalToPdf = async (projectFolder: ProjectFolder) => {
    const generator = new PdfProposalGenerator();
    generator.generate(projectFolder);
};


export const exportTimelineToPdf = async (projectFolder: ProjectFolder) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Header
    doc.setFont(FONT_BOLD, 'bold');
    doc.setFontSize(24);
    doc.setTextColor(BRAND_COLOR_DARK);
    doc.text('Project Timeline', margin, margin + 5);

    doc.setFontSize(14);
    doc.setTextColor(TEXT_COLOR_LIGHT);
    doc.text(projectFolder.proposal.projectName, margin, margin + 15);
    
    // Header underline
    doc.setDrawColor(BRAND_COLOR_RED);
    doc.setLineWidth(0.75);
    doc.line(margin, margin + 18, pageW - margin, margin + 18);

    // Timeline content
    const phases = projectFolder.proposal.projectTimeline.split(/(?=Phase \d+:)/g).filter(p => p.trim());
    let yPos = margin + 40;

    doc.setFont(FONT_NORMAL, 'normal');
    phases.forEach((phase) => {
        const [title, ...rest] = phase.split(':');
        const description = rest.join(':').trim();

        doc.setFont(FONT_BOLD, 'bold');
        doc.setFontSize(12);
        doc.setTextColor(BRAND_COLOR_RED);
        doc.text(title.trim() + ':', margin, yPos);

        doc.setFont(FONT_NORMAL, 'normal');
        doc.setFontSize(11);
        doc.setTextColor(TEXT_COLOR_DARK);
        const lines = doc.splitTextToSize(description, pageW - margin * 2 - 25);
        doc.text(lines, margin + 25, yPos);
        
        yPos += lines.length * 6 + 10;

        if (yPos > pageH - margin) {
            doc.addPage();
            yPos = margin;
        }
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(TEXT_COLOR_LIGHT);
        doc.text(`Shaun Coggins Inc. | Project Timeline`, margin, pageH - 10);
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 10, { align: 'right' });
    }

    doc.save(`Timeline - ${projectFolder.proposal.projectName.replace(/\s/g, '_')}.pdf`);
};

export const exportWhitepaperToPdf = async (whitepaper: Whitepaper) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = MARGIN;

    const addPageBreakIfNeeded = (neededSpace: number) => {
        if (y + neededSpace > PAGE_HEIGHT - MARGIN) {
            doc.addPage();
            y = MARGIN;
        }
    };

    // --- TITLE PAGE ---
    doc.setFillColor(BRAND_COLOR_DARK);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    doc.setFont(FONT_BOLD, 'bold');
    doc.setFontSize(28);
    doc.setTextColor('#FFFFFF');
    const titleLines = doc.splitTextToSize(whitepaper.title, CONTENT_WIDTH - 20);
    doc.text(titleLines, PAGE_WIDTH / 2, PAGE_HEIGHT / 2 - 20, { align: 'center' });

    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(12);
    doc.setTextColor('#D1D5DB');
    doc.text('A Report by Shaun Coggins Inc.', PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 5, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 12, { align: 'center' });

    // --- CONTENT PAGES ---
    doc.addPage();
    y = MARGIN;
    
    const addSectionTitle = (title: string) => {
        addPageBreakIfNeeded(20);
        doc.setFont(FONT_BOLD, 'bold');
        doc.setFontSize(18);
        doc.setTextColor(BRAND_COLOR_DARK);
        doc.text(title, MARGIN, y);
        y += 8;
        doc.setDrawColor(BRAND_COLOR_RED);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, y, MARGIN + 60, y);
        y += 10;
    };

    const addParagraph = (text: string) => {
        doc.setFont(FONT_NORMAL, 'normal');
        doc.setFontSize(11);
        doc.setTextColor(TEXT_COLOR_DARK);
        const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
        const textHeight = lines.length * 6;
        addPageBreakIfNeeded(textHeight);
        doc.text(lines, MARGIN, y);
        y += textHeight + 6;
    };
    
    const addCaseStudy = (study: typeof whitepaper.caseStudies[0]) => {
        addPageBreakIfNeeded(40);
        doc.setFillColor('#F9FAFB');
        doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 10, 3, 3, 'F');
        doc.setFont(FONT_BOLD, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(BRAND_COLOR_RED);
        doc.text(study.anonymizedTitle, MARGIN + 5, y + 7);
        y += 15;
        
        const addSubheading = (title: string) => {
            doc.setFont(FONT_BOLD, 'bold');
            doc.setFontSize(11);
            doc.setTextColor(TEXT_COLOR_DARK);
            doc.text(title, MARGIN, y);
            y += 6;
        };

        addSubheading('The Challenge');
        addParagraph(study.challenge);

        addSubheading('The Solution');
        addParagraph(study.solution);
        
        addSubheading('The Outcome');
        addParagraph(study.outcome);
        
        // Stats
        const statsY = y;
        doc.setFont(FONT_BOLD, 'bold');
        doc.text('Investment:', MARGIN, statsY);
        doc.text('Timeline:', MARGIN + CONTENT_WIDTH / 2, statsY);
        
        doc.setFont(FONT_NORMAL, 'normal');
        doc.text(study.investmentRange, MARGIN + 30, statsY);
        doc.text(study.timeline, MARGIN + CONTENT_WIDTH / 2 + 25, statsY);
        y += 15;
    };


    // Build Document
    addSectionTitle('Introduction');
    addParagraph(whitepaper.introduction);

    addSectionTitle('Case Studies');
    whitepaper.caseStudies.forEach(study => {
        addCaseStudy(study);
    });
    
    addSectionTitle('Conclusion');
    addParagraph(whitepaper.conclusion);
    
    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        if (i > 1) { // No footer on title page
            doc.setFontSize(9);
            doc.setTextColor(TEXT_COLOR_LIGHT);
            doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: 'center' });
        }
    }

    doc.save(`Whitepaper - ${whitepaper.title.replace(/\s/g, '_')}.pdf`);
};