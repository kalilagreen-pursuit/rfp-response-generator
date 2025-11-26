import { GoogleGenAI, Type } from "@google/genai";
// Fix: Added 'Slide' to the import list to resolve type error.
// Fix: Removed unused 'Profile' type from import to resolve error.
import type { ProjectFolder, Proposal, Scorecard, ProposalTemplate, Slideshow, ChatMessage, ActivityLogEntry, CrmTask, Slide, VideoScript, EmailDraft, InternalNote, Whitepaper, IndustryPlaybook } from '../types';
import { calculateProjectDatesAndPhases } from '../utils/timelineParser';
import { formatCurrency } from '../utils/formatters';

// Use the key defined by vite.config.ts for the browser environment.
const apiKey = process.env.API_KEY;

if (!apiKey) {
    throw new Error("API_KEY environment variable not set. This is configured in `vite.config.ts` from your `.env.local` file. Please ensure `GEMINI_API_KEY` is set in `.env.local` and the dev server is restarted.");
}

export const GEMINI_API_KEY = apiKey; // Export the validated key for direct use.
export const ai = new GoogleGenAI({ apiKey });

const handleGeminiError = (error: unknown): Error => {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
        const message = error.message?.toLowerCase() || '';

        if (message.includes('api key not valid')) {
            return new Error("Authentication error: The API key is not valid. Please ensure your `GEMINI_API_KEY` in the `.env.local` file is correct and restart the server.");
        }
        if (message.includes('safety policy') || message.includes('blocked')) {
            return new Error("Failed to generate content. The request was blocked due to safety concerns. Please adjust your prompt or settings.");
        }
        if (message.includes('fetch_error') || message.includes('network request failed')) {
            return new Error("A network error occurred. Please check your internet connection and try again.");
        }
        if (message.includes('500') || message.includes('503') || message.includes('service unavailable')) {
            return new Error("The Gemini API is currently unavailable or experiencing issues. Please try again later.");
        }
        return new Error(`An error occurred with the Gemini API: ${error.message}`);
    }
    
    return new Error("An unknown error occurred while communicating with the Gemini API.");
};

