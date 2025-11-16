# Building the RFP Response Generator with an AI Assistant

This document provides a series of prompts to guide an AI code generation assistant in building the "RFP Response Generation Application" step-by-step. Each prompt is designed to build a specific part of the application, from initial setup to advanced features.

---

### Prompt 1: Initial Project Setup

**User Prompt:**
"Set up a new React + TypeScript project using Vite. Create the initial `index.html`, `index.tsx`, `App.tsx`, `package.json`, `vite.config.ts`, `tsconfig.json`, and `README.md` files.

In `index.html`, include a script tag for Tailwind CSS (with forms and typography plugins) via CDN and set up an import map for `react`, `react-dom`, `@google/genai`, `pdfjs-dist`, `mammoth`, `jspdf`, `html-to-image`, and `jspdf-autotable`.

In `vite.config.ts`, configure it to handle environment variables, specifically `GEMINI_API_KEY`, so it can be accessed as `process.env.API_KEY` in the browser. Also configure a path alias for `@/*` to point to the root directory."

---

### Prompt 2: Core Type Definitions

**User Prompt:**
"Create a file at the root named `types.ts`. In this file, define all the necessary TypeScript types for the application. This should include, but is not limited to, types for: `ProjectFolder`, `Proposal`, `Resource`, `Scorecard`, `Slide`, `Slideshow`, `TeamMember`, `ProfileData`, `TeamProfile`, `ProfileDocument`, `SalesStage`, `ActivityLogEntry`, `CrmTask`, `VideoScript`, `Whitepaper`, `IndustryPlaybook`, and the main `View` type for navigation."

---

### Prompt 3: Global State with AppContext

**User Prompt:**
"Create a `contexts` directory and inside it, a file named `AppContext.tsx`. Implement a React Context provider (`AppProvider`) that will manage the application's global state using `useState`, `useEffect`, and `useMemo`.

The state should include `projectFolders`, `teamMembers`, `profileData`, `industryPlaybooks`, and `isOfflineMode`. It must handle saving and loading this state to and from the browser's local storage. On initial load, if local storage is empty, provide a default set of general `teamMembers`. Also, include state and functions for managing toast notifications and a new-user onboarding tour. Include logic to migrate older data structures to the new format upon loading from local storage."

---

### Prompt 4: Shared Components & Utilities

**User Prompt 4a: Icon Library**
"Create a `components` directory. Inside, create `icons.tsx`. This file will export a comprehensive collection of SVG icon components that will be used throughout the application. Each icon should be a React functional component. Include icons for `Upload`, `Folder`, `Delete`, `Document`, `View`, `Email`, `Calendar`, `Users`, `Sparkles`, `Download`, `Close`, `Refresh`, etc."

**User Prompt 4b: Utility Functions**
"Create a `utils` directory. Inside, add the following utility files:

1.  **`fileParser.ts`**: Create functions to handle file processing.
    *   `extractTextFromFile`: This async function should take a `File` object and return its text content. It needs to support `.pdf` (using `pdfjs-dist`), `.docx` (using `mammoth`), and plain text file types.
    *   `fileToDataUrl`: Converts a `File` object to a base64 data URL.

2.  **`timelineParser.ts`**: Create functions for calculating project timelines.
    *   `parseTimelineStringToPhases`: Takes a timeline string (e.g., 'Phase 1: Discovery (2-4 weeks)...') and a start date, and returns an array of `ProjectPhase` objects with calculated start and end dates.
    *   `calculateProjectDatesAndPhases`: A helper that uses the above function to return a full project start date, end date, and phase breakdown.

3.  **`formatters.ts`**: Create helper functions for formatting data.
    *   `formatCurrency`: Formats a number into a USD currency string (e.g., $150,000).
    *   `formatProposalForDownload`: Converts a `ProjectFolder` object into a well-formatted plain text string suitable for downloading.

4.  **`calendarExporter.ts`**: Create functions to generate and download `.ics` calendar files from project events.
    *   `generateIcsContent`: Creates the iCalendar file content string.
    *   `downloadIcsFile`: Triggers the browser download for the generated content.

5.  **`pdfExporter.ts`**: Create functions to generate PDF documents using `jspdf` and `jspdf-autotable`.
    *   `exportProposalToPdf`: Formats an entire `ProjectFolder` into a professional, multi-page proposal document with a title page, headers, footers, and tables for financial data.
    *   `exportSlideshowToPdf`: Renders each slide from a `Slideshow` object onto a separate, landscape-oriented page in a PDF.
    *   `exportWhitepaperToPdf`: Formats a `Whitepaper` object into a professional document.
    *   `exportTimelineToPdf`: Creates a simple PDF of the project timeline."

