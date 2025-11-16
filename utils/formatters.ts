import type { ProjectFolder } from '../types';

export const formatCurrency = (amount: number): string => 
    new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);

export const formatProposalForDownload = (folder: ProjectFolder): string => {
    const { proposal } = folder;
    
    let content = `PROJECT PROPOSAL: ${proposal.projectName}\n`;
    content += `==================================================\n`;
    content += `Original RFP: ${folder.rfpFileName}\n`;
    content += `Submitted by: Shaun Coggins Inc.\n`;
    if (proposal.contactPerson || proposal.contactDepartment) {
        const contactLine = `Contact: ${proposal.contactPerson || ''}${proposal.contactPerson && proposal.contactDepartment ? ', ' : ''}${proposal.contactDepartment || ''}`;
        content += `${contactLine.trim()}\n`;
    }
    content += `Date: ${new Date(folder.generatedDate).toLocaleDateString()}\n\n`;

    content += `EXECUTIVE SUMMARY\n-------------------\n${proposal.executiveSummary}\n\n`;
    content += `TECHNICAL APPROACH\n-------------------\n${proposal.technicalApproach}\n\n`;
    
    content += `RESOURCE REQUIREMENTS\n-----------------------\n`;
    const tableHeader = `| Role                          | Hours | Rate/Hour (Low-High) | Total (Low-High)          |\n`;
    const tableBorder = `|-------------------------------|-------|----------------------|---------------------------|\n`;
    content += tableHeader;
    content += tableBorder;
    proposal.resources.forEach(res => {
        const role = res.role.padEnd(29);
        const hours = String(res.hours).padEnd(5);
        const rateRange = `${formatCurrency(res.lowRate)} - ${formatCurrency(res.highRate)}`.padEnd(20);
        const totalRange = `${formatCurrency(res.hours * res.lowRate)} - ${formatCurrency(res.hours * res.highRate)}`.padEnd(25);
        content += `| ${role} | ${hours} | ${rateRange} | ${totalRange} |\n`;
    });
    content += `\n`;

    const formattedTimeline = proposal.projectTimeline.split(/(?=Phase \d+:)/g).filter(p => p.trim()).join('\n');
    content += `PROJECT TIMELINE\n------------------\n${formattedTimeline}\n\n`;

    content += `INVESTMENT ESTIMATE\n---------------------\n`;
    content += `Low Estimate:  ${formatCurrency(proposal.investmentEstimate.low)}\n`;
    content += `High Estimate: ${formatCurrency(proposal.investmentEstimate.high)}\n\n`;
    content += `Cost Breakdown:\n`;
    const longestComponent = Math.max(0, ...proposal.investmentEstimate.breakdown.map(item => item.component.length));
    proposal.investmentEstimate.breakdown.forEach(item => {
        const component = item.component.padEnd(longestComponent);
        const costRange = `${formatCurrency(item.lowCost)} - ${formatCurrency(item.highCost)}`;
        content += `- ${component} : ${costRange}\n`;
    });
    content += `\n`;

    content += `VALUE PROPOSITION & ROI\n-------------------------\n${proposal.valueProposition}\n`;
    
    if (proposal.questionsForClient && proposal.questionsForClient.length > 0) {
        content += `\nCLARIFYING QUESTIONS\n----------------------\n`;
        proposal.questionsForClient.forEach(q => {
            content += `- ${q}\n`;
        });
    }

    return content;
};