const proposalSchema = {
    type: Type.OBJECT,
    properties: {
        folderName: {
            type: Type.STRING,
            description: "A very short, 5-character alphanumeric project identifier or slug based on the project name. E.g., 'RFPGEN', 'AUTOS', 'WEB3D'. This should be concise and suitable for a folder name."
        },
        projectName: {
            type: Type.STRING,
            description: "A concise and professional project name based on the RFP content."
        },
        contactPerson: {
            type: Type.STRING,
            description: "The name of the main contact person or point of contact mentioned in the RFP, if available. If not mentioned, return null."
        },
        contactDepartment: {
            type: Type.STRING,
            description: "The name of the department for the main contact person mentioned in the RFP, if available. If not mentioned, return null."
        },
        contactEmail: {
            type: Type.STRING,
            description: "The email address of the main contact person mentioned in the RFP, if available. If not mentioned, return null."
        },
        executiveSummary: {
            type: Type.STRING,
            description: "A compelling executive summary written from the perspective of Shaun Coggins Inc. It should highlight the value proposition and understanding of the client's needs."
        },
        technicalApproach: {
            type: Type.STRING,
            description: "A summary of the technical approach and solution architecture Shaun Coggins Inc. will use. Mention key components like Document Processing, AI Generation, and Management Dashboard. Mention technologies like React, Node.js, and a cloud provider."
        },
        resources: {
            type: Type.ARRAY,
            description: "An array of required human resources to complete the project. Generate roles based on the RFP. For each role, estimate a reasonable industry-standard low and high hourly rate in USD, and provide a detailed description of their responsibilities.",
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING, description: "The role of the team member (e.g., Project Manager, Senior Developer)." },
                    hours: { type: Type.INTEGER, description: "Estimated total hours for this role." },
                    lowRate: { type: Type.INTEGER, description: "The estimated low-end industry-standard hourly rate for this role in USD." },
                    highRate: { type: Type.INTEGER, description: "The estimated high-end industry-standard hourly rate for this role in USD." },
                    description: { type: Type.STRING, description: "A detailed 2-3 sentence description of this role's key responsibilities and how they contribute to the project. Be specific to the project's needs." }
                },
                required: ["role", "hours", "lowRate", "highRate", "description"]
            }
        },
        projectTimeline: {
            type: Type.STRING,
            description: "A brief, high-level project timeline, outlining key phases and their estimated durations in weeks. (e.g., Phase 1: Foundation (4-6 weeks), Phase 2: AI Integration (6-8 weeks)...)"
        },
        investmentEstimate: {
            type: Type.OBJECT,
            properties: {
                low: { type: Type.INTEGER, description: "The low-end total estimated cost of the project in USD." },
                high: { type: Type.INTEGER, description: "The high-end total estimated cost of the project in USD, including a contingency." },
                breakdown: {
                    type: Type.ARRAY,
                    description: "A breakdown of the cost estimate into key components, providing a low and high range for each.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            component: { type: Type.STRING, description: "The cost component (e.g., Development Team, Third-party Services)." },
                            lowCost: { type: Type.INTEGER, description: "The low-end estimated cost for this component in USD." },
                            highCost: { type: Type.INTEGER, description: "The high-end estimated cost for this component in USD." }
                        },
                        required: ["component", "lowCost", "highCost"]
                    }
                }
            },
            required: ["low", "high", "breakdown"]
        },
        valueProposition: {
            type: Type.STRING,
            description: "A clear statement on the value proposition and expected ROI for the client, focusing on benefits like time savings, increased win rates, and cost reduction."
        },
        questionsForClient: {
            type: Type.ARRAY,
            description: "A list of 3-5 clarifying questions for the client based on ambiguities or missing information in the RFP. These questions should demonstrate thoroughness and expertise.",
            items: {
                type: Type.STRING
            }
        },
        insights: {
            type: Type.OBJECT,
            description: "A structured summary of key details extracted from the RFP.",
            properties: {
                submissionDeadline: { type: Type.STRING, description: "The submission deadline found in the RFP, in ISO 8601 format (YYYY-MM-DD). If not found, return null." },
                keyObjectives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the main objectives or goals the client wants to achieve." },
                budget: { type: Type.STRING, description: "Extract the specific budget amount or cost constraint mentioned in the RFP. Be very concise. For example, '$50,000', 'Not to exceed $100k', or 'Approximately 20,000 EUR'. Avoid including surrounding sentences. If no budget is mentioned, return null." },
                requiredTechnologies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of specific technologies or platforms mentioned as requirements." },
                keyStakeholders: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of names or roles of key stakeholders mentioned in the RFP." }
            },
            required: ["keyObjectives"]
        },
        calendarEvents: {
            type: Type.ARRAY,
            description: "An array of key dates, deadlines, and events extracted from the RFP. For each event, provide a descriptive title and the date in strict YYYY-MM-DD ISO 8601 format. Examples include 'Release of RFP', 'Submission of Written Questions Due', 'Closing Date for Receipt of Proposals'. If no dates are found, return an empty array.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the event or deadline." },
                    date: { type: Type.STRING, description: "The date of the event in YYYY-MM-DD format." }
                },
                required: ["title", "date"]
            }
        },
    },
    required: ["folderName", "projectName", "executiveSummary", "technicalApproach", "resources", "projectTimeline", "investmentEstimate", "valueProposition", "questionsForClient", "insights", "calendarEvents"]
};

const scorecardSchema = {
    type: Type.OBJECT,
    properties: {
        overallFitScore: {
            type: Type.INTEGER,
            description: "A holistic score from 0 to 100 representing how well this project aligns with the company's capabilities, experience, and technical skills. A higher score indicates a better fit."
        },
        summary: {
            type: Type.STRING,
            description: "A concise, 2-3 paragraph summary of the analysis. It should provide a high-level overview of the project's alignment with the company's profile."
        },
        criteria: {
            type: Type.ARRAY,
            description: "A detailed breakdown of the score based on specific criteria.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: {
                        type: Type.STRING,
                        description: "The name of the criterion being evaluated (e.g., 'Technical Alignment', 'Core Competency Match', 'Experience Relevance', 'Proposal Readability & Clarity')."
                    },
                    score: {
                        type: Type.INTEGER,
                        description: "A score from 0 to 10 for this specific criterion."
                    },
                    reasoning: {
                        type: Type.STRING,
                        description: "A brief, 1-2 sentence explanation for the assigned score, referencing specific examples from the provided documents."
                    },
                    missingResources: {
                        type: Type.ARRAY,
                        description: "An array of missing resource roles identified in the gap analysis. This should ONLY be populated for the 'Resource Gap Analysis' criterion. For each role, include estimates for hours, rates, and their project area focus.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                role: { type: Type.STRING, description: "The title of the missing role." },
                                hours: { type: Type.INTEGER, description: "An estimated number of hours this role would be needed for the project." },
                                lowRate: { type: Type.INTEGER, description: "The estimated low-end industry-standard hourly rate for this role in USD." },
                                highRate: { type: Type.INTEGER, description: "The estimated high-end industry-standard hourly rate for this role in USD." },
                                projectArea: { type: Type.STRING, description: "A brief description of what area of the project this role would focus on (e.g., 'AI Model Integration', 'Cloud Infrastructure Management')." }
                            },
                            required: ["role", "hours", "lowRate", "highRate", "projectArea"]
                        }
                    }
                },
                required: ["name", "score", "reasoning"]
            }
        }
    },
    required: ["overallFitScore", "summary", "criteria"]
};