**User Prompt 4c: Playbook Templates**
"In the `utils` directory, create `playbookTemplates.ts`. This file will export a constant object containing predefined templates for different industries (e.g., Tech, Healthcare, Government). Each template should define a default set of glossary terms, KPIs, compliance profiles, and custom sections."

---

### Prompt 5: Main App Layout (Sidebar & Header)

**User Prompt:**
"Create two components: `Sidebar.tsx` and `Header.tsx`.

1.  **`Sidebar.tsx`**: This will be a vertical navigation bar on the left, styled with a dark background (`#19224C`). It should display the 'Shaun Coggins Inc.' logo at the top, a 'Create New Project' button, and lists of navigation items for 'Main', 'Workspaces', and 'Profile'. The active view should be highlighted. The sidebar must be collapsible and hidden by default on mobile screens, and toggleable with a button.

2.  **`Header.tsx`**: This component will be a horizontal bar at the top of the main content area. It should include a menu icon button to toggle the sidebar on mobile, a 'Help' icon button to start a guided tour, and an 'Offline Mode' toggle switch."

---

### Prompt 6: The Gemini API Service

**User Prompt:**
"Create a `services` directory and a file named `geminiService.ts`. This file will contain all the logic for interacting with the Gemini API.

- Initialize the `GoogleGenAI` client using the API key from `process.env`.
- Implement robust `handleGeminiError` logic.
- Create an async function `generateProposal` that takes RFP content, profile context, a template choice, and an optional playbook. It must use the Gemini API with a detailed system prompt and a dynamic JSON schema that incorporates custom sections from the playbook. Include a parameter for using Google Search grounding.
- Create `generateScorecard` to analyze a proposal against company info and return a `Scorecard` object.
- Create `generateSlideshow` to convert a proposal and scorecard into a `Slideshow` object.
- Create `continueChatInProposal` for the co-pilot feature, which takes the current proposal and chat history and returns an updated proposal object.
- Add functions for all other AI features, each with its own specific system prompt and JSON schema: `generateVideoScript`, `generateStoryboardImage` (using `imagen-4.0-generate-001`), `generateVideoPitch` (using `veo-2.0-generate-001`), `suggestNextCrmActions`, `generateEmailDraft`, `summarizeInternalNotes`, `generateLeadScore`, and `generateWhitepaper`."

---

### Prompt 7: Assembling the Main App Component

**User Prompt:**
"Update `App.tsx` to be the main component that orchestrates the entire application.

- It should use the `AppContext` to get and manage global state (`projectFolders`, `teamMembers`, etc.).
- It should render the `Sidebar` and `Header` components.
- It should manage the `currentView` state (`useState`) to switch between the different app sections.
- Implement a `renderCurrentView` function with a `switch` statement to render the correct view component (`DashboardView`, `ProjectFolderList`, `Profile`, etc.) based on the `currentView` state.
- It should contain the top-level handler functions that call the `geminiService` (e.g., `handleGenerate`, `handleViewScorecard`) and update the context state.
- It should manage the state for all modals (e.g., `selectedProjectForCoPilot`, `selectedProjectForScorecard`) and render them when their state is not null."

---

### Prompt 8: Building the Views (One by one)

**User Prompt 8a: Dashboard**
"Create `components/DashboardView.tsx`. This component should provide a high-level overview of the sales pipeline. Include several `StatCard` components (for Total Projects, Pipeline Value, Win Rate, Avg. Deal Size) and a `SalesPipelineChart` component that visualizes the value of projects in each sales stage using colored bars."

**User Prompt 8b: Projects (RFP Upload & List)**
"Create `components/RfpUpload.tsx` and `components/ProposalList.tsx`.
- **`RfpUpload`**: This is the main input form. It should check if the user's profile is complete before allowing uploads. It needs a file/text input, a queue, template selection, team selection, playbook selection, a Google Search toggle, and the main 'Generate' button. It will call the `onGenerate` prop passed from `App.tsx`.
- **`ProposalList`**: This displays a grid of generated projects. Create a sub-component `components/ProposalCard.tsx` for individual projects. The list must include controls for searching, sorting, and filtering by sales stage. The card should show key project info and action buttons."

