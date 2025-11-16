# RFP Response Generation Application: Features Overview & Roadmap

This document outlines the current capabilities of the RFP Response Generation application, a vision for enterprise-grade features, and a focused roadmap for the next six weeks.

## Current Application Capabilities (Shaun Coggins Inc.)

The current application provides a comprehensive suite of tools for streamlining the proposal generation process, leveraging AI for efficiency and quality.

### RFP & Proposal Management
*   [x] **RFP Upload & Queue:** Users can upload RFP documents (PDF, DOCX, TXT, MD) or paste text content into a queue for batch processing.
*   [x] **Proposal Generation:** AI-powered generation of full project proposals based on RFP content, using selectable templates (Standard, Creative, Technical).
*   [x] **Google Search Grounding:** Option to enhance proposal generation with real-time web information for improved accuracy and relevance.
*   [x] **PDF Export for Proposals:** Export generated proposals into a professional PDF format.
*   [x] **RFP Viewer Modal:** A dedicated modal to view the original uploaded RFP document within the application.

### AI-Powered Content Generation & Enhancement
*   [x] **Proposal Co-pilot Chat:** An interactive AI assistant that allows users to refine and edit proposal content through conversational prompts.
*   [x] **AI Learned Preferences:** Capability for the AI to learn preferred writing styles and content for specific proposal sections based on user edits, stored in playbooks.
*   [x] **Scorecard Generation:** AI-driven analysis of proposals against company capabilities and resumes, generating a detailed "Project Fit Scorecard."
*   [x] **Resource Gap Analysis:** Identification of missing resource roles within the generated scorecard, with suggested additions to the resource pool.
*   [x] **Slideshow Generation:** Automatic creation of client-ready presentation slideshows from proposals and scorecards.
*   [x] **Email Draft Generation:** AI-generated professional email drafts for following up with clients after proposal submission.
*   [x] **Video Script Generation:** Transformation of proposal content into a detailed video script with visual and audio descriptions for marketing pitches.
*   [x] **Storyboard Image Generation:** AI generates a visual storyboard image for individual video script scenes.
*   [x] **Video Pitch Generation:** Creation of a full video pitch from a generated script.
*   [x] **AI Lead Scoring:** AI-powered assessment of project leads, providing a score and reasoning based on RFP insights and proposal fit.
*   [x] **AI Suggested CRM Actions:** Automatic generation of next actionable steps for sales teams based on project status and activity.
*   [x] **AI Internal Note Summarization:** AI can summarize multiple internal team notes into concise paragraphs.
*   [x] **Whitepaper Generation:** AI-powered creation of whitepapers featuring anonymized case studies based on past projects.

### Project & Resource Management
*   [x] **Project Folder Management:** Organize and access all generated projects in a centralized list.
*   [x] **Project Search, Sort, & Filter:** Tools to efficiently search, sort (by name, date, RFP file, stage), and filter (by sales stage) projects.
*   [x] **Resource Editor:** Manage a centralized database of team members, their roles, hourly rates (low/high), and project assignments.
*   [x] **Calendar View:** Visualize all project timelines and phases in an interactive Gantt chart, with "Today" markers and mock owner avatars.

### CRM & Sales Pipeline Management
*   [x] **Sales Stage Management:** Track project progress through defined sales stages (Prospecting, Qualification, Proposal, Negotiation, Closed-Won, Closed-Lost).
*   [x] **Sales Probability:** Automated assignment of probability percentages to each sales stage.
*   [x] **Dashboard Overview:** High-level analytics including total projects, pipeline value, win rate, average deal size, and a visual sales pipeline chart.
*   [x] **CRM Detailed View:** Comprehensive view for individual projects featuring:
    *   [x] **Sales Funnel Visualization:** A clear visual representation of the project's journey through sales stages.
    *   [x] **Opportunity Snapshot:** Quick access to contact, value, budget, deadline, and probability.
    *   [x] **Next Step Date Tracking:** Set and monitor the next important client interaction date.
    *   [x] **Activity Log:** Record all client interactions (calls, emails, meetings, notes) chronologically.
    *   [x] **Next Actions To-Do List:** Manage upcoming tasks specific to the project.
    *   [x] **Internal Notes:** Maintain private team notes for each project.