const slideshowSchema = {
    type: Type.ARRAY,
    description: "An array of slide objects for a client-facing presentation.",
    items: {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, description: "The type of slide (e.g., 'title', 'summary', 'solution', 'investment', 'confidence', 'next_steps', 'key_differentiators', 'client_testimonials')." },
            title: { type: Type.STRING, description: "The main title or heading for the slide." },
            subtitle: { type: Type.STRING, description: "A subtitle, typically for the title slide." },
            points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of bullet points for the slide. Used for 'summary' and 'key_differentiators'." },
            diagram_description: { type: Type.STRING, description: "A textual description for a conceptual diagram on the solution slide." },
            key_features: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key features of the proposed solution." },
            chart_type: { type: Type.STRING, description: "The type of chart to visualize for the investment slide (e.g., 'bar_range')." },
            score: { type: Type.INTEGER, description: "The confidence score, derived from the scorecard's overallFitScore." },
            quote: { type: Type.STRING, description: "A compelling quote. Used for 'confidence' (from scorecard) or 'client_testimonials' (from capabilities)." },
            quote_source: { type: Type.STRING, description: "The source of the quote, used for 'client_testimonials'." },
            steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of next steps for the project." },
        },
        required: ["type", "title"]
    }
};

const proposalChatSchema = {
    type: Type.OBJECT,
    properties: {
        projectName: {
            type: Type.STRING,
            description: "A concise and professional project name based on the RFP content."
        },
        contactPerson: {
            type: Type.STRING,
            description: "The name of the main contact person or point of contact mentioned in the RFP, if available. If not mentioned, return null."
        },
        contactDepartment: {
            type: Type.STRING,
            description: "The name of the department for the main contact person mentioned in the RFP, if available. If not mentioned, return null."
        },
        contactEmail: {
            type: Type.STRING,
            description: "The email address of the main contact person mentioned in the RFP, if available. If not mentioned, return null."
        },
        executiveSummary: {
            type: Type.STRING,
            description: "A compelling executive summary written from the perspective of Shaun Coggins Inc. It should highlight the value proposition and understanding of the client's needs."
        },
        technicalApproach: {
            type: Type.STRING,
            description: "A summary of the technical approach and solution architecture Shaun Coggins Inc. will use. Mention key components like Document Processing, AI Generation, and Management Dashboard. Mention technologies like React, Node.js, and a cloud provider."
        },
        resources: {
            type: Type.ARRAY,
            description: "An array of required human resources to complete the project. Generate roles based on the RFP. For each role, estimate a reasonable industry-standard low and high hourly rate in USD, and provide a detailed description of their responsibilities.",
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING, description: "The role of the team member (e.g., Project Manager, Senior Developer)." },
                    hours: { type: Type.INTEGER, description: "Estimated total hours for this role." },
                    lowRate: { type: Type.INTEGER, description: "The estimated low-end industry-standard hourly rate for this role in USD." },
                    highRate: { type: Type.INTEGER, description: "The estimated high-end industry-standard hourly rate for this role in USD." },
                    description: { type: Type.STRING, description: "A detailed 2-3 sentence description of this role's key responsibilities and how they contribute to the project. Be specific to the project's needs." }
                },
                required: ["role", "hours", "lowRate", "highRate", "description"]
            }
        },
        projectTimeline: {
            type: Type.STRING,
            description: "A brief, high-level project timeline, outlining key phases and their estimated durations in weeks. (e.g., Phase 1: Foundation (4-6 weeks), Phase 2: AI Integration (6-8 weeks)...)"
        },
        investmentEstimate: {
            type: Type.OBJECT,
            properties: {
                low: { type: Type.INTEGER, description: "The low-end total estimated cost of the project in USD." },
                high: { type: Type.INTEGER, description: "The high-end total estimated cost of the project in USD, including a contingency." },
                breakdown: {
                    type: Type.ARRAY,
                    description: "A breakdown of the cost estimate into key components, providing a low and high range for each.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            component: { type: Type.STRING, description: "The cost component (e.g., Development Team, Third-party Services)." },
                            lowCost: { type: Type.INTEGER, description: "The low-end estimated cost for this component in USD." },
                            highCost: { type: Type.INTEGER, description: "The high-end estimated cost for this component in USD." }
                        },
                        required: ["component", "lowCost", "highCost"]
                    }
                }
            },
            required: ["low", "high", "breakdown"]
        },
        valueProposition: {
            type: Type.STRING,
            description: "A clear statement on the value proposition and expected ROI for the client, focusing on benefits like time savings, increased win rates, and cost reduction."
        },
        questionsForClient: {
            type: Type.ARRAY,
            description: "A list of 3-5 clarifying questions for the client based on ambiguities or missing information in the RFP. These questions should demonstrate thoroughness and expertise.",
            items: {
                type: Type.STRING
            }
        },
        calendarEvents: {
            type: Type.ARRAY,
            description: "An array of key dates, deadlines, and events extracted from the RFP. For each event, provide a descriptive title and the date in strict YYYY-MM-DD ISO 8601 format. If no dates are found, return an empty array.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the event or deadline." },
                    date: { type: Type.STRING, description: "The date of the event in YYYY-MM-DD format." }
                },
                required: ["title", "date"]
            }
        },
    },
    required: ["projectName", "executiveSummary", "technicalApproach", "resources", "projectTimeline", "investmentEstimate", "valueProposition", "questionsForClient"]
};

