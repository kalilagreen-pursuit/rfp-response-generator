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
 */
export const generateProposalContent = async (
  rfpData: any,
  companyProfile: any,
  documents: any[]
) => {
  const prompt = `You are an expert proposal writer. Generate a compelling proposal based on the following information:

RFP Requirements:
${JSON.stringify(rfpData, null, 2)}

Company Profile:
${JSON.stringify(companyProfile, null, 2)}

Company Documents:
${documents.map(doc => `- ${doc.type}: ${doc.file_name}`).join('\n')}

Generate a structured proposal with the following sections as JSON:
{
  "executiveSummary": "Compelling 2-3 paragraph executive summary",
  "introduction": "Introduction highlighting company's qualifications",
  "technicalApproach": {
    "overview": "Technical approach overview",
    "methodology": "Detailed methodology",
    "deliverables": ["List of deliverables addressing RFP requirements"]
  },
  "qualifications": {
    "companyOverview": "Company background and experience",
    "relevantExperience": ["List of relevant past projects"],
    "teamStructure": "Proposed team structure"
  },
  "timeline": {
    "phases": [
      {
        "phase": "Phase name",
        "duration": "Duration",
        "activities": ["Key activities"]
      }
    ]
  },
  "pricing": {
    "approach": "Pricing approach description",
    "breakdown": ["Cost breakdown categories"],
    "totalEstimate": "Total cost estimate range"
  },
  "riskManagement": {
    "risks": [
      {
        "risk": "Risk description",
        "mitigation": "Mitigation strategy"
      }
    ]
  },
  "conclusion": "Strong closing statement"
}

Respond with valid JSON only.`;

  try {
    const result = await generateStructuredContent(prompt);
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