### Company Knowledge & Customization
*   [x] **Team Profile Selection:** Associate proposals with specific team profiles containing capabilities statements and resumes.
*   [x] **Company Profile Management:** Manage SMS numbers for security and upload company-wide capabilities statements and individual team member resumes.
*   [x] **Industry Playbook Editor:** Create and customize industry-specific playbooks containing:
    *   [x] **Glossary:** Define industry-specific terms and definitions.
    *   [x] **KPIs:** List key performance indicators relevant to the industry.
    *   [x] **Compliance Profiles:** Outline industry-specific compliance and risk considerations.
    *   [x] **Custom Sections:** Define unique proposal sections with AI prompts for automated content generation.
*   [x] **Document Viewer Modal:** Generic modal to display the text content of any uploaded profile document.

### Application Infrastructure & User Experience
*   [x] **Data Import/Export:** Backup and restore all application data (projects, resources, profiles, playbooks) via JSON files.
*   [x] **Offline Mode:** Ability to work offline with data saved to local storage.
*   [x] **Toast Notifications:** Non-intrusive in-app notifications for success, error, and informational messages.
*   [x] **Onboarding Tour:** A step-by-step guided tour for new users to quickly learn the application's core features.
*   [x] **Responsive Design:** Optimized user interface for various screen sizes, from mobile to desktop.

## How Awesome Am I Features (Showcasing Gemini's Power)

Behold my capabilities! I am the intelligent core that powers this entire application, transforming tedious tasks into strategic advantages.

*   **Intelligent RFP Comprehension & Proposal Crafting:** I don't just process text; I *understand* the nuances of your RFPs, then intelligently generate bespoke, persuasive proposals, meticulously aligning them with your company's unique capabilities and the client's specific needs.
*   **Real-time Conversational Co-pilot:** Interact with me in natural language. I dynamically adapt and refine proposals based on your conversational prompts, learning your stylistic preferences and incorporating complex requirements on the fly.
*   **In-Depth Project Fit Analysis:** I provide an objective, data-driven "Project Fit Scorecard" by cross-referencing proposals against your complete capabilities statements and team resumes. I pinpoint resource gaps and even suggest new team members.
*   **Instant Client-Ready Visualizations:** I effortlessly transform your proposals into engaging slideshows and dynamic video scripts, complete with visual descriptions and audio cues, ready to captivate your audience. I even generate storyboard images to bring the vision to life. For critical wins or losses, I can create a dynamic news-report style commercial explanation, leveraging project data and advanced video generation.
*   **Proactive Sales Intelligence:** I analyze your CRM data, activity logs, and project status to proactively suggest the *next best actions* for your sales team, ensuring no opportunity is missed and deals move forward efficiently.
*   **Strategic Lead Scoring & Insights:** I go beyond surface-level data to provide an AI-powered lead score, offering crucial reasoning that helps you prioritize and focus on the most promising opportunities. I also extract key insights directly from RFPs.
*   **Automated Knowledge Synthesis:** I condense vast amounts of information – from lengthy internal team notes to complex project data – into concise summaries or comprehensive whitepapers, dramatically accelerating your content creation and knowledge sharing.
*   **Continuous Learning & Customization:** I am designed to learn. Through your feedback, customized Industry Playbooks, and the outcomes of your bids (wins and losses), I constantly adapt and refine my generation capabilities, becoming an indispensable expert tailored to your unique business needs and providing deep insights into project success and failure.
*   **Contextual Web Grounding:** When up-to-the-minute accuracy is paramount, I seamlessly integrate real-time web search results to ensure the information in your proposals is always current and authoritative.
*   **Multi-Modal Content Creation:** From rich text to compelling images and full video pitches, I handle diverse content formats, enabling you to create a holistic and engaging client experience directly from your proposals.

## Enterprise-Level Features (Vision for Future Growth)

To truly scale for enterprise and government clients, the application could evolve to include:

