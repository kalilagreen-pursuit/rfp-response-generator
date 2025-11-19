# RFP Response Generator - Repository Summary

**Generated:** 2025-11-16
**Total Files:** 54 (excluding node_modules, .git)
**Technology Stack:** React 19 + TypeScript + Vite + Gemini AI

---

## File Structure Overview

```
rfp-response-generator/
├── Configuration Files (7)
├── Core Application (4)
├── React Components (29)
├── Services (1)
├── Utils (6)
├── Contexts (1)
├── Documentation (5)
└── Claude AI Config (1)
```

---

## 1. Configuration Files (7 files)

| File | Purpose | Key Details |
|------|---------|-------------|
| `package.json` | Dependencies & scripts | React 19, Vite 6, Gemini AI, jspdf, mammoth, pdfjs-dist |
| `tsconfig.json` | TypeScript config | ES2020, strict mode enabled |
| `vite.config.ts` | Build tool config | Loads GEMINI_API_KEY from env, path aliases |
| `.env.local` | Environment variables | Contains GEMINI_API_KEY |
| `.gitignore` | Git exclusions | node_modules, dist, .env.local |
| `index.html` | HTML entry point | Loads index.tsx |
| `metadata.json` | App metadata | Project information |

---

## 2. Core Application Files (4 files)

### `index.tsx` (18 lines)
- React application entry point
- Renders App component into #root

### `App.tsx` (555 lines)
- Main application orchestrator
- View routing (Dashboard, CRM, Profile, Calendar, etc.)
- Toast notification management
- Data export/import functionality

### `types.ts` (272 lines)
- Complete TypeScript type definitions
- Key types: Proposal, Project, Team, Resource, IndustryPlaybook
- Sales stage types, CRM activity types

### `contexts/AppContext.tsx` (376 lines)
- Global state management using React Context
- localStorage persistence
- Data migration logic
- State includes: projects, proposals, teams, playbooks, resources

---

## 3. React Components (29 files)

### Navigation & Layout (3 components)
- **Header.tsx** - Top navigation bar with branding and actions
- **Sidebar.tsx** - Left navigation menu with view selection
- **Toast.tsx** / **ToastContainer.tsx** - Notification system

### Main Views (8 components)
- **DashboardView.tsx** - Analytics, pipeline visualization, project metrics
- **CRMView.tsx** - Sales pipeline, activity log, lead scoring
- **Profile.tsx** - Team/company profile management
- **CalendarView.tsx** - Gantt chart timeline view
- **CreativeStudioView.tsx** - Slideshow and presentation generation
- **VideoPitcherView.tsx** - Video script and pitch management
- **VisualsView.tsx** - Storyboard image generation
- **WhitepaperStudioView.tsx** - Case study whitepaper creation

### Proposal Management (4 components)
- **RfpUpload.tsx** - Multi-file RFP upload with drag-and-drop
- **ProposalList.tsx** - List view of all proposals
- **ProposalCard.tsx** - Individual proposal summary card
- **ProposalModal.tsx** - Full proposal editor with template selection

### AI-Powered Modals (7 components)
- **ProposalCoPilotModal.tsx** - Chat interface for proposal refinement
- **ScorecardModal.tsx** - AI-generated project fit analysis
- **SlideshowModal.tsx** - Presentation slide generation
- **VideoPitchModal.tsx** - Video generation with Veo 2.0
- **EmailComposerModal.tsx** - Email draft generation
- **DocumentViewerModal.tsx** - PDF/DOCX preview
- **RfpViewerModal.tsx** - RFP document viewer

### Editors & Configuration (4 components)
- **IndustryPlaybookEditor.tsx** - Custom glossary, compliance, KPIs
- **ResourceEditor.tsx** - Team member management with hourly rates
- **VisualScriptView.tsx** - Video script editing interface
- **TimelineHelpModal.tsx** - Help documentation for timeline features

### Utilities (2 components)
- **OnboardingTour.tsx** - First-time user walkthrough
- **icons.tsx** - SVG icon components

