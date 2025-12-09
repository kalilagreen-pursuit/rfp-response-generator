import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Packer,
  AlignmentType,
  BorderStyle
} from 'docx';
import PDFDocument from 'pdfkit';

// Liceria Corporate branding colors
const COLORS = {
  primary: '#4A5859',      // Dark Teal - Primary text and headers
  accent: '#B8A88A',       // Gold/Tan - Accent color for secondary elements
};

interface ProposalContent {
  executiveSummary?: string;
  introduction?: string;
  technicalApproach?: any;
  timeline?: any;
  pricing?: any;
  qualifications?: any;
  riskManagement?: any;
  references?: string;
  conclusion?: string;
  sections?: Array<{
    title: string;
    content: string;
  }>;
  [key: string]: any;
}

// Helper to convert any value to readable text
const valueToText = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'string') return `• ${item}`;
      if (typeof item === 'object') {
        return Object.entries(item)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
      }
      return String(item);
    }).join('\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        if (Array.isArray(val)) {
          return `${label}:\n${valueToText(val)}`;
        }
        if (typeof val === 'object' && val !== null) {
          return `${label}:\n${valueToText(val)}`;
        }
        return `${label}: ${val}`;
      })
      .join('\n\n');
  }
  return String(value);
};

/**
 * Generate DOCX document from proposal content
 */