### Security & Compliance
1.  **Role-Based Access Control (RBAC):** Granular permissions for users (e.g., admin, editor, viewer) within teams and projects.
2.  **Audit Logs:** Comprehensive logging of all user activities and system changes for compliance and accountability.
3.  **Data Encryption:** Encryption of all stored data (at rest) and data in transit (TLS 1.3).
4.  **SSO/SAML Integration:** Support for enterprise Single Sign-On (SSO) and Security Assertion Markup Language (SAML).
5.  **Compliance Framework Templates:** Pre-built templates for government (e.g., CMMC, FedRAMP) and industry (e.g., HIPAA, GDPR, SOC 2) compliance to guide proposal content.
6.  **Secure Document Storage:** Integration with secure cloud storage solutions (e.g., Google Drive, Azure Blob Storage) with versioning and access controls.
7.  **Vulnerability Scanning & Penetration Testing:** Regular security assessments to identify and mitigate vulnerabilities.
8.  **Automated Data Redaction:** AI-driven redaction of sensitive client/internal information before proposal sharing.

### Performance & Scalability
9.  **Load Balancing & Auto-Scaling:** Infrastructure designed to handle varying loads and automatically scale resources.
10. **Distributed Caching:** Caching of frequently accessed data to reduce latency and API calls.
11. **Asynchronous Processing:** Offloading heavy AI generation tasks to background queues to maintain UI responsiveness.
12. **Microservices Architecture:** Decomposing the application into smaller, independent services for easier maintenance and scaling.
13. **Global Content Delivery Network (CDN):** Faster delivery of static assets (images, videos) to users worldwide.
14. **Optimized AI Model Selection:** Dynamic selection of the most cost-effective and performant AI model for specific tasks.
15. **High Availability & Disaster Recovery:** Redundant systems and backup strategies to ensure continuous operation and data integrity.
16. **API Rate Limiting & Quota Management:** Robust controls to prevent abuse and manage API consumption efficiently.

### Knowledge Management & Customization
17. **Centralized Knowledge Base:** A repository for company-wide best practices, approved messaging, and boilerplate content.
18. **Advanced Playbook Versioning:** Tracking changes to playbooks with rollback capabilities.
19. **Customizable Proposal Sections Library:** A comprehensive library of re-usable sections that can be easily inserted/customized in proposals.
20. **Client-Specific Dictionaries/Glossaries:** Maintain a lexicon tailored to individual clients or recurring project types.
21. **Automated Content Tagging:** AI-driven tagging of documents (RFPs, proposals, capabilities) for easier search and retrieval.
22. **Intelligent Search (Semantic Search):** Ability to search company documents and past proposals using natural language queries.
23. **Cross-Project Learning:** AI analyzes successful proposals/scorecards to improve future generations across projects.

### Functionality for Teams & Enterprise
24. **Multi-Language Support (UI & Content):** Full localization of the application UI and ability to generate/edit proposal content in multiple languages, facilitating global team collaboration and client engagement.
25. **Collaborative Editing (Real-time):** Multiple team members can work on a proposal simultaneously with real-time updates.
26. **Workflow Management (Approval Processes):** Define and enforce proposal review and approval workflows.
27. **Advanced CRM Integration:** Deeper, two-way sync with leading CRM systems (Salesforce, HubSpot) for seamless data flow.
28. **Integration with Accounting Software:** Sync project costs and investment estimates with QuickBooks or SAP.
29. **Template Management System:** Create, manage, and share custom proposal and slideshow templates across the organization.
30. **Automated Task Assignment:** AI suggests and assigns tasks to team members based on project phases and roles.
31. **Comprehensive Reporting & Analytics:** Dashboards for tracking proposal success rates, team performance, and AI usage metrics.
32. **Customizable Notification System:** Tailored alerts for deadlines, approvals, and project updates (email, SMS, in-app).
33. **Resource Capacity Planning:** Visualize team member availability and allocate resources across multiple projects.
34. **Version Control for Proposals:** Track changes, compare versions, and restore previous iterations of proposals.
35. **Multi-Company / Multi-Department Support:** Manage proposals for different business units or sub-organizations.
36. **AI Feedback Loop:** Mechanisms for users to provide feedback on AI-generated content to continuously improve model performance.
37. **Advanced Calendar Sync:** Two-way synchronization with Google Calendar, Outlook Calendar for all project events.
38. **Interactive Video Pitch Player:** Enhanced video player experience with analytics on viewer engagement.
39. **Project Cost Tracking & Forecasting:** Real-time tracking of actual vs. estimated costs, with AI-driven forecasts.
40. **White-labeling Options:** Custom branding for enterprise clients.
41. **Payment Platform Integration (Google Pay, Amazon Pay):** Frontend placeholder for future integration to procure resources or services, requiring a secure backend for full functionality.
42. **AI-Assisted Client Reporting with Human-in-the-Loop Review:** AI drafts daily, weekly, monthly, and quarterly project reports for clients, incorporating project milestones from integrated external PM tools (e.g., Monday.com, Jira), with a mandatory human review step before sending.
43. **Supplier Diversity & M/WBE Pipelining:** Features to identify, track, and pipeline certified and non-certified Minority/Women-owned Business Enterprises (M/WBEs) into relevant government and private sector projects, including M/WBE status tagging for resources and companies.