---

## 4. Services (1 file)

### `services/geminiService.ts` (823 lines)
**Purpose:** All Gemini AI API interactions

**12 AI Functions Implemented:**

| Function | Model | Purpose |
|----------|-------|---------|
| `generateProposal()` | gemini-2.5-flash | Full proposal generation with dynamic schema |
| `continueChatInProposal()` | gemini-2.5-flash | Interactive proposal refinement chat |
| `generateScorecard()` | gemini-2.5-flash | Project fit analysis (0-100 score) |
| `generateSlideshow()` | gemini-2.5-flash | 8-slide presentation creation |
| `suggestNextCrmActions()` | gemini-2.5-flash | CRM task suggestions |
| `generateVideoScript()` | gemini-2.5-flash | Video script with scenes |
| `generateStoryboardImage()` | imagen-4.0 | Scene image generation |
| `generateVideoPitch()` | veo-2.0 | Full video creation |
| `generateEmailDraft()` | gemini-2.5-flash | Follow-up email composition |
| `summarizeInternalNotes()` | gemini-2.5-flash | Note condensation |
| `generateLeadScore()` | gemini-2.5-flash | Lead assessment (0-100) |
| `generateWhitepaper()` | gemini-2.5-flash | Anonymized case study |

**Key Features:**
- Structured JSON output with TypeScript schemas
- Google Search grounding support
- Error handling with user-friendly messages
- Support for 3 proposal templates (Standard, Creative, Technical)
- Dynamic schema modification based on industry playbooks
- Learned preferences integration

---

## 5. Utils (6 files)

### `utils/fileParser.ts`
- PDF parsing using pdfjs-dist
- DOCX parsing using mammoth
- TXT/MD text extraction
- Batch file processing with queue management

### `utils/pdfExporter.ts`
- Class-based PDF generator (`PdfProposalGenerator`)
- Branded design with company colors
- Auto-pagination, headers, footers
- Table support via jspdf-autotable

### `utils/calendarExporter.ts`
- .ics file generation for calendar import
- Project phase extraction
- Compatible with Google Calendar, Outlook, Apple Calendar

### `utils/timelineParser.ts`
- Parse project phases from proposal text
- Extract start/end dates, milestones
- Format for Gantt chart display

### `utils/playbookTemplates.ts`
- Pre-built playbook templates (Healthcare, Finance, Tech)
- Industry-specific glossaries
- Compliance framework templates (CMMC, FedRAMP, HIPAA, GDPR, SOC 2)

### `utils/formatters.ts`
- Currency formatting
- Date formatting
- Number formatting utilities

---

## 6. Documentation Files (5 files)

### `README.md`
- Setup instructions
- Run locally guide (npm install, .env setup, npm run dev)

### `devinstructions.md`
- 6-week development roadmap
- Phase 1: Backend infrastructure
- Phase 2: Team collaboration
- Phase 3: Agentic AI features
- Technical architecture guidance

### `features.md`
- 29 short-term features prioritized
- 45 enterprise-level features
- 7 AI agentic capabilities

### `build-in-studio.md`
- AI Studio deployment notes
- Link to live app: https://ai.studio/apps/drive/1rpj6SkRSWG6y8kL39DPVo6j_oB8HBSez

### `build-in-studio`
- Build artifact or script (binary/shell script)

---

## 7. Duplicate/Legacy Files (2 files)

- `index-1.tsx` - Likely old version of index.tsx
- `index-1.html` - Likely old version of index.html

**Recommendation:** Review and delete if no longer needed.

---

## Technology Stack Details

### Frontend
- **React:** 19.1.1 (latest)
- **TypeScript:** 5.8.2
- **Build Tool:** Vite 6.2.0
- **Styling:** Inline Tailwind-style CSS (no framework)

### AI/ML
- **@google/genai:** 1.15.0
- **Models:** gemini-2.5-flash, imagen-4.0, veo-2.0

### File Processing
- **pdfjs-dist:** 4.5.136 (PDF parsing)
- **mammoth:** 1.8.0 (DOCX parsing)