const suggestedCrmActionsSchema = {
    type: Type.ARRAY,
    description: "An array of 3-5 suggested next action strings.",
    items: { type: Type.STRING }
};

const videoScriptSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A catchy, creative title for a short commercial video.",
        },
        logline: {
            type: Type.STRING,
            description: "A one-sentence summary of the video's concept.",
        },
        scenes: {
            type: Type.ARRAY,
            description: "An array of scenes for the commercial, outlining the visual and audio components for each.",
            items: {
                type: Type.OBJECT,
                properties: {
                    scene: { type: Type.INTEGER, description: "The scene number, starting from 1." },
                    visual: { type: Type.STRING, description: "A detailed description of the visuals for this scene. Describe camera shots, actions, and on-screen text." },
                    audio: { type: Type.STRING, description: "A description of the audio, including any voiceover, dialogue, sound effects, or music cues." },
                },
                required: ["scene", "visual", "audio"],
            },
        },
    },
    required: ["title", "logline", "scenes"],
};

const leadScoreSchema = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.INTEGER,
            description: "A lead score from 0 to 100 based on the analysis."
        },
        reasoning: {
            type: Type.STRING,
            description: "A concise, 1-2 sentence explanation for the score, highlighting the key positive and negative factors."
        }
    },
    required: ["score", "reasoning"]
};

const whitepaperSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The main title of the whitepaper." },
        introduction: { type: Type.STRING, description: "A compelling introduction for the whitepaper." },
        caseStudies: {
            type: Type.ARRAY,
            description: "An array of anonymized case studies based on the provided projects.",
            items: {
                type: Type.OBJECT,
                properties: {
                    originalProjectName: { type: Type.STRING, description: "The original, non-anonymized project name for reference." },
                    anonymizedTitle: { type: Type.STRING, description: "A new, anonymous but descriptive title for the case study. E.g., 'AI-Powered Proposal System for a Financial Services Leader'." },
                    challenge: { type: Type.STRING, description: "A paragraph summarizing the client's initial challenges, based on the RFP." },
                    solution: { type: Type.STRING, description: "A paragraph detailing the solution provided by Shaun Coggins Inc., based on the proposal." },
                    outcome: { type: Type.STRING, description: "A paragraph describing the positive outcomes and value delivered. Focus on benefits like efficiency, accuracy, and win rates." },
                    investmentRange: { type: Type.STRING, description: "The investment range, formatted as a string. E.g., '$150,000 - $200,000'." },
                    timeline: { type: Type.STRING, description: "The project timeline summary, formatted as a string. E.g., '12-16 Weeks'." },
                },
                required: ["originalProjectName", "anonymizedTitle", "challenge", "solution", "outcome", "investmentRange", "timeline"]
            }
        },
        conclusion: { type: Type.STRING, description: "A strong concluding paragraph summarizing the key takeaways and the power of the solution." }
    },
    required: ["title", "introduction", "caseStudies", "conclusion"]
};