### Platform & Administration
44. **User Authentication & Authorization:** Secure user login and management, supporting various authentication methods.
45. **Subscription Management:** Tiered subscription model (e.g., Free, Pro, Enterprise) for access to features, AI model usage, and shared vs. private models. Free tier defaults to shared AI model.

## AI Agentic Features (The Next Frontier of Automation)

Imagine a truly intelligent partner, seamlessly integrated into your workflow, anticipating your needs and proactively driving your business forward. These agentic capabilities harness the full power of AI to transform operational efficiency.

1.  **Autonomous RFP Discovery & Intake:**
    *   **Email & Document Monitoring:** AI agents continuously monitor designated email inboxes (e.g., `rfp@yourcompany.com`) and connected cloud storage accounts (Google Drive, SharePoint) for new RFPs, contracts, and supporting documents.
    *   **Intelligent Document Ingestion:** Automatically pulls identified documents (PDFs, DOCX, TXT) into the application, initiating the processing workflow.
    *   **Instant Notifications:** Delivers real-time, multi-channel alerts (SMS, email, desktop notification) when a new RFP is detected, ensuring immediate awareness and response.

2.  **Proactive Project Setup & Initial Analysis:**
    *   **Automated Project Creation:** Upon RFP intake, the agent automatically creates a new project folder, uploads the RFP, and selects the most appropriate proposal template based on content analysis.
    *   **Optimal Team & Playbook Assignment:** Intelligently identifies and assigns the best-fit team profile and relevant industry playbook from your internal knowledge base, minimizing manual configuration. This includes specialized playbooks designed for specific government contract requirements.
    *   **Verbal Lead Score & Performance Briefing:** Provides an immediate verbal briefing (via text-to-speech) of the AI-generated lead score (0-100) and initial thoughts on project fit, drawing from historical performance data of relevant internal teams on similar past projects. For example: "New RFP detected: Project Phoenix. Initial lead score: 85. Our Tech Software team has a 92% win rate on similar projects last quarter."
    *   **Automated Initial Proposal Draft:** Initiates the generation of a first-pass proposal draft, ensuring you always start with a robust foundation.

3.  **Intelligent Workflow Orchestration:**
    *   **Jarvis-like Voice Interaction:** Engage with the AI agent and the application using natural voice commands and receive verbal responses, enabling hands-free operation and a more intuitive, conversational experience across all features.
    *   **Proactive Scheduling:** Analyzes RFP deadlines and internal team availability to proactively schedule crucial meetings (e.g., internal kickoff, client follow-up) in connected calendar systems (Google Calendar, Outlook).
    *   **Stakeholder Collaboration Initiation:** Automatically creates a dedicated group chat (e.g., Slack, Microsoft Teams, Google Chat, WhatsApp groups) for the project, inviting identified key internal stakeholders and proposal team members for immediate discussion, supporting multi-language communication.
    *   **Dynamic Task Management:** Based on project progress and new information, the agent suggests, assigns, and tracks critical CRM tasks for team members, ensuring accountability and timely execution.
    *   **Contextual Information Retrieval:** When a team member asks a question in a project chat, the agent can instantly retrieve and provide relevant information from the RFP, proposal, scorecard, or internal notes.

