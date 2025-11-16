
import type { IndustryPlaybook } from '../types';

type PlaybookTemplate = Omit<IndustryPlaybook, 'id' | 'name' | 'learnedPreferences'>;

export const playbookTemplates: Record<string, PlaybookTemplate> = {
  techSoftware: {
    glossary: [
      { id: '', term: 'SaaS', definition: 'Software as a Service' },
      { id: '', term: 'PaaS', definition: 'Platform as a Service' },
      { id: '', term: 'API', definition: 'Application Programming Interface' },
      { id: '', term: 'Agile', definition: 'An iterative approach to project management and software development.' },
      { id: '', term: 'DevOps', definition: 'A set of practices that combines software development and IT operations.' },
    ],
    kpis: ['Time to Market', 'User Adoption Rate', 'Scalability', 'Total Cost of Ownership (TCO)'],
    complianceProfiles: [
      { id: '', name: 'SOC 2 Compliance', description: 'A standard for managing customer data based on five "trust service principles"—security, availability, processing integrity, confidentiality, and privacy.' },
      { id: '', name: 'ISO 27001', description: 'An international standard for information security management.' },
    ],
    customSections: [
      { id: '', sectionName: 'Integration Plan', sectionPrompt: 'Describe the strategy and timeline for integrating the proposed solution with the client\'s existing systems.' },
      { id: '', sectionName: 'Data Security and Privacy', sectionPrompt: 'Detail the measures that will be taken to ensure data security, privacy, and compliance with relevant regulations.' },
    ]
  },
  construction: {
    glossary: [
      { id: '', term: 'RFI', definition: 'Request for Information' },
      { id: '', term: 'Submittal', definition: 'Shop drawings, material data, samples, and product data required for a construction project.' },
      { id: '', term: 'LEED', definition: 'Leadership in Energy and Environmental Design, a green building certification program.' },
      { id: '', term: 'BIM', definition: 'Building Information Modeling, a digital representation of physical and functional characteristics of a facility.' },
    ],
    kpis: ['On-Time Completion', 'Budget Adherence', 'Safety Incident Rate', 'Quality of Workmanship'],
    complianceProfiles: [
      { id: '', name: 'OSHA Safety Standards', description: 'Compliance with Occupational Safety and Health Administration regulations to ensure a safe work environment.' },
      { id: '', name: 'Local Building Codes', description: 'Adherence to all municipal and state-level building codes and regulations for the project location.' },
    ],
    customSections: [
      { id: '', sectionName: 'Project Safety Plan', sectionPrompt: 'Outline the comprehensive safety plan for the project site, including protocols, training, and emergency procedures.' },
      { id: '', sectionName: 'Logistics and Site Management', sectionPrompt: 'Describe the plan for managing site logistics, including material delivery, storage, and site access.' },
    ]
  },
  procurement: {
    glossary: [
      { id: '', term: 'RFQ', definition: 'Request for Quotation' },
      { id: '', term: 'SLA', definition: 'Service Level Agreement' },
      { id: '', term: 'PO', definition: 'Purchase Order' },
      { id: '', term: 'TCO', definition: 'Total Cost of Ownership' },
    ],
    kpis: ['Cost Savings', 'Supplier Performance', 'Procurement Cycle Time', 'Contract Compliance'],
    complianceProfiles: [
      { id: '', name: 'Fair Trade Practices', description: 'Adherence to ethical standards and fair treatment of all suppliers in the procurement process.' },
      { id: '', name: 'Supplier Diversity Requirements', description: 'Meeting goals for including minority-owned, women-owned, or other disadvantaged business enterprises in the supply chain.' },
    ],
    customSections: [
      { id: '', sectionName: 'Supplier Vetting Process', sectionPrompt: 'Detail the methodology for evaluating and selecting qualified suppliers.' },
      { id: '', sectionName: 'Service Level Agreement (SLA) Terms', sectionPrompt: 'Define the proposed SLA, including key performance metrics, response times, and remedies for non-performance.' },
    ]
  },
  healthcareIT: {
    glossary: [
      { id: '', term: 'HIPAA', definition: 'Health Insurance Portability and Accountability Act' },
      { id: '', term: 'EHR', definition: 'Electronic Health Record' },
      { id: '', term: 'HL7', definition: 'Health Level Seven, a set of international standards for transfer of clinical and administrative data.' },
      { id: '', term: 'FHIR', definition: 'Fast Healthcare Interoperability Resources, a standard for exchanging healthcare information electronically.' },
    ],
    kpis: ['Improved Patient Outcomes', 'Reduced Administrative Overhead', 'Data Security and Privacy', 'Interoperability with Existing Systems'],
    complianceProfiles: [
      { id: '', name: 'HIPAA Privacy and Security Rules', description: 'Ensuring the confidentiality, integrity, and availability of all protected health information (PHI).' },
    ],
    customSections: [
      { id: '', sectionName: 'HIPAA Compliance Statement', sectionPrompt: 'Provide a detailed statement on how the solution will comply with all relevant HIPAA rules and protect patient data.' },
      { id: '', sectionName: 'Integration with Existing EHR', sectionPrompt: 'Describe the technical plan for seamlessly integrating with the client\'s current Electronic Health Record system.' },
    ]
  },
  digitalMarketing: {
    glossary: [
        { id: '', term: 'SEO', definition: 'Search Engine Optimization' },
        { id: '', term: 'PPC', definition: 'Pay-Per-Click advertising' },
        { id: '', term: 'CTR', definition: 'Click-Through Rate' },
        { id: '', term: 'CAC', definition: 'Customer Acquisition Cost' },
    ],
    kpis: ['Lead Generation Growth', 'Conversion Rate Optimization', 'Return on Ad Spend (ROAS)', 'Brand Awareness Lift'],
    complianceProfiles: [
        { id: '', name: 'CAN-SPAM Act', description: 'Compliance with U.S. law for commercial email, setting rules for messaging and giving recipients the right to have you stop emailing them.' },
        { id: '', name: 'GDPR', description: 'General Data Protection Regulation, for handling personal data of individuals in the European Union.' },
    ],
    customSections: [
        { id: '', sectionName: 'Campaign Strategy and Timeline', sectionPrompt: 'Outline the proposed marketing campaign strategy, key channels to be used, and a detailed timeline for execution.' },
        { id: '', sectionName: 'Target Audience Analysis', sectionPrompt: 'Provide an analysis of the target audience personas and how the campaign will be tailored to reach them effectively.' },
    ]
  },
  financialServices: {
    glossary: [
        { id: '', term: 'KYC', definition: 'Know Your Customer' },
        { id: '', term: 'AML', definition: 'Anti-Money Laundering' },
        { id: '', term: 'PCI DSS', definition: 'Payment Card Industry Data Security Standard' },
        { id: '', term: 'Fintech', definition: 'Financial Technology' },
    ],
    kpis: ['Transaction Success Rate', 'Fraud Reduction', 'Regulatory Compliance', 'Customer Lifetime Value (LTV)'],
    complianceProfiles: [
        { id: '', name: 'PCI DSS Compliance', description: 'Adherence to the security standards for organizations that handle branded credit cards from the major card schemes.' },
        { id: '', name: 'AML and KYC Regulations', description: 'Implementation of processes to prevent money laundering and verify customer identities.' },
    ],
    customSections: [
        { id: '', sectionName: 'Security and Fraud Prevention', sectionPrompt: 'Detail the multi-layered security architecture and fraud detection mechanisms that will be implemented.' },
        { id: '', sectionName: 'Regulatory Compliance Approach', sectionPrompt: 'Describe the approach to maintaining compliance with all relevant financial regulations, including reporting and auditing.' },
    ]
  },
  governmentContracting: {
    glossary: [
        { id: '', term: 'FedRAMP', definition: 'Federal Risk and Authorization Management Program' },
        { id: '', term: 'CMMC', definition: 'Cybersecurity Maturity Model Certification' },
        { id: '', term: 'FAR', definition: 'Federal Acquisition Regulation' },
        { id: '', term: 'SOW', definition: 'Statement of Work' },
    ],
    kpis: ['Mission Success', 'Cost-Effectiveness for Taxpayers', 'Adherence to FAR clauses', 'Security Compliance'],
    complianceProfiles: [
        { id: '', name: 'FedRAMP Authorization', description: 'Meeting the security requirements for cloud service providers that work with the U.S. government.' },
        { id: '', name: 'CMMC Certification', description: 'Achieving the required Cybersecurity Maturity Model Certification level for handling Department of Defense (DoD) information.' },
    ],
    customSections: [
        { id: '', sectionName: 'Statement of Work (SOW) Compliance Matrix', sectionPrompt: 'Provide a detailed matrix that maps each requirement from the SOW to a specific section of the proposal, demonstrating full compliance.' },
        { id: '', sectionName: 'Past Performance References', sectionPrompt: 'List relevant past performance references on similar government contracts, including contact information and project summaries.' },
    ]
  },
};