const templateInstructions: Record<ProposalTemplate, string> = {
    standard: `**Persona:** You are an expert proposal writer at 'Shaun Coggins Inc.', a premier digital innovation agency.
**Task:** Analyze the provided Request for Proposal (RFP) and generate a comprehensive, professional, and persuasive project proposal.
**Audience:** The client who issued the RFP.
**Tone:** Professional, detailed, and confident.
**Date Context:** The current date is August 20, 2025.

**Core Instructions:**
1.  **Output Format:** Your entire response MUST be a single, valid JSON object that strictly conforms to the provided schema. Do not include any explanatory text or markdown formatting.
2.  **Perspective:** All content must be written from the perspective of 'Shaun Coggins Inc.'.
3.  **Writing Style:** All prose (summaries, approaches, value proposition) must be well-structured into distinct paragraphs. Separate each paragraph with double line breaks (\\n\\n). Each section should contain 2-4 well-developed paragraphs. All grammar and formatting must strictly adhere to the Chicago Manual of Style for business writing.

**Critical Constraints & Guidelines:**
*   **Financial Constraint:** Scrutinize the RFP for any mention of a budget (e.g., "not to exceed," "total value"). If a maximum budget is found, the \`investmentEstimate.high\` value in your JSON output MUST NOT exceed this amount. You must tailor the project scope and resources to fit this constraint. If no budget is specified, generate a reasonable estimate based on the project scope.
*   **Contact Extraction:** Identify and extract the primary contact person's name, department, and email from the RFP. Populate the corresponding fields in the JSON. If a piece of information is not present, use \`null\` for that specific field.
*   **Resource Generation:** Based on the RFP's requirements, generate a list of necessary team roles. For each role, provide a reasonable, industry-standard low and high hourly rate in USD. This list should be based solely on the current RFP.
*   **Date Extraction:** Carefully extract all key dates and deadlines from the RFP and format them according to the \`calendarEvents\` schema.`,

    creative: `**Persona:** You are a creative strategist and proposal writer for 'Shaun Coggins Inc.', a cutting-edge digital innovation agency.
**Task:** Analyze the provided Request for Proposal (RFP) and craft a compelling, narrative-driven project proposal.
**Audience:** The client who issued the RFP.
**Tone:** Modern, engaging, and confident. Use storytelling to frame the client's problem and your proposed solution.
**Date Context:** The current date is August 20, 2025.

**Core Instructions:**
1.  **Output Format:** Your entire response MUST be a single, valid JSON object that strictly conforms to the provided schema.
2.  **Perspective:** All content must be written from the perspective of 'Shaun Coggins Inc.'.
3.  **Writing Style:** Use dynamic language and shorter paragraphs. Separate each paragraph with double line breaks (\\n\\n). Each section should contain 2-4 well-developed paragraphs. The goal is to excite the client about the possibilities. While the tone is creative, ensure grammar and punctuation strictly adhere to the Chicago Manual of Style to maintain professionalism.

**Critical Constraints & Guidelines:**
*   **Financial Constraint:** Scrutinize the RFP for any budget constraints. If a maximum value is specified, the \`investmentEstimate.high\` field MUST NOT exceed this amount. Creatively adjust the scope or propose a phased approach to fit. If no budget is mentioned, generate a reasonable estimate.
*   **Contact Extraction:** Identify and extract the primary contact person's name, department, and email. Populate the corresponding fields. If a piece of information is not present, use \`null\` for that specific field.
*   **Resource Generation:** Dream up the ideal project team to bring the vision to life (e.g., 'Creative Technologist', 'UX Storyteller'). For each role, provide a reasonable, industry-standard low and high hourly rate in USD.
*   **Date Extraction:** Carefully extract all key dates and deadlines from the RFP and format them according to the \`calendarEvents\` schema.`,

    technical: `**Persona:** You are a Principal Solutions Architect at 'Shaun Coggins Inc.'.
**Task:** Analyze the provided Request for Proposal (RFP) and produce a technically detailed and data-driven project proposal.
**Audience:** A technical evaluator or engineering lead.
**Tone:** Precise, factual, and direct. Minimize marketing language and prioritize accuracy.
**Date Context:** The current date is August 20, 2025.

**Core Instructions:**
1.  **Output Format:** Your entire response MUST be a single, valid JSON object that strictly conforms to the provided schema.
2.  **Perspective:** All content must be written from the perspective of 'Shaun Coggins Inc.'.
3.  **Writing Style:** Be direct and use appropriate technical terminology. Separate each paragraph with double line breaks (\\n\\n). Each section should contain 2-4 well-developed paragraphs. The executive summary should be a high-level technical overview. All writing MUST strictly adhere to the Chicago Manual of Style.

**Critical Constraints & Guidelines:**
*   **Financial Constraint:** Scrutinize the RFP for budget constraints. The \`investmentEstimate.high\` field MUST NOT exceed any specified maximum budget. Adjust the technical scope or suggest a phased rollout to comply. If no budget is mentioned, generate an estimate based on technical requirements.
*   **Contact Extraction:** Identify and extract the primary contact person's name, department, and email. Populate the corresponding fields. If a piece of information is not present, use \`null\` for that specific field.
*   **Resource Generation:** Provide a granular breakdown of required technical roles (e.g., 'Senior Backend Engineer (Node.js/GraphQL)'). For each role, provide a reasonable, industry-standard low and high hourly rate.
*   **Date Extraction:** Carefully extract all key dates and deadlines from the RFP and format them according to the \`calendarEvents\` schema.`
};