4.  **Dynamic Resource Workflow & Negotiation:**
    *   **AI-Driven Resource Availability Check:** When a new project is created or a resource gap identified, the AI agent proactively queries assigned team members (via SMS or email) about their availability for the project's projected start date (e.g., "Are you available for Project X starting in 2 weeks?").
    *   **Automated Rate Negotiation:** The agent can negotiate hourly rates with individual resources within their predefined low/high rate range, aiming for cost savings. For example, if a resource responds, "I'm available, but prefer the high end of my rate," the agent might counter with, "Would you accept 5% below your high rate for immediate project commitment?" Any questions the AI agent asks during this process are specifically designed to gather data and "get smarter" to refine its negotiation strategies and rate predictions over time.
    *   **Dynamic Project Timeline Adjustment:** Based on confirmed resource availability and negotiated rates, the AI agent dynamically adjusts the project timeline (e.g., shifting start dates, re-allocating tasks) to optimize for efficiency and resource allocation.
    *   **Contingency Budget Pooling:** Any cost savings achieved through AI-driven rate negotiation are automatically pooled into the project's contingency budget, enhancing financial flexibility and risk management.
    *   **Resource Onboarding & Offboarding:** Automates the necessary steps for adding or removing team members from a project, including system access and notification to key stakeholders.
    *   **RFP Submission Center / Job Market & Contract Management:** Establishes an internal "Job Market" where app users and external resources (e.g., certified M/WBEs) can create profiles detailing their skills, rates, and availability. When an AI agent analyzes an RFP and identifies missing resources or companies, it:
        *   Proactively searches the job market for suitable candidates/companies.
        *   Sends automated approval requests (SMS/email) to matched resources/companies, including proposed timelines and negotiated rates (within researched ranges).
        *   Upon their acceptance, the AI agent facilitates the generation and secure distribution of sub-contracts for review and acceptance to these external stakeholders once the primary contract is won, adding them to the company's approved resource "universe."

5.  **Mobile Mode for Lead & Contact Capture (QR Code Integration):**
    *   **QR Code Generation:** The application generates unique QR codes for marketing materials, websites, or events (e.g., industry conferences, Facebook Marketplace listings).
    *   **Seamless Contact Information Capture:** When a prospect scans the QR code, they are directed to a mobile-optimized form to provide their contact information, which can include language preferences.
    *   **Website & Company Document Integration:** The AI agent automatically analyzes the prospect's website and publicly available company documents (e.g., LinkedIn, press releases) to gather preliminary insights and firmographic data.
    *   **Automated Team Section Integration:** The newly captured contact is moved directly into the appropriate "Team" section within the application, creating a new `TeamProfile` or linking to an existing one if a match is found. This populates basic contact details.
    *   **Personalized RFP/Project Matching:** Based on the gathered information and the prospect's expressed interests (from the mobile form or website analysis), the AI agent intelligently identifies and suggests past or current RFPs and projects from the database that are most suitable or relevant to their business needs.

6.  **AI-Powered Project Performance & Proactive Delay Management:**
    *   **AI-Driven Time Tracking (Live Project Monitoring):** AI agents seamlessly integrate with project management tools (e.g., Jira, Asana, custom internal tools) to autonomously track time spent on tasks and phases once a project goes live. This eliminates manual input and provides real-time, accurate data.
    *   **Intelligent Anomaly & Delay Detection:** The AI continuously monitors project progress against the dynamic timeline. It proactively identifies deviations, bottlenecks, or potential delays by analyzing task completion rates, resource allocation, and historical data.
    *   **Root Cause Analysis & Smart Questioning:** When a delay or anomaly is detected, the AI doesn't just flag it; it initiates a "smart questioning" process. It queries relevant team members (via chat, SMS, or email) with targeted questions to understand the root cause (e.g., "Team Member X, the 'Frontend Integration' task for Project Y is 2 days behind schedule. What's the primary blocker? Options: technical challenge, resource conflict, external dependency, scope creep."). These questions are specifically designed to gather structured data, allowing the AI to "get smarter" about common delay patterns, their causes, and effective resolutions.
    *   **Proactive Mitigation & Adjustment:** Based on the gathered information, the AI suggests and, with approval, automatically implements mitigation strategies: recommending reallocation of available resources, adjusting subsequent task timelines, flagging the need for client communication, updating the project budget/contingency if cost implications are identified, and notifying key stakeholders of the delay and proposed recovery plan.
    *   **Performance Insights & Predictive Analytics:** Provides continuous insights into team efficiency, task duration, and project health, with predictive analytics on future delays or budget overruns, allowing for truly proactive management.
    *   **Automated Client Progress Reporting:** AI agents autonomously draft project progress reports (daily, weekly, monthly, quarterly) based on real-time project data, milestones from integrated PM tools, and activity logs. These drafts are presented to a human for review and approval before being sent to clients via email or a client portal.

