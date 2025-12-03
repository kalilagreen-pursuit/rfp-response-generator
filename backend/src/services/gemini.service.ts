import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Gemini model configuration
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3-pro-preview';

/**
 * Get Gemini model instance
 */
export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: MODEL_NAME });
};

/**
 * Generate content with Gemini
 */
export const generateContent = async (prompt: string) => {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate structured JSON content with Gemini
 */
export const generateStructuredContent = async (prompt: string, schema?: any) => {
  try {
    const model = getGeminiModel();

    // Add JSON formatting instruction to prompt
    const jsonPrompt = `${prompt}\n\nRespond with valid JSON only. Do not include any other text or markdown formatting.`;

    const result = await model.generateContent(jsonPrompt);
    const response = result.response;
    const text = response.text();

    // Clean up response (remove markdown code blocks if present)
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON
    const jsonResponse = JSON.parse(cleanedText);
    return jsonResponse;
  } catch (error) {
    console.error('Gemini structured content error:', error);
    throw new Error(`Failed to generate structured content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Parse RFP document with Gemini
 */
export const parseRFPDocument = async (documentText: string) => {
  const prompt = `You are an expert RFP (Request for Proposal) analyzer. Analyze the following RFP document and extract key information.

RFP Document:
${documentText}

Extract and structure the following information as JSON:
{
  "title": "RFP title or project name",
  "issuingOrganization": "Organization issuing the RFP",
  "projectDescription": "Brief description of the project",
  "requirements": [
    {
      "category": "Category name (e.g., Technical, Experience, Team)",
      "description": "Detailed requirement",
      "mandatory": true/false
    }
  ],
  "evaluationCriteria": [
    {
      "criterion": "Evaluation criterion name",
      "weight": "Percentage or points",
      "description": "How this will be evaluated"
    }
  ],
  "deliverables": ["List of expected deliverables"],
  "timeline": {
    "submissionDeadline": "ISO date string",
    "projectStartDate": "ISO date string or null",
    "projectEndDate": "ISO date string or null",
    "keyMilestones": [
      {
        "milestone": "Milestone name",
        "date": "ISO date string"
      }
    ]
  },
  "budget": {
    "amount": "Budget amount or null",
    "currency": "Currency code (USD, EUR, etc.) or null",
    "constraints": "Budget constraints description"
  },
  "contactInformation": {
    "primaryContact": "Contact name",
    "email": "Contact email",
    "phone": "Contact phone"
  },
  "additionalNotes": "Any other important information"
}

Respond with valid JSON only.`;

  try {
    const result = await generateStructuredContent(prompt);
    return result;
  } catch (error) {
    console.error('RFP parsing error:', error);
    throw error;
  }
};

/**
 * Generate proposal content based on RFP and company profile
 * Matches the frontend schema from services/geminiService.ts
 */
export const generateProposalContent = async (
  rfpData: any,
  companyProfile: any,
  documents: any[]
) => {
  const prompt = `**Persona:** You are an expert proposal writer for 'Shaun Coggins Inc.'.
**Task:** Analyze the provided Request for Proposal (RFP) and generate a comprehensive, professional, and persuasive project proposal.
**Audience:** The client who issued the RFP.
**Tone:** Professional, detailed, and confident.
**Date Context:** The current date is August 20, 2025.

**Core Instructions:**
1. **Output Format:** Your entire response MUST be a single, valid JSON object that strictly conforms to the provided schema. Do not include any explanatory text or markdown formatting.
2. **Perspective:** All content must be written from the perspective of 'Shaun Coggins Inc.'.
3. **Writing Style:** All prose (summaries, approaches, value proposition) must be well-structured into distinct paragraphs. Separate each paragraph with double line breaks (\\n\\n). Each section should contain 2-4 well-developed paragraphs. All grammar and formatting must strictly adhere to the Chicago Manual of Style for business writing.

**Critical Constraints & Guidelines:**
* **Financial Constraint:** Scrutinize the RFP for any mention of a budget (e.g., "not to exceed," "total value"). If a maximum budget is found, the \`investmentEstimate.high\` value in your JSON output MUST NOT exceed this amount. You must tailor the project scope and resources to fit this constraint. If no budget is specified, generate a reasonable estimate based on the project scope.
* **Contact Extraction:** Identify and extract the primary contact person's name, department, and email from the RFP. Populate the corresponding fields in the JSON. If a piece of information is not present, use \`null\` for that specific field.
* **Resource Generation:** Based on the RFP's requirements, generate a list of necessary team roles. For each role, provide a reasonable, industry-standard low and high hourly rate in USD, and a detailed 2-3 sentence description of their key responsibilities. This list should be based solely on the current RFP.
* **Date Extraction:** Carefully extract all key dates and deadlines from the RFP and format them according to the \`calendarEvents\` schema.

RFP Requirements:
${JSON.stringify(rfpData, null, 2)}

Company Profile:
${JSON.stringify(companyProfile, null, 2)}

Company Documents:
${documents.map(doc => `- ${doc.type}: ${doc.file_name}`).join('\n')}

Generate a structured proposal with the following JSON schema:
{
  "folderName": "string - A user-friendly folder name derived from the project title",
  "projectName": "string - A concise and professional project name based on the RFP content",
  "contactPerson": "string or null - The name of the main contact person",
  "contactDepartment": "string or null - The name of the department for the main contact person",
  "contactEmail": "string or null - The email address of the main contact person",
  "executiveSummary": "string - 2-4 well-developed paragraphs separated by \\n\\n, written from Shaun Coggins Inc.'s perspective",
  "technicalApproach": "string - 2-4 well-developed paragraphs separated by \\n\\n, mentioning key components like Document Processing, AI Generation, and Management Dashboard. Mention technologies like React, Node.js, and a cloud provider",
  "resources": [
    {
      "role": "string - The role of the team member (e.g., Project Manager, Senior Developer)",
      "hours": number - Estimated total hours for this role,
      "lowRate": number - The estimated low-end industry-standard hourly rate in USD,
      "highRate": number - The estimated high-end industry-standard hourly rate in USD,
      "description": "string - A detailed 2-3 sentence description of this role's key responsibilities and how they contribute to the project. Be specific to the project's needs"
    }
  ],
  "projectTimeline": "string - A brief, high-level project timeline, outlining key phases and their estimated durations in weeks. Format each phase on a new line starting with 'Phase N:' followed by the phase name and duration. Example: Phase 1: Discovery & Requirements (2-3 weeks)\\nPhase 2: Design & Architecture (3-4 weeks)",
  "investmentEstimate": {
    "low": number - The low-end total estimated cost of the project in USD,
    "high": number - The high-end total estimated cost of the project in USD,
    "breakdown": [
      {
        "component": "string - The cost component (e.g., Development Team, Third-party Services)",
        "lowCost": number - The low-end estimated cost for this component in USD,
        "highCost": number - The high-end estimated cost for this component in USD
      }
    ]
  },
  "valueProposition": "string - 2-4 well-developed paragraphs separated by \\n\\n, focusing on benefits like time savings, increased win rates, and cost reduction",
  "questionsForClient": ["string - 3-5 clarifying questions for the client based on ambiguities or missing information"],
  "insights": {
    "submissionDeadline": "string or null - The submission deadline in YYYY-MM-DD format",
    "keyObjectives": ["string - Main objectives or goals the client wants to achieve"],
    "budget": "string or null - The specific budget amount or cost constraint (e.g., '$50,000', 'Not to exceed $100k')",
    "requiredTechnologies": ["string - Specific technologies or platforms mentioned as requirements"],
    "keyStakeholders": ["string - Names or roles of key stakeholders mentioned in the RFP"]
  },
  "calendarEvents": [
    {
      "title": "string - The title of the event or deadline",
      "date": "string - The date in YYYY-MM-DD format"
    }
  ]
}

Respond with valid JSON only.`;

  try {
    const result = await generateStructuredContent(prompt);
    console.log('=== GEMINI AI RESPONSE ===');
    console.log('Full result:', JSON.stringify(result, null, 2));
    console.log('Resources count:', result.resources?.length || 0);
    console.log('Resources:', JSON.stringify(result.resources, null, 2));
    console.log('=== END GEMINI RESPONSE ===');
    return result;
  } catch (error) {
    console.error('Proposal generation error:', error);
    throw error;
  }
};

/**
 * Refine proposal section with AI suggestions
 */
export const refineProposalSection = async (
  sectionName: string,
  currentContent: string,
  improvementGoals: string[]
) => {
  const prompt = `You are an expert proposal editor. Improve the following proposal section:

Section: ${sectionName}

Current Content:
${currentContent}

Improvement Goals:
${improvementGoals.map((goal, i) => `${i + 1}. ${goal}`).join('\n')}

Provide the improved content and explain the changes made as JSON:
{
  "improvedContent": "The refined and improved section content",
  "changesExplanation": "Explanation of key improvements made",
  "suggestions": ["Additional suggestions for further improvement"]
}

Respond with valid JSON only.`;

  try {
    const result = await generateStructuredContent(prompt);
    return result;
  } catch (error) {
    console.error('Content refinement error:', error);
    throw error;
  }
};

/**
 * Test Gemini API connection
 */
export const testGeminiConnection = async () => {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent('Say "Hello, Gemini API is working!" in one sentence.');
    const response = result.response;
    const text = response.text();
    return {
      success: true,
      message: text,
      model: MODEL_NAME
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      model: MODEL_NAME
    };
  }
};

/**
 * Extract text from documents (for RFP parsing)
 * This will be implemented with pdf-parse and mammoth
 */
export const extractTextFromDocument = async (
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> => {
  // TODO: Implement in Week 1, Day 5
  // For now, return placeholder
  throw new Error('Document text extraction not yet implemented');
};

export default {
  getGeminiModel,
  generateContent,
  generateStructuredContent,
  parseRFPDocument,
  generateProposalContent,
  refineProposalSection,
  testGeminiConnection,
  extractTextFromDocument
};