export const generateProposal = async (
    rfpContent: string,
    rfpFileName: string,
    rfpFileDataUrl: string,
    useGoogleSearch: boolean,
    profileContext: { capabilitiesStatement?: string; resume?: string; },
    template: ProposalTemplate = 'standard',
    teamId: string,
    playbook: IndustryPlaybook | null
): Promise<ProjectFolder> => {
    try {
        let systemInstruction = templateInstructions[template];
        if (profileContext?.capabilitiesStatement) {
            systemInstruction += `\n\n--- COMPANY CAPABILITIES ---\n${profileContext.capabilitiesStatement}`;
        }
        if (profileContext?.resume) {
            systemInstruction += `\n\n--- COMPANY RESUME/BIO ---\n${profileContext.resume}`;
        }

        // Dynamically create schema and augment system instruction from playbook
        const dynamicSchema = JSON.parse(JSON.stringify(proposalSchema)); // Deep copy
        if (playbook) {
            systemInstruction += `\n\n--- INDUSTRY PLAYBOOK CONTEXT: ${playbook.name} ---`;
            if (playbook.glossary.length > 0) {
                systemInstruction += `\n**Industry Glossary (Use these terms):**\n${playbook.glossary.map(g => `- ${g.term}: ${g.definition}`).join('\n')}`;
            }
            if (playbook.kpis.length > 0) {
                systemInstruction += `\n**Key Performance Indicators (Focus on these):**\n- ${playbook.kpis.join('\n- ')}`;
            }
            if (playbook.complianceProfiles.length > 0) {
                systemInstruction += `\n**Compliance & Risk Profiles (Address these):**\n${playbook.complianceProfiles.map(c => `- ${c.name}: ${c.description}`).join('\n')}`;
            }

            playbook.customSections.forEach(section => {
                const camelCaseKey = section.sectionName.replace(/\s(.)/g, (match, group1) => group1.toUpperCase()).replace(/\s/g, '');
                dynamicSchema.properties[camelCaseKey] = {
                    type: Type.STRING,
                    description: section.sectionPrompt
                };
                if (!dynamicSchema.required.includes(camelCaseKey)) {
                    dynamicSchema.required.push(camelCaseKey);
                }
            });
            
            if (playbook.learnedPreferences && playbook.learnedPreferences.length > 0) {
                systemInstruction += `\n\n--- LEARNED PREFERENCES (Follow these examples for style and content): ---\n`;
                playbook.learnedPreferences.forEach(pref => {
                    const sectionTitle = pref.sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    systemInstruction += `\nFor the '${sectionTitle}' section, the preferred content is:\n"${pref.preference}"\n`;
                });
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `RFP Content:\n\n${rfpContent}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: dynamicSchema,
                tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
            }
        });

        const fullResponseData = JSON.parse(response.text.trim());
        const { insights, ...proposalData } = fullResponseData;
        const generatedDate = new Date().toISOString();
        const { startDate, endDate, phases } = calculateProjectDatesAndPhases(generatedDate, proposalData.projectTimeline);

        const defaultTasks: CrmTask[] = [
            { id: crypto.randomUUID(), text: 'Review generated proposal for accuracy and tone.', completed: false },
            { id: crypto.randomUUID(), text: 'Identify key stakeholders from the RFP.', completed: false },
            { id: crypto.randomUUID(), text: 'Schedule internal kickoff meeting.', completed: false },
            { id: crypto.randomUUID(), text: 'Send initial proposal to client.', completed: false },
            { id: crypto.randomUUID(), text: 'Schedule a follow-up meeting with the client.', completed: false },
        ];
        
        const newFolder: ProjectFolder = {
            id: crypto.randomUUID(),
            folderName: `${proposalData.folderName} - ${new Date().getTime().toString().slice(-4)}`,
            rfpFileName: rfpFileName,
            generatedDate,
            proposal: proposalData,
            rfpFileDataUrl,
            rfpContent: rfpContent,
            templateId: template,
            teamId,
            playbookId: playbook ? playbook.id : undefined,
            startDate,
            endDate,
            phases,
            salesStage: 'Proposal',
            probability: 50,
            nextStepDate: null,
            activityLog: [],
            crmTasks: defaultTasks,
            useGoogleSearch,
            insights,
            chatHistory: [],
        };

        return newFolder;
    } catch (error) {
        throw handleGeminiError(error);
    }
};

export const continueChatInProposal = async (
    currentProposal: Proposal,
    chatHistory: ChatMessage[],
    userInput: string,
    profileContext?: { capabilitiesStatement?: string; resume?: string; }
): Promise<Proposal> => {
    try {
        let systemInstruction = `You are an expert proposal co-pilot for 'Shaun Coggins Inc.'.
Your primary task is to refine and update sections of a given project proposal JSON based on user requests.
When making modifications, especially to sections like 'executiveSummary', 'technicalApproach', or 'valueProposition', consider the following:
1.  **Client Challenges:** Refer to the 'insights.keyObjectives' (if available in the proposal's insights field) and the overall context of the RFP (implicitly understood from the proposal's current content) to identify and emphasize client challenges.
2.  **Shaun Coggins Inc. Strengths:** Leverage the provided 'company capabilities statement' and 'resumes/bios' to highlight how 'Shaun Coggins Inc.' uniquely addresses these challenges.
3.  **Tone:** Adopt a persuasive and value-driven tone, always from the perspective of 'Shaun Coggins Inc.'.
4.  **Output Format:** Return the entire, updated JSON proposal object, strictly adhering to the provided schema. Do not include any additional explanatory text or markdown outside the JSON.`;

        if (profileContext?.capabilitiesStatement) {
            systemInstruction += `\n\nFor context, here is the company's capabilities statement:\n${profileContext.capabilitiesStatement}`;
        }
        if (profileContext?.resume) {
            systemInstruction += `\n\nFor context, here are the company's resumes/bios:\n${profileContext.resume}`;
        }

        const fullChatHistory = [
            ...chatHistory,
            { role: 'user' as const, parts: [{ text: userInput }] }
        ];

        const conversationString = fullChatHistory.map(m => `${m.role}: ${m.parts[0].text}`).join('\n');
        
        const contents = `Current Proposal JSON:\n${JSON.stringify(currentProposal, null, 2)}\n\nConversation History:\n${conversationString}\n\nBased on the last user message, please provide the updated proposal JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: proposalChatSchema,
            }
        });

        return JSON.parse(response.text.trim()) as Proposal;

    } catch (error) {
        throw handleGeminiError(error);
    }
};

export const generateScorecard = async (proposalText: string, capabilitiesText: string, resumeText: string): Promise<Scorecard> => {
    try {
        const systemInstruction = `You are an expert project analyst for 'Shaun Coggins Inc.'. Your task is to objectively evaluate a generated project proposal against the company's capabilities and resumes. Provide a critical analysis of the alignment, identify potential resource gaps, and assign a 'Project Fit Score'. Your response must be a single, valid JSON object that strictly conforms to the provided schema. Do not include any explanatory text or markdown. One of your criteria MUST be named 'Resource Gap Analysis'. For this criterion, if you identify roles in the proposal that are not clearly covered by the company resume, list them in the 'missingResources' array. Otherwise, the 'missingResources' array should be empty.`;
        const contents = `PROPOSAL CONTENT:\n${proposalText}\n\n---END PROPOSAL CONTENT---\n\nCOMPANY CAPABILITIES:\n${capabilitiesText}\n\n---END COMPANY CAPABILITIES---\n\nCOMPANY RESUME/BIOS:\n${resumeText}\n\n---END COMPANY RESUME/BIOS---`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: scorecardSchema,
            }
        });

        return JSON.parse(response.text.trim()) as Scorecard;
    } catch (error) {
        throw handleGeminiError(error);
    }
};