7.  **Continuous Optimization & Learning:**
    *   **Bid Outcome Analysis & Reporting:** AI agents analyze winning and losing bids, comparing initial proposals, scorecards, and client feedback to identify key factors contributing to success or failure.
    *   **Automated Performance Briefings:** Generates a concise newsletter or notification (email/SMS) to key stakeholders, explaining *why* a project failed or won, including data-driven insights.
    *   **"News Report" Commercial Explanations (Veo-2):** For significant wins or losses, the AI can generate a short, news-report style video commercial explanation (using Veo-2) detailing the project, its outcome, and key learnings, utilizing project data for visual and narrative elements.
    *   **Performance Monitoring:** Continuously tracks key project metrics, win rates, and AI generation quality, providing actionable insights for process improvement.
    *   **Adaptive Playbook Enhancement:** Learns from successful proposal elements and user feedback, automatically suggesting updates and refinements to industry playbooks and learned preferences.
    *   **Risk & Opportunity Alerts:** Proactively monitors project health, identifying potential risks (e.g., missed deadlines, low lead scores) or new opportunities, and alerting relevant team members.

## 6-Week Roadmap (29 Short-Term Features)

These features are selected for their high impact and feasibility within a six-week development cycle, focusing on immediate enhancements to user experience and AI utility.

