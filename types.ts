

export type View = 'dashboard' | 'projects' | 'resources' | 'profile' | 'calendar' | 'crm' | 'creativeStudio' | 'whitepaperStudio' | 'playbooks' | 'createProject' | 'invitations' | 'marketplace';

export type ProposalTemplate = 'standard' | 'creative' | 'technical';

export type SalesStage = 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed-Won' | 'Closed-Lost';

export type ActivityType = 'Call' | 'Email' | 'Meeting' | 'Note';

export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  date: string; // ISO string
  details: string;
}

export interface Resource {
  role: string;
  hours: number;
  lowRate: number;
  highRate: number;
  description?: string;
}

export interface TeamMember {
  id: string;
  role:string;
  lowRate: number;
  highRate: number;
  project: string;
  isSuggested?: boolean;
}

export interface InvestmentEstimate {
    low: number;
    high: number;
    breakdown: {
        component: string;
        lowCost: number;
        highCost: number;
    }[];
}

export interface CalendarEvent {
  title: string;
  date: string; // ISO string
}

export interface Proposal {
  projectName: string;
  executiveSummary: string;
  technicalApproach: string;
  resources: Resource[];
  projectTimeline: string;
  investmentEstimate: InvestmentEstimate;
  valueProposition: string;
  questionsForClient: string[];
  contactPerson?: string;
  contactDepartment?: string;
  contactEmail?: string;
  calendarEvents?: CalendarEvent[];
  // Allow for dynamic custom sections from playbooks
  [key: string]: any;
}

export interface Slide {
    type: 'title' | 'summary' | 'solution' | 'investment' | 'confidence' | 'next_steps' | 'key_differentiators' | 'client_testimonials';
    title: string;
    subtitle?: string;
    points?: string[];
    diagram_description?: string;
    key_features?: string[];
    chart_type?: 'bar_range';
    score?: number;
    quote?: string;
    steps?: string[];
    quote_source?: string;
}

export type Slideshow = Slide[];

export interface CrmTask {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string; // Optional due date as ISO string
}

export interface ProjectPhase {
  name: string;
  durationWeeks: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

export interface ChatPart {
    text: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: ChatPart[];
}

export interface VideoScriptScene {
    scene: number;
    visual: string;
    audio: string;
    imageUrl?: string;
    isGeneratingImage?: boolean;
}

export interface VideoScript {
    title: string;
    logline: string;
    scenes: VideoScriptScene[];
}

export interface RfpInsights {
    submissionDeadline?: string;
    keyObjectives: string[];
    budget?: string;
    requiredTechnologies?: string[];
    keyStakeholders?: string[];
}

export interface EmailDraft {
    recipient: string;
    subject: string;
    body: string;
}

export interface InternalNote {
  id: string;
  date: string; // ISO string
  content: string;
}

export interface ProjectFolder {
    id: string;
    folderName: string;
    rfpFileName: string;
    generatedDate: string;
    proposal: Proposal;
    rfpFileDataUrl: string;
    rfpContent?: string;
    scorecard?: Scorecard;
    slideshow?: Slideshow;
    videoScript?: VideoScript;
    templateId?: ProposalTemplate;
    teamId?: string; // ID of the team profile used for generation
    playbookId?: string; // ID of the playbook used for generation
    startDate?: string;
    endDate?: string;
    phases?: ProjectPhase[];
    crmTasks?: CrmTask[];
    
    // New CRM Fields
    salesStage: SalesStage;
    probability: number; // 0-100
    nextStepDate: string | null; // ISO string
    activityLog?: ActivityLogEntry[];

    // New AI Features
    useGoogleSearch?: boolean;
    chatHistory?: ChatMessage[];
    insights?: RfpInsights;
    internalNotes?: InternalNote[];
    internalNotesSummary?: string;
    videoPitchUrl?: string;
    isVideoGenerating?: boolean;
    videoGenerationOperationName?: string;
    leadScore?: number;
    leadScoreReasoning?: string;
}

export interface ProfileDocument {
  id: string;
  fileName: string;
  content: string;
  fileDataUrl: string;
}

export interface TeamProfile {
  id: string;
  name: string;
  capabilitiesStatement: ProfileDocument[];
  resume: ProfileDocument[];
}

export interface ProfileData {
  teams: TeamProfile[];
  smsNumber: string | null;
  companyName?: string;
}

export interface MissingResource {
    role: string;
    hours: number;
    lowRate: number;
    highRate: number;
    projectArea: string;
}

export interface ScorecardCriterion {
  name: string;
  score: number; // Score out of 10
  reasoning: string;
  missingResources?: MissingResource[];
}

export interface Scorecard {
  overallFitScore: number; // Score out of 100
  summary: string;
  criteria: ScorecardCriterion[];
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

export interface WhitepaperCaseStudy {
  originalProjectName: string;
  anonymizedTitle: string;
  challenge: string;
  solution: string;
  outcome: string;
  investmentRange: string;
  timeline: string;
}

export interface Whitepaper {
  title: string;
  introduction: string;
  caseStudies: WhitepaperCaseStudy[];
  conclusion: string;
}

export interface GlossaryItem {
  id: string;
  term: string;
  definition: string;
}

export interface ComplianceProfile {
  id: string;
  name: string;
  description: string;
}

export interface CustomSection {
  id: string;
  sectionName: string;
  sectionPrompt: string;
}

export interface LearnedPreference {
  id: string;
  sectionKey: string; // e.g., 'executiveSummary'
  preference: string; // The user's preferred text
}

export interface IndustryPlaybook {
  id: string;
  name: string;
  glossary: GlossaryItem[];
  kpis: string[];
  complianceProfiles: ComplianceProfile[];
  customSections: CustomSection[];
  learnedPreferences: LearnedPreference[];
}