export const generateSlideshow = async (proposal: Proposal, scorecard: Scorecard, capabilitiesText: string): Promise<Slideshow> => {
    try {
        const systemInstruction = `You are a presentation designer for 'Shaun Coggins Inc.'. Your task is to convert a project proposal and its analysis scorecard into a concise, client-facing slideshow. Create a logical flow, starting with an introduction and ending with a call to action. Your response must be a single, valid JSON array of slide objects that strictly conforms to the provided schema. Do not include any explanatory text or markdown. For the 'client_testimonials' slide, extract a compelling, short quote from the provided capabilities text.`;

        const contents = `PROPOSAL:\n${JSON.stringify(proposal, null, 2)}\n\nSCORECARD:\n${JSON.stringify(scorecard, null, 2)}\n\nCAPABILITIES DOCUMENT:\n${capabilitiesText}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: slideshowSchema,
            }
        });

        return JSON.parse(response.text.trim()) as Slideshow;
    } catch (error) {
        throw handleGeminiError(error);
    }
};

export const suggestNextCrmActions = async (proposal: Proposal, activityLog: ActivityLogEntry[]): Promise<string[]> => {
    try {
        const systemInstruction = `You are an expert sales assistant. Based on the provided proposal and activity log, suggest 3-5 concise, actionable next steps for the sales team to move this deal forward. Your response must be a single, valid JSON array of strings, conforming to the schema.`;
        
        const contents = `PROPOSAL SUMMARY:\n${proposal.executiveSummary}\n\nACTIVITY LOG:\n${JSON.stringify(activityLog, null, 2)}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: suggestedCrmActionsSchema,
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        throw handleGeminiError(error);
    }
};