### Document Generation
- **jspdf:** 3.0.3 (PDF creation)
- **jspdf-autotable:** 5.0.2 (PDF tables)
- **html-to-image:** 1.11.13 (Screenshot generation)

### Data Storage
- **Browser localStorage** (no backend/database)

---

## Current Architecture

**Type:** 100% Client-Side Single Page Application (SPA)

**Data Flow:**
1. User uploads RFP → Browser parses file
2. Frontend calls Gemini API directly (API key in .env.local)
3. AI generates content → Stored in React Context
4. State persisted to localStorage
5. All processing synchronous in browser

**Security Considerations:**
- ⚠️ API key exposed in client-side code
- ⚠️ No user authentication
- ⚠️ No authorization/access control
- ⚠️ All data visible in browser DevTools

---

## Key Features Implemented

### ✅ Proposal Generation
- Multi-file RFP upload (PDF, DOCX, TXT, MD)
- 3 proposal templates
- Google Search grounding
- PDF export

### ✅ AI-Powered Tools
- Proposal Co-pilot chat
- Scorecard generation (0-100 fit score)
- Resource gap analysis
- Slideshow generation (8 slide types)
- Video script + storyboard + video generation
- Email drafts
- Lead scoring
- Whitepaper creation

### ✅ CRM & Sales Pipeline
- 6 sales stages
- Activity logging
- Task management
- Win/loss tracking

### ✅ Team & Resource Management
- Multi-team profiles
- Resume/bio uploads
- Hourly rate tracking
- Resource assignment

### ✅ Industry Playbooks
- Custom glossaries
- Compliance profiles
- KPI tracking
- Learned preferences

### ✅ Analytics & Reporting
- Dashboard with metrics
- Pipeline visualization
- Gantt chart calendar view

---

## What's Missing (vs. Enterprise Platform)

### 🔴 Critical Gaps
- No backend server (Node.js/Python)
- No database (PostgreSQL/MongoDB)
- No user authentication/authorization
- No API security (exposed keys)
- No multi-tenancy
- No real-time collaboration
- No email/SMS integrations
- No cloud file storage (S3/GCS)

### 🟡 Scalability Limitations
- localStorage size limits (5-10MB)
- Synchronous processing blocks UI
- No background job queue
- No load balancing

### 🟢 Nice-to-Have Features
- Multi-language support
- Subscription/payment system
- CRM integrations (Salesforce, HubSpot)
- Calendar sync (Google, Outlook)
- Project management integrations (Jira, Asana)
- Client portal
- White-labeling
- Semantic search
- Voice interaction

---

## Lines of Code Summary

| Category | Files | Approx. Lines |
|----------|-------|---------------|
| Components | 29 | ~5,000 |
| Services | 1 | 823 |
| Utils | 6 | ~800 |
| Core App | 4 | 1,221 |
| **Total** | **40** | **~7,844** |

---

## Recommended Next Steps

### Immediate (Week 1-2)
1. **Security Audit:** Move API key to server-side
2. **Backend Setup:** Create Node.js/NestJS backend
3. **Database Design:** PostgreSQL schema for users, projects, proposals
4. **Authentication:** JWT-based auth with email verification

### Short-term (Week 3-4)
5. **Cloud Storage:** S3/GCS for file uploads
6. **Job Queue:** BullMQ for async AI processing
7. **Team Collaboration:** Real-time updates, notifications
8. **Testing:** Unit tests, E2E tests

### Long-term (Month 2-3)
9. **Marketplace:** Public profile discovery
10. **QR Networking:** Lead capture system
11. **Job Board:** Bid submission workflow
12. **Analytics:** Advanced metrics and tracking
13. **Integrations:** CRM, calendar, email providers

---

## File Change Tracking

For the 4-week implementation plan, we will document all changes in a separate `CHANGELOG.md` file organized by week and feature.

---

**Report Generated by:** Claude Code
**Last Updated:** 2025-11-16