**User Prompt 8c: Profile Management**
"Create `components/Profile.tsx`. This view allows the user to manage their company profile. It should include:
- A 'Profile Strength' meter.
- An input for an SMS number.
- A section to create and manage 'Teams', each with its own drag-and-drop upload zones for 'Capabilities Statements' and 'Resumes'.
- Data import/export buttons to back up and restore all application data."

**User Prompt 8d: Resources Editor**
"Create `components/ResourceEditor.tsx`. This view will manage team resources. It should display members grouped by project in collapsible sections. Users must be able to add (with pre-filled suggestions from common roles), edit, and delete members and their hourly rates."

**User Prompt 8e: Calendar View**
"Create `components/CalendarView.tsx`. This component will visualize all project timelines in a Gantt chart format. The chart should have a timeline header showing months. Each project bar should be segmented to show its different phases, and its fill level should represent its sales probability. A vertical line should indicate today's date."

**User Prompt 8f: CRM View**
"Create `components/CRMView.tsx`. This provides a detailed view for a selected project. It must include:
- A visual sales funnel component.
- A snapshot card with value, contact, and next step date.
- An AI-powered Lead Score.
- An activity log where users can add calls, emails, and notes.
- A 'Next Actions' to-do list with an 'AI Suggest Actions' button.
- An 'Internal Notes' section with an 'AI Summarize' button."

**User Prompt 8g: Creative & Whitepaper Studios**
"Create `components/CreativeStudioView.tsx` and `components/WhitepaperStudioView.tsx`.
- **`CreativeStudioView`**: For a selected project, this view will have two parts. Part 1 generates a video script and then generates storyboard images for each scene. Part 2, in a component called `VideoPitcherView.tsx`, takes the script and generates a full video pitch, handling the polling logic for the VEO model.
- **`WhitepaperStudioView`**: This view has a form for a title and introduction, and a checklist of projects. The 'Generate' button will call the AI to create a full whitepaper, which is then displayed for preview in the component."

**User Prompt 8h: Industry Playbooks**
"Create `components/IndustryPlaybookEditor.tsx`. This view allows users to manage their industry playbooks. It should have a two-column layout. The left column lists existing playbooks and has a form to create new ones (from blank or a template). The right column is an editor for the selected playbook, with collapsible sections for 'Learned Preferences', 'Glossary', 'KPIs', 'Compliance Profiles', and 'Custom Sections'."

---

### Prompt 9: Building the Modals (One by one)

**User Prompt 9a: Proposal Co-Pilot Modal**
"Create `components/ProposalCoPilotModal.tsx`. This is a large, two-panel modal. The left panel renders the full proposal content in a readable and editable format, with an 'EditableSection' component that allows users to 'Teach AI' their changes. The right panel is a chat interface. User input in the chat should call the `continueChatInProposal` service function, and the left panel should re-render with the updated proposal data. The modal header needs controls for downloading as a PDF, emailing, and navigating to other asset views."

**User Prompt 9b: Scorecard Modal**
"Create `components/ScorecardModal.tsx`. This modal displays the AI-generated project fit score. It should show a loading state with cycling messages while generating. The final view includes a large circular gauge for the overall score, a summary, and a detailed criteria breakdown with progress bars."

**User Prompt 9c: Slideshow Modal**
"Create `components/SlideshowModal.tsx`. This modal will display the AI-generated presentation. It should render one slide at a time in a 16:9 container, with different layouts for different slide types. Implement 'Next' and 'Previous' buttons. The header should include buttons to 'Regenerate', 'Export as PDF', and 'Download Slide as Image' (using `html-to-image`)."

**User Prompt 9d: Helper Modals**
"Create the remaining small modal components:
- `EmailComposerModal.tsx`: An AI-pre-filled email form to send the proposal.
- `RfpViewerModal.tsx`: A modal to display the original RFP document, either as text or in an iframe for PDFs.
- `DocumentViewerModal.tsx`: A simple modal to display the text content of profile documents.
- `Toast.tsx` & `ToastContainer.tsx`: For displaying success/error notifications.
- `OnboardingTour.tsx`: A step-by-step guided tour for new users that highlights key UI elements."

---

### Prompt 10: Final Assembly and Polish

**User Prompt:**
"Review all created components and ensure they are correctly imported and rendered within `App.tsx`'s `renderCurrentView` function. Verify that all props are passed correctly and that state updates from modals and child components properly flow back to the `AppContext`. Ensure the `AppProvider` is wrapping the `<App />` component in `index.tsx`. The application is now complete."
