# Development Instructions for the RFP Response Generation Application

## 1. Introduction

Welcome, development team. This document serves as the primary technical guide for evolving the **RFP Response Generation Application** from its current state as a single-user, browser-based Minimum Viable Product (MVP) into a robust, scalable, multi-tenant enterprise SaaS platform.

The complete feature set, including currently implemented features and the future roadmap, is detailed in **`features.md`**. Your mission is to implement the "Enterprise-Level Features," "AI Agentic Features," and the "6-Week Roadmap" outlined in that document.

This document will walk you through the current architecture, its limitations, the target architecture, and a strategic implementation plan.

---

## 2. Current State Analysis & Architectural Limitations

The current application is a powerful proof-of-concept that demonstrates the core AI capabilities. However, it is **not** architected for a production, multi-user environment.

-   **Architecture:** 100% client-side React application. All logic, state management, and AI API calls are executed directly in the user's browser.
-   **Data Storage:** All application data (projects, profiles, resources, etc.) is persisted in the browser's `localStorage`. There is no backend database.
-   **Security:** This is the most critical limitation.
    -   The Gemini API key is exposed directly to the client-side code (`process.env.API_KEY` is a build-time substitution). This is a severe security vulnerability and is unacceptable for production.
    -   There is no user authentication, authorization, or data isolation between different users.
-   **Scalability & Performance:**
    -   `localStorage` has a small size limit (typically 5-10MB), which is insufficient for enterprise use.
    -   All AI processing is synchronous and blocks the main UI thread, leading to a poor user experience for long-running tasks like video generation.
    -   The application cannot scale to support multiple users or teams.
-   **Collaboration:** The current architecture does not support any form of real-time collaboration, data sharing, or team-based workflows.

---

## 3. High-Level Architectural Vision for Enterprise Adaptation

To address these limitations, we will re-architect the application following a modern, decoupled service-oriented approach.

-   **Frontend:** The existing React/Vite frontend will be refactored to communicate with a new backend API for all data and AI operations.
-   **Backend:** A new backend service will be created (Node.js with TypeScript, using a framework like NestJS or Express is recommended). This backend will be the single source of truth and the only component authorized to communicate with the Gemini API and other third-party services.
-   **Database:** A robust, scalable database is required. PostgreSQL is recommended for its relational integrity, but a NoSQL solution like MongoDB could be considered for flexibility.
-   **Authentication & Authorization:** Implement a secure authentication system. JWT (JSON Web Tokens) are recommended. This will manage user identity and form the basis for Role-Based Access Control (RBAC).
-   **Asynchronous Task Processing:** For long-running AI tasks (video generation, whitepaper creation), a job queue system (e.g., Redis with BullMQ) must be implemented. The client will initiate a task, the backend will add it to the queue, and the client will poll for completion status.
-   **Secure File Storage:** All user-uploaded documents and AI-generated assets (images, videos, PDFs) must be stored in a secure, scalable cloud storage solution like Google Cloud Storage or AWS S3.
-   **Deployment:** The entire stack should be containerized (Docker) and deployed to a major cloud provider (GCP, AWS, Azure), preferably using an orchestration service like Kubernetes for auto-scaling and high availability.

---

## 4. Implementation Roadmap & Instructions

This roadmap outlines the logical steps to transform the application.

### Phase 1: Foundational Backend & Refactoring (Critical Path)

This phase is the prerequisite for all future enterprise and agentic features. The goal is to move all business logic and data persistence to a secure backend.

1.  **Backend Scaffolding:**
    -   Initialize a new Node.js/TypeScript project.
    -   Set up a RESTful API framework (e.g., NestJS).
    -   Establish a database connection.

2.  **Database Schema Design:**
    -   Design and create the necessary database tables/collections. This must include schemas for: `Users`, `Organizations`, `Projects`, `Proposals`, `Resources`, `TeamProfiles`, `Documents`, `Playbooks`, etc.
    -   Establish clear relationships (e.g., a User belongs to an Organization, a Project belongs to an Organization).

3.  **Implement User Authentication & Tenancy:**
    -   Create endpoints for user registration, login, and profile management.
    -   Implement JWT-based authentication. All subsequent API requests must include a valid JWT.
    -   All data models must be tied to an `OrganizationID` or `UserID` to ensure data isolation (multi-tenancy).

4.  **Secure AI Service Proxy:**
    -   **This is a top priority.** Move all functions from `services/geminiService.ts` to the backend.
    -   The Gemini API key must be stored as a secure environment variable on the server ONLY.
    -   Create new, authenticated backend endpoints for each AI function (e.g., `POST /api/proposals/generate`, `POST /api/projects/:id/scorecard`).
    -   The frontend will now call these backend endpoints instead of the Gemini SDK directly.

5.  **Frontend Data Layer Refactoring:**
    -   Remove all `localStorage` logic from `AppContext.tsx`.
    -   Refactor all state management functions (`addProjectFolder`, `updateProjectFolder`, etc.) to make authenticated API calls to the new backend. The frontend state should be a reflection of the backend data.

### Phase 2: Implementing Enterprise-Level Features