export async function generateDocx(
  title: string,
  content: ProposalContent,
  companyName?: string
): Promise<Buffer> {
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Company name if provided
  if (companyName) {
    children.push(
      new Paragraph({
        text: `Prepared by: ${companyName}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );
  }

  // Date
  children.push(
    new Paragraph({
      text: `Date: ${new Date().toLocaleDateString()}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 }
    })
  );

  // Standard sections matching the proposal structure
  const standardSections = [
    { key: 'executiveSummary', title: 'Executive Summary' },
    { key: 'introduction', title: 'Introduction' },
    { key: 'valueProposition', title: 'Value Proposition' },
    { key: 'technicalApproach', title: 'Technical Approach' },
    { key: 'qualifications', title: 'Qualifications' },
    { key: 'timeline', title: 'Project Timeline' },
    { key: 'projectTimeline', title: 'Project Timeline' },
    { key: 'pricing', title: 'Pricing' },
    { key: 'investmentEstimate', title: 'Investment Estimate' },
    { key: 'resources', title: 'Resources' },
    { key: 'riskManagement', title: 'Risk Management' },
    { key: 'references', title: 'References' },
    { key: 'questionsForClient', title: 'Questions for Client' },
    { key: 'conclusion', title: 'Conclusion' }
  ];

  for (const section of standardSections) {
    if (content[section.key]) {
      children.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      // Convert content to text (handles objects, arrays, strings)
      const textContent = valueToText(content[section.key]);

      // Split content by paragraphs
      const paragraphs = textContent.split('\n\n');
      for (const para of paragraphs) {
        if (para.trim()) {
          // Handle bullet points
          const lines = para.trim().split('\n');
          for (const line of lines) {
            children.push(
              new Paragraph({
                children: [new TextRun(line)],
                spacing: { after: 100 }
              })
            );
          }
        }
      }
    }
  }

  // Custom sections array
  if (content.sections && Array.isArray(content.sections)) {
    for (const section of content.sections) {
      children.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      const paragraphs = String(section.content).split('\n\n');
      for (const para of paragraphs) {
        if (para.trim()) {
          children.push(
            new Paragraph({
              children: [new TextRun(para.trim())],
              spacing: { after: 200 }
            })
          );
        }
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

/**
 * Render Investment Estimate section matching template exactly
 */
function renderInvestmentEstimate(
  doc: any,
  investmentData: any,
  pageWidth: number,
  companyName?: string,
  dateGenerated?: string
) {
  // Extract investment range
  const low = investmentData.low || investmentData.lowCost || 0;
  const high = investmentData.high || investmentData.highCost || 0;
  const breakdown = investmentData.breakdown || [];

  // Draw tan color block for investment range
  const blockHeight = 100;
  const blockStartY = doc.y;
  doc.rect(doc.page.margins.left, blockStartY, pageWidth, blockHeight)
     .fillColor(COLORS.accent)
     .fill();

  // Total Investment Range heading (white text on tan background)
  doc.fontSize(14).fillColor('#FFFFFF').font('Helvetica');
  doc.text('Total Investment Range', doc.page.margins.left + 20, blockStartY + 20, {
    align: 'left'
  });

  // Investment amount - 28pt bold white text
  doc.fontSize(28).fillColor('#FFFFFF').font('Helvetica-Bold');
  doc.text(`$${low.toLocaleString()} - $${high.toLocaleString()}`, doc.page.margins.left + 20, blockStartY + 45, {
    align: 'left'
  });

  // Move past the color block
  doc.y = blockStartY + blockHeight + 20;

  // Explanation paragraph
  doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica');
  doc.text(
    'This investment estimate reflects a comprehensive analysis of project requirements, resource allocation, and timeline considerations. The range accounts for varying levels of complexity and potential scope adjustments during implementation.',
    {
      align: 'left',
      width: pageWidth,
      lineGap: 5
    }
  );
  doc.moveDown(0.25); // 0.3 inch = 21.6pt, approximately 0.25 inches

  // Cost Breakdown heading
  doc.fontSize(14).fillColor(COLORS.primary).font('Helvetica-Bold');
  doc.text('Cost Breakdown', { align: 'left' });
  doc.moveDown(0.14); // 0.1 inch = 7.2pt

  // Cost breakdown table (no borders, no background colors)
  if (breakdown.length > 0) {
    const tableStartY = doc.y;
    const rowHeight = 25;
    let currentY = tableStartY;

    // Table header
    doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica-Bold');
    doc.text('Category', doc.page.margins.left, currentY + 8, { width: 288 }); // 4 inches = 288pt
    doc.text('Cost Range', doc.page.margins.left + 288, currentY + 8, { width: 144 }); // 2 inches = 144pt
    currentY += rowHeight;

    // Table rows
    breakdown.forEach((item: any) => {
      const category = item.category || item.component || 'Category';
      const lowCost = item.low || item.lowCost || 0;
      const highCost = item.high || item.highCost || 0;

      // Check for page break
      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        addPageHeader(doc, companyName, dateGenerated, pageWidth);
        currentY = doc.page.margins.top + 72; // 1 inch from top
        doc.y = currentY;
      }

      doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica');
      doc.text(category, doc.page.margins.left, currentY + 8, { width: 288 });
      doc.text(
        `$${lowCost.toLocaleString()} - $${highCost.toLocaleString()}`,
        doc.page.margins.left + 288,
        currentY + 8,
        { width: 144 }
      );
      currentY += rowHeight;
    });

    doc.y = currentY;
  }
}

/**
 * Helper to add page header (company name + date)
 */
function addPageHeader(doc: any, companyName?: string, dateGenerated?: string, pageWidth?: number) {
  const pageW = pageWidth || (doc.page.width - doc.page.margins.left - doc.page.margins.right);
  doc.fontSize(9).fillColor(COLORS.accent).font('Helvetica');
  if (companyName) {
    doc.text(companyName, doc.page.margins.left, 36); // 0.5 inches = 36pt
  }
  if (dateGenerated) {
    doc.text(dateGenerated, doc.page.margins.left, 36, {
      align: 'right',
      width: pageW
    });
  }
}

/**
 * Render Resources section matching template exactly
 */
function renderResources(
  doc: any,
  resourcesData: any,
  pageWidth: number,
  companyName?: string,
  dateGenerated?: string
) {
  // Handle different data structures
  let resources: any[] = [];

  if (Array.isArray(resourcesData)) {
    resources = resourcesData;
  } else if (resourcesData && typeof resourcesData === 'object') {
    // Try to extract array from common property names
    resources = resourcesData.resources ||
                resourcesData.resource ||
                resourcesData.teamMembers ||
                resourcesData.team ||
                [];

    // If still empty, check if the object itself looks like a resource object with nested data
    if (resources.length === 0 && Object.keys(resourcesData).length > 0) {
      // Check if it has properties that suggest it contains resource data
      const possibleArrayKeys = Object.keys(resourcesData).filter(key =>
        Array.isArray(resourcesData[key]) && resourcesData[key].length > 0
      );

      if (possibleArrayKeys.length > 0) {
        // Use the first array we find
        resources = resourcesData[possibleArrayKeys[0]];
        console.log(`renderResources - Found resources under key: ${possibleArrayKeys[0]}`);
      }
    }
  }

  // Debug logging
  console.log('renderResources - resourcesData:', JSON.stringify(resourcesData, null, 2));
  console.log('renderResources - extracted resources array:', JSON.stringify(resources, null, 2));
  console.log('renderResources - resources length:', resources.length);

  if (!Array.isArray(resources) || resources.length === 0) {
    console.log('renderResources - No valid resources array found, showing fallback message');
    doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica');
    doc.text('Resource allocation will be determined based on project scope and timeline.');
    return;
  }

  // Introductory text
  doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica');
  doc.text(
    'Our proposed team structure leverages experienced professionals to deliver exceptional results:',
    { 
      align: 'left', 
      width: pageWidth,
      lineGap: 5 
    }
  );
  doc.moveDown(0.17); // 0.2 inch = 14.4pt

  // Table setup with exact column widths from template
  // Column 1: 2.5 inches (180pt), Column 2: 0.8 inches (57.6pt), Column 3: 1.35 inches (97.2pt), Column 4: 1.35 inches (97.2pt)
  const colWidths = {
    role: 180,      // 2.5 inches
    hours: 58,     // 0.8 inches
    lowRate: 97,   // 1.35 inches
    highRate: 97,  // 1.35 inches
  };
  const rowHeight = 25;
  const tableStartY = doc.y;
  let currentY = tableStartY;

  console.log('renderResources - Table start Y position:', currentY);
  console.log('renderResources - Page margins:', doc.page.margins);

  // Table header (no background color, no borders)
  doc.fontSize(10).fillColor(COLORS.primary).font('Helvetica-Bold');
  
  // Render header using absolute positioning
  const headerY = currentY + 6; // 6pt padding from top of row
  doc.text('Role', doc.page.margins.left, headerY, { 
    width: colWidths.role,
    continued: false
  });
  doc.text('Hours', doc.page.margins.left + colWidths.role, headerY, { 
    width: colWidths.hours,
    continued: false
  });
  doc.text('Rate Range (Low)', doc.page.margins.left + colWidths.role + colWidths.hours, headerY, { 
    width: colWidths.lowRate,
    continued: false
  });
  doc.text('Rate Range (High)', doc.page.margins.left + colWidths.role + colWidths.hours + colWidths.lowRate, headerY, { 
    width: colWidths.highRate,
    continued: false
  });
  
  currentY += rowHeight;

  // Table rows (no alternating colors, no borders)
  resources.forEach((resource: any, index: number) => {
    const role = resource.role || 'Team Member';
    const hours = resource.hours || 0;
    const lowRate = resource.lowRate || 0;
    const highRate = resource.highRate || 0;

    console.log(`renderResources - Processing resource ${index + 1}:`, {
      role,
      hours,
      lowRate,
      highRate,
      resource
    });

    // Check for page break
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      addPageHeader(doc, companyName, dateGenerated, pageWidth);
      currentY = doc.page.margins.top + 72; // 1 inch from top
      doc.y = currentY;
    }

    // Render table row
    doc.fontSize(10).fillColor(COLORS.primary).font('Helvetica');
    
    // Role column
    doc.text(role, doc.page.margins.left, currentY + 6, { 
      width: colWidths.role,
      continued: false
    });
    
    // Hours column
    doc.text(String(hours), doc.page.margins.left + colWidths.role, currentY + 6, { 
      width: colWidths.hours,
      continued: false
    });
    
    // Rate Range (Low) column
    doc.text(`$${lowRate.toLocaleString()}/hr`, doc.page.margins.left + colWidths.role + colWidths.hours, currentY + 6, { 
      width: colWidths.lowRate,
      continued: false
    });
    
    // Rate Range (High) column
    doc.text(`$${highRate.toLocaleString()}/hr`, doc.page.margins.left + colWidths.role + colWidths.hours + colWidths.lowRate, currentY + 6, { 
      width: colWidths.highRate,
      continued: false
    });
    
    currentY += rowHeight;
  });

  // Role Responsibilities section - ALWAYS start on a new page
  doc.addPage();
  addPageHeader(doc, companyName, dateGenerated, pageWidth);
  doc.y = doc.page.margins.top + 72; // 1 inch from top

  // Role Responsibilities heading
  doc.fontSize(14).fillColor(COLORS.primary).font('Helvetica-Bold');
  doc.text('Role Responsibilities', doc.page.margins.left, doc.y, {
    align: 'left',
    width: pageWidth
  });
  doc.moveDown(0.14); // 0.1 inch = 7.2pt

  // Role descriptions
  resources.forEach((resource: any) => {
    const role = resource.role || 'Team Member';
    const responsibilities = resource.responsibilities ||
                            resource.description ||
                            `Responsible for ${role.toLowerCase()} duties and deliverables throughout the project lifecycle. Collaborates with cross-functional teams to ensure quality deliverables and timely project completion.`;

    // Check for page break
    const roleText = `${role} – ${responsibilities}`;
    const estimatedHeight = doc.heightOfString(roleText, {
      width: pageWidth,
      lineGap: 5
    });

    if (doc.y + estimatedHeight > doc.page.height - doc.page.margins.bottom - 30) {
      doc.addPage();
      addPageHeader(doc, companyName, dateGenerated, pageWidth);
      doc.y = doc.page.margins.top + 72; // 1 inch from top
    }

    // Role name in bold
    doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica-Bold');
    doc.text(role, doc.page.margins.left, doc.y, {
      continued: true,
      width: pageWidth
    });

    // Responsibilities in regular font
    doc.fontSize(11).font('Helvetica');
    doc.text(` – ${responsibilities}`, {
      lineGap: 5,
      width: pageWidth
    });
    doc.moveDown(1); // 12pt spacing after each role
  });
}

/**
 * Generate PDF document from proposal content matching exact template
 */
export async function generatePdf(
  title: string,
  content: ProposalContent,
  companyName?: string,
  companyEmail?: string,
  companyPhone?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Template margins: Top 1 inch (72pt), Left/Right 0.75 inch (54pt), Bottom 0.75 inch (54pt)
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 72, bottom: 54, left: 54, right: 54 },
        bufferPages: true,
        autoFirstPage: true
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const dateGenerated = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      // === PAGE 1: TITLE PAGE ===
      // NO header on title page
      // 2.5 inches (180pt) of whitespace from top
      doc.y = 180;

      // "Project Proposal" - 57pt bold (matching template)
      doc.fontSize(57).fillColor(COLORS.primary).font('Helvetica-Bold');
      doc.text('Project', { align: 'left' });
      doc.moveDown(0.2);
      doc.text('Proposal', { align: 'left' });
      doc.moveDown(1.5);

      // Project title - 18pt accent color
      doc.fontSize(18).fillColor(COLORS.accent).font('Helvetica');
      doc.text(title || 'Project Name', { align: 'left' });

      // Color block at bottom of page with "Prepared by"
      const blockHeight = 150;
      const blockY = doc.page.height - blockHeight;
      doc.rect(0, blockY, doc.page.width, blockHeight)
         .fillColor('#4A5859')
         .fill();

      // "Prepared by:" text in color block
      doc.fontSize(11).fillColor('#FFFFFF').font('Helvetica');
      doc.text('Prepared by:', doc.page.margins.left, blockY + 40, {
        align: 'left'
      });
      doc.moveDown(0.5);

      // Company name in white
      doc.fontSize(18).fillColor('#FFFFFF').font('Helvetica-Bold');
      doc.text(companyName || 'Company Name', {
        align: 'left'
      });

      // === PAGE 2: TABLE OF CONTENTS ===
      doc.addPage();
      addPageHeader(doc, companyName, dateGenerated, pageWidth);

      // 1 inch from top of page content area (72pt + 36pt header = 108pt)
      doc.y = doc.page.margins.top + 72;

      // TOC title - 24pt bold
      doc.fontSize(24).fillColor(COLORS.primary).font('Helvetica-Bold');
      doc.text('Table of Contents', { align: 'left' });
      doc.y += 36; // 0.5 inch spacing

      // TOC entries - Fixed order per template
      const tocSections = [
        { num: '01', title: 'Executive Summary', key: 'executiveSummary' },
        { num: '02', title: 'Value Proposition', key: 'valueProposition' },
        { num: '03', title: 'Technical Approach', key: 'technicalApproach' },
        { num: '04', title: 'Project Timeline', key: 'projectTimeline' },
        { num: '05', title: 'Investment Estimate', key: 'investmentEstimate' },
        { num: '06', title: 'Resources', key: 'resources' },
        { num: '07', title: 'Questions for Client', key: 'questionsForClient' }
      ];

      tocSections.forEach((section) => {
        // Only show if content exists
        if (content[section.key] || section.key === 'projectTimeline' && content.timeline) {
          doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica');
          doc.text(`${section.num} ${section.title}`, { align: 'left' });
          doc.y += 12; // 12pt spacing between entries
        }
      });

      // === PAGE 3: SECTION 01 - EXECUTIVE SUMMARY ===
      if (content.executiveSummary) {
        doc.addPage();
        addPageHeader(doc, companyName, dateGenerated, pageWidth);
        doc.y = doc.page.margins.top + 72; // 1 inch from top

        // Section number - 48pt bold
        doc.fontSize(48).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('01', { align: 'left' });
        doc.y += 8; // 8pt spacing

        // Section title - 24pt bold
        doc.fontSize(24).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('Executive Summary', { align: 'left' });
        doc.y += 20; // 20pt spacing

        // Content - 11pt, 16pt line height
        doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica');
        const execSummary = typeof content.executiveSummary === 'string' 
          ? content.executiveSummary 
          : valueToText(content.executiveSummary);
        const execParagraphs = execSummary.split(/\n\n+/);
        execParagraphs.forEach((para: string) => {
          if (para.trim()) {
            if (doc.y + 50 > doc.page.height - doc.page.margins.bottom) {
              doc.addPage();
              addPageHeader(doc, companyName, dateGenerated, pageWidth);
              doc.y = doc.page.margins.top + 72;
            }
            doc.text(para.trim(), {
              align: 'left',
              width: pageWidth,
              lineGap: 5,
              paragraphGap: 12
            });
            doc.y += 12; // 12pt spacing after paragraph
          }
        });
      }

      // === PAGE 4: SECTION 02 - VALUE PROPOSITION ===
      if (content.valueProposition) {
        doc.addPage();
        addPageHeader(doc, companyName, dateGenerated, pageWidth);
        doc.y = doc.page.margins.top + 72;

        doc.fontSize(48).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('02', { align: 'left' });
        doc.y += 8;

        doc.fontSize(24).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('Value Proposition', { align: 'left' });
        doc.y += 20;

        doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica');
        const valueProp = typeof content.valueProposition === 'string'
          ? content.valueProposition
          : valueToText(content.valueProposition);
        const valueParagraphs = valueProp.split(/\n\n+/);
        valueParagraphs.forEach((para: string) => {
          if (para.trim()) {
            if (doc.y + 50 > doc.page.height - doc.page.margins.bottom) {
              doc.addPage();
              addPageHeader(doc, companyName, dateGenerated, pageWidth);
              doc.y = doc.page.margins.top + 72;
            }
            doc.text(para.trim(), {
              align: 'left',
              width: pageWidth,
              lineGap: 5,
              paragraphGap: 12
            });
            doc.y += 12;
          }
        });
      }

      // === PAGE 5: SECTION 03 - TECHNICAL APPROACH ===
      if (content.technicalApproach) {
        doc.addPage();
        addPageHeader(doc, companyName, dateGenerated, pageWidth);
        doc.y = doc.page.margins.top + 72;

        doc.fontSize(48).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('03', { align: 'left' });
        doc.y += 8;

        doc.fontSize(24).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('Technical Approach', { align: 'left' });
        doc.y += 20;

        doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica');
        const techApproach = typeof content.technicalApproach === 'string'
          ? content.technicalApproach
          : valueToText(content.technicalApproach);
        const techParagraphs = techApproach.split(/\n\n+/);
        techParagraphs.forEach((para: string) => {
          if (para.trim()) {
            if (doc.y + 50 > doc.page.height - doc.page.margins.bottom) {
              doc.addPage();
              addPageHeader(doc, companyName, dateGenerated, pageWidth);
              doc.y = doc.page.margins.top + 72;
            }
            doc.text(para.trim(), {
              align: 'left',
              width: pageWidth,
              lineGap: 5,
              paragraphGap: 12
            });
            doc.y += 12;
          }
        });
      }

      // === PAGE 6: SECTION 04 - PROJECT TIMELINE ===
      const timelineContent = content.projectTimeline || content.timeline;
      if (timelineContent) {
        doc.addPage();
        addPageHeader(doc, companyName, dateGenerated, pageWidth);
        doc.y = doc.page.margins.top + 72;

        doc.fontSize(48).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('04', { align: 'left' });
        doc.y += 8;

        doc.fontSize(24).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('Project Timeline', { align: 'left' });
        doc.y += 20;

        doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica');
        const timeline = typeof timelineContent === 'string'
          ? timelineContent
          : valueToText(timelineContent);
        const timelineParagraphs = timeline.split(/\n\n+/);
        timelineParagraphs.forEach((para: string) => {
          if (para.trim()) {
            if (doc.y + 50 > doc.page.height - doc.page.margins.bottom) {
              doc.addPage();
              addPageHeader(doc, companyName, dateGenerated, pageWidth);
              doc.y = doc.page.margins.top + 72;
            }
            doc.text(para.trim(), {
              align: 'left',
              width: pageWidth,
              lineGap: 5,
              paragraphGap: 12
            });
            doc.y += 12;
          }
        });
      }

      // === PAGE 7: SECTION 05 - INVESTMENT ESTIMATE ===
      const investmentContent = content.investmentEstimate || content.pricing;
      if (investmentContent) {
        doc.addPage();
        addPageHeader(doc, companyName, dateGenerated, pageWidth);
        doc.y = doc.page.margins.top + 72;

        doc.fontSize(48).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('05', { align: 'left' });
        doc.y += 8;

        doc.fontSize(24).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('Investment Estimate', { align: 'left' });
        doc.y += 20;

        renderInvestmentEstimate(doc, investmentContent, pageWidth, companyName, dateGenerated);
      }

      // === PAGES 8-9: SECTION 06 - RESOURCES ===
      // Check for resources in multiple possible locations
      const resourcesData = content.resources ||
                           content.resource ||
                           content.teamResources ||
                           content.teamMembers ||
                           content.team ||
                           null;

      console.log('generatePdf - Checking for resources:', {
        'content keys': Object.keys(content),
        'content.resources': content.resources,
        'content.resource': content.resource,
        'content.teamResources': content.teamResources,
        'content.teamMembers': content.teamMembers,
        'resourcesData': resourcesData,
        'isArray': Array.isArray(resourcesData),
        'type': typeof resourcesData
      });

      if (resourcesData) {
        doc.addPage();
        addPageHeader(doc, companyName, dateGenerated, pageWidth);
        doc.y = doc.page.margins.top + 72;

        doc.fontSize(48).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('06', { align: 'left' });
        doc.y += 8;

        doc.fontSize(24).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('Resources', { align: 'left' });
        doc.y += 20;

        renderResources(doc, resourcesData, pageWidth, companyName, dateGenerated);
      } else {
        console.log('generatePdf - No resources data found, skipping Resources section');
      }

      // === PAGE 10: SECTION 07 - QUESTIONS FOR CLIENT ===
      if (content.questionsForClient && Array.isArray(content.questionsForClient)) {
        doc.addPage();
        addPageHeader(doc, companyName, dateGenerated, pageWidth);
        doc.y = doc.page.margins.top + 72;

        doc.fontSize(48).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('07', { align: 'left' });
        doc.y += 8;

        doc.fontSize(24).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text('Questions for Client', { align: 'left' });
        doc.y += 20;

        doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica');
        content.questionsForClient.forEach((question: string) => {
          if (doc.y + 30 > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            addPageHeader(doc, companyName, dateGenerated, pageWidth);
            doc.y = doc.page.margins.top + 72;
          }
          doc.text(`• ${question}`, {
            align: 'left',
            width: pageWidth,
            lineGap: 5
          });
          doc.y += 8; // 8pt spacing after each question
        });
      }

      // === PAGE 11: FINAL PAGE ===
      doc.addPage();
      addPageHeader(doc, companyName, dateGenerated, pageWidth);

      // 3 inches (216pt) of whitespace from top
      doc.y = doc.page.margins.top + 216;

      // "Let's Work Together" - 57pt bold matching template
      doc.fontSize(57).fillColor(COLORS.primary).font('Helvetica-Bold');
      doc.text("Let's Work", { align: 'left' });
      doc.moveDown(0.2);
      doc.text('Together', { align: 'left' });

      // Color block at bottom of page
      const finalBlockHeight = 200;
      const finalBlockY = doc.page.height - finalBlockHeight;
      doc.rect(0, finalBlockY, doc.page.width, finalBlockHeight)
         .fillColor('#4A5859')
         .fill();

      // "Contact Us" heading in white
      doc.fontSize(24).fillColor('#FFFFFF').font('Helvetica-Bold');
      doc.text('Contact Us', doc.page.margins.left, finalBlockY + 40, {
        align: 'left'
      });
      doc.moveDown(0.5);

      // Contact information in white
      doc.fontSize(14).fillColor('#FFFFFF').font('Helvetica');
      doc.text(companyName || 'Company Name', {
        align: 'left'
      });

      // Add email if available
      if (companyEmail) {
        doc.moveDown(0.3);
        doc.text(companyEmail, {
          align: 'left'
        });
      }

      // Add phone if available
      if (companyPhone) {
        doc.moveDown(0.3);
        doc.text(companyPhone, {
          align: 'left'
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