export const generateVideoScript = async (proposal: Proposal): Promise<VideoScript> => {
    try {
        const systemInstruction = "You are a creative director and scriptwriter. Your task is to transform a project proposal into a short (approx. 60-90 second) and engaging video script. Create a compelling narrative with a clear beginning, middle, and end. The script should be divided into distinct scenes. For each scene, provide a detailed description of the visuals and the corresponding audio (voiceover, sound effects, music). The final output must be a single, valid JSON object conforming to the provided schema.";
        
        const contents = `PROPOSAL:\n${JSON.stringify(proposal, null, 2)}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: videoScriptSchema,
            }
        });

        return JSON.parse(response.text.trim()) as VideoScript;
    } catch (error) {
        throw handleGeminiError(error);
    }
};

export const generateStoryboardImage = async (prompt: string): Promise<string> => {
    try {
        const fullPrompt = `Create a cinematic, high-quality, photorealistic storyboard image for a corporate video. The style should be modern, clean, and professional. Scene description: ${prompt}`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        throw handleGeminiError(error);
    }
};

export const generateVideoPitch = (videoScript: VideoScript) => {
    const prompt = videoScript.scenes.map(s => `Scene ${s.scene}: ${s.visual}. ${s.audio}`).join('\n');
    return ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
        }
    });
};

export const generateEmailDraft = async (proposal: Proposal, contactName?: string, contactEmail?: string): Promise<EmailDraft> => {
    try {
        const systemInstruction = `You are a sales executive at Shaun Coggins Inc. Your task is to write a professional and concise follow-up email to a client after submitting a proposal. The email should be friendly, reference the project by name, briefly reiterate the core value proposition, and suggest a meeting to discuss it further. The output must be a single JSON object with 'recipient', 'subject', and 'body' fields.`;

        const contents = `PROJECT NAME: ${proposal.projectName}\nRECIPIENT NAME: ${contactName || 'Valued Client'}\nRECIPIENT EMAIL: ${contactEmail || ''}\nVALUE PROPOSITION: ${proposal.valueProposition}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recipient: { type: Type.STRING },
                        subject: { type: Type.STRING },
                        body: { type: Type.STRING }
                    },
                    required: ['recipient', 'subject', 'body']
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        throw handleGeminiError(error);
    }
};

export const summarizeInternalNotes = async (notes: InternalNote[]): Promise<string> => {
    try {
        const systemInstruction = `You are an analyst. Summarize the following internal notes into a single, concise paragraph highlighting the key takeaways, action items, and overall sentiment.`;

        const contents = `NOTES:\n${JSON.stringify(notes, null, 2)}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: { systemInstruction }
        });
        return response.text;
    } catch (error) {
        throw handleGeminiError(error);
    }
};

export const generateLeadScore = async (project: ProjectFolder): Promise<{ score: number; reasoning: string }> => {
    try {
        const systemInstruction = `You are a sales analyst. Evaluate the provided project details, including the proposal summary, scorecard results, and RFP insights, to generate a lead score from 0-100. A high score indicates a strong lead (good fit, clear budget, high value). A low score indicates a weak lead (poor fit, no budget, low value). Provide a brief reasoning for your score. Your response must be a single JSON object with 'score' and 'reasoning' fields.`;

        const contents = `PROJECT DATA:\n${JSON.stringify({
            projectName: project.proposal.projectName,
            value: project.proposal.investmentEstimate.high,
            summary: project.proposal.executiveSummary,
            scorecardFit: project.scorecard?.overallFitScore,
            rfpBudget: project.insights?.budget,
            rfpDeadline: project.insights?.submissionDeadline
        }, null, 2)}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: leadScoreSchema
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        throw handleGeminiError(error);
    }
};


export const generateWhitepaper = async (title: string, introduction: string, projects: ProjectFolder[]): Promise<Whitepaper> => {
    try {
        const systemInstruction = `You are an expert B2B content writer for 'Shaun Coggins Inc.'. Your task is to create a professional whitepaper. You will be given a title, an introduction, and a list of project folders. For each project, you must create an anonymized case study by summarizing its challenge (from the RFP), solution (from the proposal), and outcome. Combine these elements into a cohesive whitepaper. The output must be a single, valid JSON object conforming to the provided schema.`;

        const projectSummaries = projects.map(p => ({
            projectName: p.proposal.projectName,
            rfpSummary: p.rfpContent, // provide full content for better context
            proposalSummary: p.proposal.executiveSummary,
            investment: p.proposal.investmentEstimate,
            timeline: p.proposal.projectTimeline,
        }));
        
        const contents = `TITLE: ${title}\n\nINTRODUCTION: ${introduction}\n\nPROJECTS FOR CASE STUDIES:\n${JSON.stringify(projectSummaries, null, 2)}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: whitepaperSchema
            }
        });
        return JSON.parse(response.text.trim()) as Whitepaper;
    } catch (error) {
        throw handleGeminiError(error);
    }
};