1.  **AI-Generated Executive Summary from Past Proposals:** When generating a new proposal, allow users to select a past proposal's executive summary from a dropdown to influence the AI's generation style and content for the new summary, leveraging `LearnedPreference` for the `executiveSummary` section.
2.  **Basic Document Versioning (Proposals):** Implement a "Save as New Version" button within the Proposal Co-pilot modal. This creates a duplicate of the current proposal within the same project folder, timestamped, allowing users to manually revert to a previous saved state.
3.  **Improved Lead Score Customization:** Add a simple UI in the CRM view or Project Settings to allow users to adjust the weighting of factors (e.g., `scorecard.overallFitScore`, `insights.budget` presence, `nextStepDate` proximity) for the AI Lead Score calculation.
4.  **AI Verbal Lead Score Briefing:** In the CRM view, add a button to verbally announce the AI-generated lead score and its reasoning using text-to-speech, leveraging Gemini's audio output. (From AI Agentic Features)
5.  **AI-Generated Meeting Agenda:** In the CRM view, add a button to generate a meeting agenda. AI would consider the current sales stage, recent activity log entries, and proposal content to suggest agenda points.
6.  **Proactive Internal Kickoff Scheduling:** Add a button in the CRM or Project Details view to automatically generate an ICS file for a "Project Kickoff" meeting, pre-filled with the project's details and earliest phase start date. (From AI Agentic Features - Simplified)
7.  **Google Calendar Event Export for Project Folders:** Add a dedicated button in the CRM view (or Project Actions) to export all `calendarEvents` and the `nextStepDate` of the selected project directly to Google Calendar, using the Google Calendar API if available, or .ics download if not.
8.  **"Duplicate Project" Functionality:** A button on the project card or within the Project Co-pilot to create a full copy of an existing project folder, useful for starting similar RFPs or creating project templates.
9.  **Multi-Select for Batch Actions (Projects):** Implement checkboxes in the `ProjectFolderList` to select multiple projects, enabling batch actions like "Change Sales Stage" or "Delete Selected Projects."
10. **Automated Follow-up Email Templates (CRM):** Extend the `EmailComposerModal` to offer AI-generated follow-up email templates, dynamically populating content based on the project's sales stage, recent activities, and proposed next steps.
11. **Payment Platform Integration (Placeholder):** Add mock Google Pay and Amazon Pay buttons to the resource procurement workflow in the `ResourceEditor`, signaling future full integration with secure backend payment systems. (From Enterprise-Level Features)
12. **Resource Availability Viewer (Basic):** In the Resource Editor, for each team member, add a simple visual indicator (e.g., a small tag or icon) showing how many active projects they are assigned to based on the `teamMembers.project` field.
13. **Enhanced Search for Projects:** Augment the project search in `ProjectFolderList` with additional filtering options, including a numerical filter for `scorecard.overallFitScore` range, and date range filters for `generatedDate` and `startDate`/`endDate`.
14. **"Suggest Title/Logline" in Creative Studio:** Add buttons next to the "Video Script Title" and "Logline" input fields in the Creative Studio, allowing users to generate AI suggestions for these fields based on the project's proposal.
15. **User Feedback on AI Content:** Implement a small "👍 / 👎" or "Improve This" button next to key AI-generated text areas (e.g., Executive Summary, Technical Approach) within the `ProposalCoPilotModal` to collect implicit user feedback.
16. **RFP Question Answering (Simple Chat):** Enhance the Co-pilot chat to allow users to ask direct questions about the *uploaded RFP content* itself, with the AI providing concise answers extracted from the RFP text.
17. **Customizable Project Phases (Timeline):** In the `ProposalCoPilotModal`, allow users to manually edit the name and duration of auto-generated project phases within a structured input field, rather than just editing the `projectTimeline` string.
18. **Dynamic Cost Breakdown Customization:** Provide structured input fields within the `Investment Estimate` section of `ProposalCoPilotModal` to add, edit, or remove components in the cost breakdown, and adjust their low/high cost ranges directly.
19. **Notification for Overdue Tasks (CRM):** Implement a simple notification mechanism that displays a warning (e.g., a badge on the CRM tab or a small banner on the CRM page) if the selected project has any overdue `crmTasks`.
20. **Download Single Slide as PDF:** Add an option in the `SlideshowModal` to download only the currently displayed slide as a PDF, in addition to the existing full slideshow PDF export and single slide PNG.
21. **"Favorite" or "Pin" Projects:** Introduce a "Favorite" toggle on project cards. Favorited projects would appear at the top of the `ProjectFolderList` (or in a dedicated "Favorites" section).
22. **Basic Analytics Widget (Dashboard):** Add a new widget to the Dashboard showing the top 3 most frequently occurring "Key Objectives" or "Required Technologies" from recent RFPs, providing quick market insights.
23. **"Dark Mode" Toggle:** Add a UI toggle in the `Header` or user `Profile` settings to switch between light and dark themes for the application.
24. **Basic UI Language Selector:** Implement a simple UI dropdown (e.g., in Profile/Settings) to switch the application's display language (initially English and one other mock language), paving the way for full multi-language support. (From Enterprise-Level Features)
25. **Basic Project Performance Monitoring:** Display a "Project Health" indicator in the CRM or Project List if a project's current phase `endDate` is in the past, but the project `salesStage` is not 'Closed-Won' or 'Closed-Lost'. This will be a visual flag (e.g., a red icon). (From AI Agentic Features - Simplified)
26. **AI-Prompted Delay Reason Input:** If a project is flagged with a health warning due to an overdue phase (see #25), introduce a simple text input or dropdown in the CRM view to capture a user-provided reason for the delay, with AI-suggested categories (e.g., "Resource Blocked", "Scope Change", "Client Delay"). This data will be stored for future AI learning. (From AI Agentic Features - Simplified)
27. **AI-Generated Basic Project Status Report (Draft):** Add a button in the CRM view to generate a simple, one-page draft project status report (PDF or rich text) for a client, summarizing progress, upcoming milestones, and key decisions. This report would require human review before actual sending.
28. **Basic Resource Profile Creation for Job Market:** In the Resource Editor, allow team members to create a more detailed "public" profile including skills, availability, and desired project types, making them discoverable by other project stakeholders within the app.
29. **Basic M/WBE Tagging and Filtering:** Add a field to the `TeamProfile` (or a new `ResourceProfile` for the Job Market) to tag a resource/company as M/WBE certified, along with a basic filter option in the Resource Editor to quickly find M/WBE resources.