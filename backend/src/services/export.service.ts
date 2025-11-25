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

// Brand colors matching Liceria Corporate style
const COLORS = {
  primary: '#4A5859',      // Dark teal/gray
  accent: '#B8A88A',       // Muted gold/tan
  text: '#333333',         // Dark gray
  lightGray: '#666666',    // Secondary text
  tableHeader: '#3A4849',  // Darker for table headers
  tableAlt: '#F5F5F5',     // Light gray for alternating rows
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
 * Render Investment Estimate section with professional formatting
 */
function renderInvestmentEstimate(doc: any, investmentData: any, pageWidth: number) {
  // Extract investment range
  const low = investmentData.low || 0;
  const high = investmentData.high || 0;
  const breakdown = investmentData.breakdown || [];

  // Highlighted total range
  const boxY = doc.y;
  doc.rect(doc.page.margins.left, boxY, pageWidth, 60)
    .fill(COLORS.accent)
    .stroke();

  doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica');
  doc.text('Total Investment Range', doc.page.margins.left + 20, boxY + 15);
  doc.fontSize(20).font('Helvetica-Bold');
  doc.text(
    `$${low.toLocaleString()} - $${high.toLocaleString()}`,
    doc.page.margins.left + 20,
    boxY + 32
  );

  doc.moveDown(5);

  // Introductory paragraph
  doc.fontSize(11).fillColor(COLORS.text).font('Helvetica');
  doc.text(
    'This investment estimate reflects a comprehensive analysis of project requirements, resource allocation, and timeline considerations. The range accounts for varying levels of complexity and potential scope adjustments during implementation.',
    {
      align: 'left',
      lineGap: 5
    }
  );
  doc.moveDown(1.5);

  // Cost breakdown
  if (breakdown.length > 0) {
    doc.fontSize(14).fillColor(COLORS.primary).font('Helvetica-Bold');
    doc.text('Cost Breakdown', { align: 'left' });
    doc.moveDown(1);

    breakdown.forEach((item: any, index: number) => {
      const component = item.component || 'Component';
      const lowCost = item.lowCost || 0;
      const highCost = item.highCost || 0;
      const description = item.description || '';

      // Category name (bold)
      doc.fontSize(12).fillColor(COLORS.primary).font('Helvetica-Bold');
      doc.text(`${component}:`, { continued: true });

      // Cost range
      doc.fillColor(COLORS.accent).font('Helvetica');
      doc.text(` $${lowCost.toLocaleString()} - $${highCost.toLocaleString()}`);

      // Description if available
      if (description) {
        doc.fontSize(10).fillColor(COLORS.lightGray).font('Helvetica');
        doc.text(description, {
          indent: 20,
          lineGap: 3
        });
      }

      doc.moveDown(0.8);
    });
  }
}

/**
 * Render Resources section with professional table format
 */
function renderResources(doc: any, resourcesData: any, pageWidth: number) {
  const resources = Array.isArray(resourcesData) ? resourcesData : [];

  if (resources.length === 0) {
    doc.fontSize(11).fillColor(COLORS.text).font('Helvetica');
    doc.text('Resource allocation will be determined based on project scope and timeline.');
    return;
  }

  // Introductory text
  doc.fontSize(11).fillColor(COLORS.text).font('Helvetica');
  doc.text(
    'Our proposed team structure leverages experienced professionals to deliver exceptional results:',
    { align: 'left', lineGap: 5 }
  );
  doc.moveDown(1.5);

  // Table setup with adjusted column widths for better header alignment
  const tableTop = doc.y;
  const colWidths = {
    role: pageWidth * 0.32,
    hours: pageWidth * 0.13,
    lowRate: pageWidth * 0.24,
    highRate: pageWidth * 0.24,
  };
  const rowHeight = 35;
  let currentY = tableTop;

  // Table header
  doc.rect(doc.page.margins.left, currentY, pageWidth, rowHeight)
    .fill(COLORS.tableHeader);

  doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold');
  let currentX = doc.page.margins.left + 10;

  // Role column
  doc.text('Role', currentX, currentY + 12, { width: colWidths.role - 10, continued: false });
  currentX += colWidths.role;

  // Hours column
  doc.text('Hours', currentX, currentY + 12, { width: colWidths.hours - 10, continued: false });
  currentX += colWidths.hours;

  // Rate Range (Low) column
  doc.text('Rate Range (Low)', currentX + 5, currentY + 12, { width: colWidths.lowRate - 15, continued: false });
  currentX += colWidths.lowRate;

  // Rate Range (High) column - single line
  doc.text('Rate Range (High)', currentX + 5, currentY + 12, { width: colWidths.highRate - 15, continued: false });

  currentY += rowHeight;

  // Table rows
  resources.forEach((resource: any, index: number) => {
    const role = resource.role || 'Team Member';
    const hours = resource.hours || 0;
    const lowRate = resource.lowRate || 0;
    const highRate = resource.highRate || 0;

    // Alternating row colors
    if (index % 2 === 1) {
      doc.rect(doc.page.margins.left, currentY, pageWidth, rowHeight)
        .fill(COLORS.tableAlt);
    }

    doc.fontSize(10).fillColor(COLORS.text).font('Helvetica');
    currentX = doc.page.margins.left + 10;

    doc.text(role, currentX, currentY + 10, { width: colWidths.role, continued: false });
    currentX += colWidths.role;

    doc.text(String(hours), currentX, currentY + 10, { width: colWidths.hours, continued: false });
    currentX += colWidths.hours;

    doc.text(`$${lowRate.toLocaleString()}/hr`, currentX, currentY + 10, { width: colWidths.lowRate, continued: false });
    currentX += colWidths.lowRate;

    doc.text(`$${highRate.toLocaleString()}/hr`, currentX, currentY + 10, { width: colWidths.highRate, continued: false });

    currentY += rowHeight;
  });

  // Table border
  doc.rect(doc.page.margins.left, tableTop, pageWidth, currentY - tableTop)
    .stroke(COLORS.lightGray);

  // Reset cursor position to left margin for Role Responsibilities section
  doc.x = doc.page.margins.left;
  doc.y = currentY + 20;

  // Role Responsibilities section
  doc.fontSize(14).fillColor(COLORS.primary).font('Helvetica-Bold');
  doc.text('Role Responsibilities', doc.page.margins.left, doc.y, {
    align: 'left',
    width: pageWidth
  });
  doc.moveDown(1);

  // Professional role descriptions
  const roleDescriptions: { [key: string]: string } = {
    'Project Manager': 'Oversees all project phases from discovery through deployment, manages stakeholder communication with NYC DOC, ensures adherence to timelines and budget, coordinates cross-functional team efforts, and maintains compliance with all regulatory requirements including CJIS and NYC Cyber Command standards.',
    'Solution Architect': 'Designs the overall system architecture ensuring scalability, security, and integration capabilities with JMS, OMS, and NYS data exchanges. Establishes technical standards, evaluates technology choices, and provides strategic guidance on cloud infrastructure selection and implementation.',
    'Senior Full-Stack Developer': 'Architects and implements both frontend (React) and backend (Node.js) components, develops secure APIs for system integrations, ensures real-time notification delivery across multiple channels (SMS, email, mobile), and maintains code quality standards throughout the development lifecycle.',
    'UI/UX Designer': 'Creates intuitive, accessible interfaces compliant with ADA standards and multilingual requirements. Develops wireframes, interactive prototypes, and responsive designs that serve both victims seeking information and DOC administrators managing the system.',
    'QA Engineer': 'Implements comprehensive testing strategies including functional, integration, security, and performance testing. Conducts rigorous validation of notification accuracy, system reliability, and compliance with security protocols. Manages user acceptance testing and defect resolution.',
    'DevOps Engineer': 'Establishes CI/CD pipelines for secure deployment, manages cloud infrastructure on AWS/Azure/GCP, implements monitoring and alerting systems, ensures high availability and disaster recovery capabilities, and maintains system performance optimization.',
    'Security & Compliance Specialist': 'Ensures adherence to CJIS requirements, NYC Cyber Command standards, and data privacy laws. Conducts security audits, implements encryption protocols, manages access controls, and establishes security best practices throughout the development and deployment process.'
  };

  resources.forEach((resource: any) => {
    const role = resource.role || 'Team Member';

    // Try to get professional description, fall back to provided or generic
    let responsibilities = roleDescriptions[role] ||
                          resource.responsibilities ||
                          resource.description ||
                          `Responsible for ${role.toLowerCase()} duties and deliverables throughout the project lifecycle. Collaborates with cross-functional teams to ensure quality deliverables and timely project completion.`;

    // Reset X position to left margin for each role entry
    doc.x = doc.page.margins.left;

    doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica-Bold');
    doc.text(`${role}`, doc.page.margins.left, doc.y, {
      continued: true,
      width: pageWidth
    });

    doc.fontSize(11).fillColor(COLORS.text).font('Helvetica');
    doc.text(` – ${responsibilities}`, {
      lineGap: 5,
      width: pageWidth
    });
    doc.moveDown(1);
  });
}

/**
 * Generate PDF document from proposal content with professional branding
 */
export async function generatePdf(
  title: string,
  content: ProposalContent,
  companyName?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
        bufferPages: true
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      // === TITLE PAGE ===
      // Header with company name and date
      doc.fontSize(10).fillColor(COLORS.lightGray);
      if (companyName) {
        doc.text(companyName, doc.page.margins.left, 40);
      }
      doc.text(currentDate, doc.page.margins.left, 40, {
        align: 'right',
        width: pageWidth
      });

      // Main title - large and bold
      doc.moveDown(8);
      doc.fontSize(48).fillColor(COLORS.primary).font('Helvetica-Bold');
      doc.text('Project', { align: 'left' });
      doc.text('Proposal', { align: 'left' });

      // Subtitle/Project name
      doc.moveDown(1);
      doc.fontSize(16).fillColor(COLORS.accent).font('Helvetica');
      doc.text(title, { align: 'left' });

      // Footer area with prepared by info
      const footerY = doc.page.height - 150;
      doc.rect(doc.page.margins.left, footerY, pageWidth, 80)
        .fill(COLORS.primary);

      doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica');
      doc.text('Prepared by:', doc.page.margins.left + 20, footerY + 20);
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(companyName || 'Your Company', doc.page.margins.left + 20, footerY + 35);

      // === TABLE OF CONTENTS PAGE ===
      doc.addPage();

      // Page header
      doc.fontSize(10).fillColor(COLORS.lightGray).font('Helvetica');
      if (companyName) {
        doc.text(companyName, doc.page.margins.left, 40);
      }
      doc.text(currentDate, doc.page.margins.left, 40, {
        align: 'right',
        width: pageWidth
      });

      // TOC title
      doc.moveDown(4);
      doc.fontSize(28).fillColor(COLORS.primary).font('Helvetica-Bold');
      doc.text('Table of Contents', { align: 'left' });
      doc.moveDown(2);

      // Standard sections for TOC
      const standardSections = [
        { key: 'executiveSummary', title: 'Executive Summary', num: '01' },
        { key: 'introduction', title: 'Introduction', num: '02' },
        { key: 'valueProposition', title: 'Value Proposition', num: '03' },
        { key: 'technicalApproach', title: 'Technical Approach', num: '04' },
        { key: 'qualifications', title: 'Qualifications', num: '05' },
        { key: 'projectTimeline', title: 'Project Timeline', num: '06' },
        { key: 'timeline', title: 'Timeline', num: '06' },
        { key: 'investmentEstimate', title: 'Investment Estimate', num: '07' },
        { key: 'pricing', title: 'Pricing', num: '07' },
        { key: 'resources', title: 'Resources', num: '08' },
        { key: 'riskManagement', title: 'Risk Management', num: '09' },
        { key: 'questionsForClient', title: 'Questions for Client', num: '10' },
        { key: 'conclusion', title: 'Conclusion', num: '11' }
      ];

      // Build TOC entries
      let tocNum = 1;
      const sectionsWithContent: Array<{key: string, title: string, num: string}> = [];
      for (const section of standardSections) {
        if (content[section.key]) {
          const numStr = String(tocNum).padStart(2, '0');
          sectionsWithContent.push({ ...section, num: numStr });

          // TOC entry
          doc.fontSize(10).fillColor(COLORS.accent).font('Helvetica-Bold');
          doc.text(numStr, { continued: true });
          doc.fillColor(COLORS.text).font('Helvetica');
          doc.text(`   ${section.title}`);
          doc.moveDown(0.8);

          // Divider line
          doc.moveTo(doc.page.margins.left, doc.y)
            .lineTo(doc.page.margins.left + pageWidth, doc.y)
            .strokeColor(COLORS.lightGray)
            .lineWidth(0.5)
            .stroke();
          doc.moveDown(0.8);

          tocNum++;
        }
      }

      // === CONTENT PAGES ===
      let sectionIndex = 0;
      for (const section of sectionsWithContent) {
        if (content[section.key]) {
          doc.addPage();

          // Page header
          doc.fontSize(10).fillColor(COLORS.lightGray).font('Helvetica');
          if (companyName) {
            doc.text(companyName, doc.page.margins.left, 40);
          }
          doc.text(currentDate, doc.page.margins.left, 40, {
            align: 'right',
            width: pageWidth
          });

          // Section number
          doc.moveDown(4);
          doc.fontSize(24).fillColor(COLORS.accent).font('Helvetica-Bold');
          doc.text(section.num, { align: 'left' });

          // Section title
          doc.fontSize(28).fillColor(COLORS.primary).font('Helvetica-Bold');
          doc.text(section.title, { align: 'left' });
          doc.moveDown(1);

          // Special formatting for specific sections
          if (section.key === 'investmentEstimate' || section.key === 'pricing') {
            renderInvestmentEstimate(doc, content[section.key], pageWidth);
          } else if (section.key === 'resources') {
            renderResources(doc, content[section.key], pageWidth);
          } else {
            // Convert content to text for standard sections
            const textContent = valueToText(content[section.key]);

            // Section content
            doc.fontSize(11).fillColor(COLORS.text).font('Helvetica');
            doc.text(textContent, {
              align: 'left',
              lineGap: 6,
              paragraphGap: 10
            });
          }

          sectionIndex++;
        }
      }

      // Custom sections
      if (content.sections && Array.isArray(content.sections)) {
        for (const section of content.sections) {
          doc.addPage();

          // Page header
          doc.fontSize(10).fillColor(COLORS.lightGray).font('Helvetica');
          if (companyName) {
            doc.text(companyName, doc.page.margins.left, 40);
          }
          doc.text(currentDate, doc.page.margins.left, 40, {
            align: 'right',
            width: pageWidth
          });

          doc.moveDown(4);
          doc.fontSize(28).fillColor(COLORS.primary).font('Helvetica-Bold');
          doc.text(section.title, { align: 'left' });
          doc.moveDown(1);

          doc.fontSize(11).fillColor(COLORS.text).font('Helvetica');
          doc.text(String(section.content), {
            align: 'left',
            lineGap: 6
          });
        }
      }

      // === CLOSING PAGE ===
      doc.addPage();

      // Page header
      doc.fontSize(10).fillColor(COLORS.lightGray).font('Helvetica');
      if (companyName) {
        doc.text(companyName, doc.page.margins.left, 40);
      }
      doc.text(currentDate, doc.page.margins.left, 40, {
        align: 'right',
        width: pageWidth
      });

      // Closing message
      doc.moveDown(12);
      doc.fontSize(48).fillColor(COLORS.primary).font('Helvetica-Bold');
      doc.text("Let's Work", { align: 'left' });
      doc.text('Together', { align: 'left' });

      // Contact footer
      const closingFooterY = doc.page.height - 120;
      doc.rect(doc.page.margins.left, closingFooterY, pageWidth, 60)
        .fill(COLORS.primary);

      doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold');
      doc.text('Contact Us', doc.page.margins.left + 20, closingFooterY + 15);
      doc.fontSize(10).font('Helvetica');
      doc.text(companyName || 'Your Company', doc.page.margins.left + 20, closingFooterY + 32);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