Once the foundational backend is in place, you can begin implementing the enterprise features from `features.md`.

-   **Role-Based Access Control (RBAC):**
    -   Add `Roles` (e.g., 'Admin', 'Editor', 'Viewer') and `Permissions` tables to your database.
    -   Implement middleware in your backend API that checks a user's role and permissions before allowing access to an endpoint (e.g., only an 'Admin' can delete a project).

-   **Asynchronous Processing:**
    -   Integrate a job queue system (e.g., BullMQ).
    -   For long-running endpoints like `/api/videos/generate`, the controller should:
        1.  Add the job to the queue with the necessary data.
        2.  Immediately respond to the client with a `202 Accepted` status and a `jobId`.
    -   Create a separate worker process to consume jobs from the queue and execute the `geminiService` function.
    -   The frontend will poll a new endpoint (e.g., `GET /api/jobs/:jobId`) to get the status ('pending', 'completed', 'failed') and the final result.
    -   Update the UI in `CreativeStudioView` to reflect this polling mechanism.

-   **Collaborative Editing:**
    -   This is a highly complex feature. A recommended approach is to integrate WebSockets (e.g., using Socket.io or a managed service).
    -   When a user edits a proposal section in `ProposalCoPilotModal`, the change should be emitted via a WebSocket event. Other users viewing the same proposal will receive the event and update their UI in real-time.
    -   Implement a "last-write-wins" or a more sophisticated CRDT-based approach for conflict resolution.

-   **CRM & External Integrations:**
    -   Create a generic service layer in the backend for handling third-party integrations.
    -   Use OAuth 2.0 to securely connect to external APIs (Salesforce, Google Calendar, etc.). Store user-specific tokens securely.
    -   Implement both outbound API calls (e.g., creating a calendar event) and inbound webhooks (e.g., receiving an update from Salesforce) to enable two-way data sync.

### Phase 3: Implementing AI Agentic Features

These features build upon the enterprise foundation, requiring more complex backend orchestration.

-   **Autonomous RFP Discovery:**
    -   This should be a separate, long-running service or a set of scheduled serverless functions.
    -   Use the Gmail API, Microsoft Graph API, or IMAP to monitor a designated inbox.
    -   Use webhooks from cloud storage providers (Google Drive, SharePoint) to detect new file uploads.
    -   When a new document is found, this service will call your main backend's API to trigger the project creation workflow.

-   **Jarvis-like Voice Interaction:**
    -   **Frontend:** Use the browser's Web Speech API (`SpeechRecognition`) to capture and transcribe user voice commands.
    -   **Backend:** Create a new endpoint (e.g., `/api/voice-command`). This endpoint will receive the transcribed text. Use a natural language understanding (NLU) service or a Gemini function to parse the user's intent and entities from the text (e.g., intent: `navigate`, entity: `projects`).
    -   Based on the intent, call the appropriate internal service. For verbal responses, use Gemini's text-to-speech capabilities and stream the audio back to the client.

-   **Dynamic Resource & Negotiation Workflow:**
    -   Integrate an email/SMS provider (e.g., Twilio, SendGrid) into the backend.
    -   Create a state machine in your backend to manage the negotiation process for each resource (e.g., `availability_requested`, `rate_offered`, `negotiating`, `confirmed`).
    -   Use webhooks from your SMS/email provider to handle inbound replies from resources, updating the state machine accordingly.

### Phase 4: Implementing the 6-Week Roadmap

These are smaller, high-impact features that can be developed in parallel once the foundational backend is stable.

-   **Feature #1 (AI-Generated Summary from Past Proposals):**
    -   **Frontend:** In `ProposalCoPilotModal`, add a dropdown to select a past project.
    -   **Backend:** Modify the `continueChatInProposal` service. When a past proposal's summary is provided, dynamically insert it into the Gemini system prompt as a few-shot example of a preferred style.

-   **Feature #11 (Payment Platform Placeholder):**
    -   **Frontend:** This is a UI-only task for now. In `ResourceEditor.tsx`, add the styled buttons for Google Pay and Amazon Pay. The `onClick` handler should simply trigger a toast notification explaining that this is a placeholder for future backend integration.

-   **Feature #24 (Basic UI Language Selector):**
    -   **Frontend:** Integrate a library like `i18next`. Create JSON translation files for UI strings (`public/locales/en/translation.json`, etc.). Implement a dropdown in the `Header` or `Profile` page that changes the language context for `i18next`.

-   **Feature #26 (AI-Prompted Delay Reason):**
    -   **Backend:** Create a new table `ProjectDelays` to store `projectId`, `phaseName`, `delayReason`, and `timestamp`.
    -   **Frontend:** In the CRM view, when a project is flagged as delayed, show a modal or form with AI-suggested reasons. Submitting this form will call a new backend endpoint to log the data.

---

## 5. Conclusion

This document provides the strategic blueprint for transforming the RFP Response Generator into a market-leading enterprise application. The key is to systematically migrate from the client-side MVP to a secure, scalable, and robust backend architecture.

Please maintain open communication throughout the development process. This is a living document, and we will collaborate to refine these instructions as we build this amazing application together.
