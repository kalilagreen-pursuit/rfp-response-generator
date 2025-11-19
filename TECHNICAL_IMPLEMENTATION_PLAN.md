# RFP Response Generator - Technical Implementation Plan

**Project:** Transform single-user SPA into multi-user authenticated platform
**Timeline:** 4 weeks (compressed scope)
**Document Created:** 2025-11-16
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Assessment](#current-state-assessment)
3. [Architecture Transformation](#architecture-transformation)
4. [Scope Decisions](#scope-decisions)
5. [4-Week Implementation Plan](#4-week-implementation-plan)
6. [Database Schema](#database-schema)
7. [Backend Architecture](#backend-architecture)
8. [Migration Strategy](#migration-strategy)
9. [Risk Assessment](#risk-assessment)
10. [Success Criteria](#success-criteria)
11. [Next Steps](#next-steps)

---

## Executive Summary

### Goal
Transform the existing React/TypeScript/Gemini AI client-side application into a production-ready multi-user platform with authentication, database persistence, and team collaboration features.

### Current State
- ✅ **54 files** of well-structured React code
- ✅ **29 UI components** ready to use
- ✅ **12 Gemini AI functions** implemented
- ✅ Complete proposal generation workflow
- ❌ **100% client-side** (no backend)
- ❌ **localStorage only** (no database)
- ❌ **No authentication** (single user)
- ❌ **Exposed API keys** (security issue)

### What We're Building
A full-stack application with:
- Node.js/Express backend
- PostgreSQL database with Prisma ORM
- JWT authentication
- AWS S3 file storage
- Email notifications
- Team collaboration features
- Public marketplace

---

## Current State Assessment

### ✅ What's Already Built (Can Leverage)

| Category | Details |
|----------|---------|
| **Frontend Components** | 29 React components (DashboardView, CRMView, ProposalModal, etc.) |
| **AI Integration** | Complete Gemini API integration (proposal generation, scoring, slideshow, video, email drafts) |
| **File Processing** | PDF parsing (pdfjs-dist), DOCX parsing (mammoth), PDF export (jspdf) |
| **Type System** | Comprehensive TypeScript types (272 lines in types.ts) |
| **Templates** | Industry playbooks, proposal templates (Standard, Creative, Technical) |
| **UI/UX** | Onboarding tour, toast notifications, responsive design |

### ❌ Critical Gaps (Must Build)

| Gap | Current State | Required |
|-----|---------------|----------|
| **Backend** | None (100% client-side) | Node.js/Express API |
| **Database** | localStorage only | PostgreSQL with Prisma |
| **Authentication** | No user accounts | JWT-based auth with email verification |
| **API Security** | Gemini key exposed in client | Server-side API calls only |
| **File Storage** | Browser memory | AWS S3 |
| **Team Features** | Single-user only | Multi-user with invitations |

### ⚠️ Major Architectural Change

**FROM:** Client-Side SPA
```
User → React App → Gemini API (direct)
         ↓
    localStorage
```

**TO:** Full-Stack Application
```
User → React App → Backend API → Gemini API
         ↓            ↓
    Session      PostgreSQL
                     ↓
                   AWS S3
```

---

## Architecture Transformation

### Frontend (Keep & Refactor)
- **Keep:** All 29 React components
- **Keep:** All UI/UX patterns
- **Refactor:** Replace direct Gemini calls with backend API calls
- **Refactor:** Replace localStorage with API state management
- **Add:** Login/Signup components
- **Add:** Token management (JWT in localStorage or httpOnly cookies)

### Backend (Build from Scratch)

#### Tech Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js (simpler than NestJS for 4-week timeline)
- **Database:** PostgreSQL 14+
- **ORM:** Prisma (type-safe, migration support)
- **Storage:** AWS S3
- **Auth:** JWT (jsonwebtoken)
- **Email:** Nodemailer + SendGrid
- **Validation:** express-validator

#### New Services
1. **gemini.service.ts** - Move from frontend, add server-side API calls
2. **email.service.ts** - Nodemailer setup for team invitations
3. **s3.service.ts** - AWS SDK for file uploads/downloads
4. **parser.service.ts** - Move PDF/DOCX parsing to backend
5. **scoring.service.ts** - Proposal scoring algorithm

---

## Scope Decisions

### IN SCOPE (Core MVP - Must Have)

| Feature | Complexity | Priority |
|---------|-----------|----------|
| ✅ Authentication & user accounts | High | P0 |
| ✅ Company profiles with document upload | Medium | P0 |
| ✅ RFP upload & proposal generation | Medium | P0 |
| ✅ Editable proposals with export | Low | P0 |
| ✅ Basic team invitations (email-based) | Medium | P0 |
| ✅ Proposal dashboard | Low | P0 |
| ✅ Database persistence | High | P0 |

### SIMPLIFIED (Reduced Scope)

| Feature | Original Plan | 4-Week Version |
|---------|---------------|----------------|
| 🔶 QR networking | QR scanning + email automation | Manual contact entry only |
| 🔶 Marketplace | Job board with bidding | Basic profile directory + search |
| 🔶 Analytics | Advanced dashboards | Basic time tracking |
| 🔶 Automated matching | ML algorithm with scoring | Simple keyword search/filter |

### OUT OF SCOPE (Phase 2)

- ❌ Job board with competitive bidding
- ❌ QR code scanning
- ❌ Real-time collaboration (WebSockets)
- ❌ Advanced analytics dashboards
- ❌ Enhanced CRM features (keep existing as-is)
- ❌ Video/slideshow backend integration (keep client-side for now)

---

## 4-Week Implementation Plan

### WEEK 1: Backend Foundation & Authentication

#### Days 1-2: Backend Setup & Database
**Deliverables:**
- [ ] Node.js/Express project initialized
- [ ] PostgreSQL database (local + Railway production)
- [ ] Prisma ORM setup with initial schema
- [ ] Database migrations working
- [ ] AWS S3 bucket configured

**Tasks:**
```bash
# Initialize backend
mkdir backend && cd backend
npm init -y
npm install express prisma @prisma/client bcrypt jsonwebtoken dotenv cors

# Setup Prisma
npx prisma init
# Edit prisma/schema.prisma (see Database Schema section)
npx prisma migrate dev --name init

# Setup S3
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Database Tables:**
- User (email, password_hash, email_verified)
- CompanyProfile (user_id, name, industry, visibility)
- Document (profile_id, type, s3_url)
- Proposal (user_id, rfp_id, status, content_json, score)
- NetworkConnection (user_id, connected_profile_id, notes)

#### Days 3-4: Authentication System
**Deliverables:**
- [ ] User registration endpoint (`POST /api/auth/register`)
- [ ] Email verification workflow
- [ ] Login endpoint (`POST /api/auth/login`) with JWT
- [ ] Password hashing with bcrypt
- [ ] Protected route middleware
- [ ] Frontend: Login/Signup forms

**Endpoints:**
```typescript
POST /api/auth/register
  Body: { email, password, companyName }
  Returns: { message, userId }

POST /api/auth/login
  Body: { email, password }
  Returns: { token, user }

GET /api/auth/verify/:token
  Verifies email, redirects to login

GET /api/auth/me (protected)
  Headers: { Authorization: Bearer <token> }
  Returns: { user, profile }
```

#### Days 5-7: Profile & Document Management
**Deliverables:**
- [ ] Company profile CRUD endpoints
- [ ] Document upload to S3 with signed URLs
- [ ] Profile strength calculation
- [ ] Frontend: Refactor Profile.tsx to call API
- [ ] Frontend: File upload via backend

**Endpoints:**
```typescript
POST /api/profiles (protected)
  Body: { companyName, industry, contactInfo, visibility }
  Returns: { profile }

GET /api/profiles/:id (protected)
PUT /api/profiles/:id (protected)

POST /api/documents/upload (protected)
  Body: FormData with file
  Returns: { document, s3Url }

GET /api/documents/:id (protected)
  Returns: { presignedUrl }

DELETE /api/documents/:id (protected)
```

**Week 1 Demo:** Users can register, login, create profile, upload documents

**Status:** ~30% of PRD requirements complete

---

### WEEK 2: Proposal Generation & Management

#### Days 1-3: RFP Upload & Parsing (Backend Migration)
**Deliverables:**
- [ ] Move Gemini API key to backend .env
- [ ] RFP upload endpoints with S3 storage
- [ ] Move fileParser.ts logic to backend
- [ ] Gemini-based RFP parsing
- [ ] RFP validation UI
- [ ] Frontend: Refactor RfpUpload.tsx

**Migration:**
```typescript
// BEFORE (Frontend - services/geminiService.ts)
const apiKey = process.env.GEMINI_API_KEY; // ❌ Exposed

// AFTER (Backend - services/gemini.service.ts)
const apiKey = process.env.GEMINI_API_KEY; // ✅ Server-side only
```

**Endpoints:**
```typescript
POST /api/rfps/upload (protected)
  Body: FormData with PDF/DOCX
  Returns: { rfp, extractedData, confidenceScore }

GET /api/rfps/:id (protected)
PUT /api/rfps/:id/validate (protected)
  Body: { validatedData }
```

#### Days 4-5: Proposal Generation (Backend Migration)
**Deliverables:**
- [ ] Move generateProposal() to backend
- [ ] Pull user profile + documents from database
- [ ] Generate proposal using existing templates
- [ ] Store proposal as JSON in database
- [ ] DOCX/PDF export endpoints
- [ ] Frontend: Refactor ProposalModal.tsx

**Endpoints:**
```typescript
POST /api/proposals/generate (protected)
  Body: { rfpId, template, playbook }
  Returns: { proposal }

PUT /api/proposals/:id (protected)
  Body: { content }

GET /api/proposals/:id/export/docx (protected)
GET /api/proposals/:id/export/pdf (protected)
```

#### Days 6-7: Proposal Management Dashboard
**Deliverables:**
- [ ] Proposal list with filters
- [ ] Proposal status updates
- [ ] Proposal withdrawal
- [ ] Frontend: Refactor DashboardView.tsx
- [ ] Frontend: Refactor ProposalList.tsx

**Endpoints:**
```typescript
GET /api/proposals (protected)
  Query: ?status=draft&sort=createdAt&order=desc
  Returns: { proposals[] }

PUT /api/proposals/:id/withdraw (protected)
PUT /api/proposals/:id/status (protected)
  Body: { status }
```

**Week 2 Demo:** Full proposal workflow (upload RFP → generate → edit → export)

**Status:** ~55% of PRD requirements complete

---

### WEEK 3: Team Collaboration & Invitations

#### Days 1-2: Network Connections (Manual Entry)
**Deliverables:**
- [ ] Network connection CRUD endpoints
- [ ] Search/filter by capability
- [ ] Frontend: NetworkManagementView component
- [ ] Skip QR code (manual entry only)

**Endpoints:**
```typescript
POST /api/connections (protected)
  Body: { name, email, capabilities, notes }

GET /api/connections (protected)
  Query: ?capability=python&search=john

PUT /api/connections/:id (protected)
DELETE /api/connections/:id (protected)
```

#### Days 3-5: Team Invitations
**Deliverables:**
- [ ] ProposalTeam database table
- [ ] Email invitation workflow
- [ ] Invitation response handling
- [ ] Nodemailer + SendGrid setup
- [ ] Frontend: Team invitation UI
- [ ] Frontend: Team status tracking

**Database:**
```prisma
model ProposalTeam {
  id              String   @id @default(uuid())
  proposalId      String
  memberProfileId String
  role            String
  status          String   @default("invited") // invited | accepted | declined
  invitedAt       DateTime @default(now())
  respondedAt     DateTime?
}
```

**Endpoints:**
```typescript
POST /api/proposals/:id/invite (protected)
  Body: { profileId, role, message }

GET /api/invitations/:token (public)
  Returns: { invitation, proposal }

POST /api/invitations/:token/respond (public)
  Body: { response: 'accept' | 'decline', message }
```

**Email Template:**
```
Subject: You're invited to join [Proposal Title]

Hi [Name],

[Sender] has invited you to join their proposal team for [RFP Title].

Role: [Role]
Message: [Custom message]

[Accept] [Decline]
```

#### Days 6-7: Proposal Scoring (Basic Version)
**Deliverables:**
- [ ] Basic keyword matching algorithm
- [ ] Score updates when team added
- [ ] Frontend: Score display in ProposalCard
- [ ] Skip advanced ML threshold slider

**Algorithm:**
```typescript
function calculateProposalScore(rfp, userProfile, team) {
  // Compare RFP requirements vs capabilities
  const baseScore = matchKeywords(rfp.requirements, userProfile.capabilities);
  const teamBonus = team.reduce((acc, member) => {
    return acc + matchKeywords(rfp.requirements, member.capabilities);
  }, 0);
  return Math.min(100, baseScore + teamBonus);
}
```

**Endpoints:**
```typescript
POST /api/proposals/:id/calculate-score (protected)
  Returns: { score, breakdown }
```

**Week 3 Demo:** Send invite, accept/decline, see team status, score updates

**Status:** ~75% of PRD requirements complete

---

### WEEK 4: Marketplace, Polish & Deploy

#### Days 1-2: Basic Marketplace (Profile Directory)
**Deliverables:**
- [ ] Public marketplace endpoints
- [ ] Search/filter by capabilities, industry, location
- [ ] Profile visibility toggle
- [ ] Frontend: MarketplaceView component
- [ ] Skip job board bidding

**Endpoints:**
```typescript
GET /api/marketplace/profiles (public)
  Query: ?capability=python&industry=tech&location=sf
  Returns: { profiles[] }

GET /api/marketplace/profiles/:id (public)
  Returns: { profile, documents }
```

#### Days 3-4: Analytics & Tracking (Basic)
**Deliverables:**
- [ ] Proposal time tracking (upload → export)
- [ ] Team response rate tracking (48hr metric)
- [ ] Simple analytics cards in Dashboard
- [ ] Skip advanced visualizations

**Database:**
```prisma
model ProposalTimeTracking {
  id          String    @id @default(uuid())
  proposalId  String
  stage       String    // upload | parsing | generation | editing | export
  startedAt   DateTime
  completedAt DateTime?
}
```

**Endpoints:**
```typescript
GET /api/analytics/proposal-times (protected)
GET /api/analytics/team-responses (protected)
```

#### Days 5-6: Testing, Bug Fixes & Security
**Deliverables:**
- [ ] Security audit checklist
- [ ] User acceptance testing
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile responsiveness
- [ ] Performance optimization

**Security Checklist:**
- [ ] API key not exposed in frontend ✓
- [ ] All routes properly authenticated ✓
- [ ] Input validation on all endpoints ✓
- [ ] SQL injection prevention (Prisma handles) ✓
- [ ] File upload size limits ✓
- [ ] Rate limiting on auth endpoints
- [ ] CORS configured correctly
- [ ] HTTPS in production

#### Day 7: Deployment & Handoff
**Deliverables:**
- [ ] Backend deployed to Railway/Render
- [ ] Database on Railway PostgreSQL
- [ ] Frontend deployed to Vercel/Netlify
- [ ] AWS S3 production bucket
- [ ] Environment variables configured
- [ ] SSL certificates
- [ ] Documentation (user guide, API docs)
- [ ] Final demo with stakeholders

**Deployment:**
```bash
# Backend (Railway)
railway login
railway init
railway add postgresql
railway up

# Frontend (Vercel)
vercel login
vercel --prod

# Environment Variables
GEMINI_API_KEY=...
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
JWT_SECRET=...
SENDGRID_API_KEY=...
```

**Week 4 Demo:** Complete MVP deployed to production, fully tested

**Status:** ~85% of core PRD requirements complete

---

## Database Schema

### Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())

  profile       CompanyProfile?
  proposals     Proposal[]
  connections   NetworkConnection[] @relation("UserConnections")
}

model CompanyProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  companyName     String
  industry        String?
  contactInfo     Json?
  visibility      String   @default("private") // "public" | "private"
  profileStrength Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user           User           @relation(fields: [userId], references: [id])
  documents      Document[]
  teamMembers    ProposalTeam[]
}

model Document {
  id         String   @id @default(uuid())
  profileId  String
  type       String   // "capability" | "resume" | "certification"
  fileName   String
  s3Url      String
  uploadedAt DateTime @default(now())

  profile    CompanyProfile @relation(fields: [profileId], references: [id])
}

model RfpUpload {
  id            String   @id @default(uuid())
  userId        String
  fileName      String
  s3Url         String
  extractedData Json     // Parsed RFP data
  uploadedAt    DateTime @default(now())

  proposals     Proposal[]
}

model Proposal {
  id         String    @id @default(uuid())
  userId     String
  rfpId      String
  title      String
  status     String    @default("draft") // "draft" | "team_building" | "ready" | "submitted" | "withdrawn"
  content    Json      // Full proposal content
  score      Int       @default(0)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  exportedAt DateTime?

  user         User                    @relation(fields: [userId], references: [id])
  rfp          RfpUpload               @relation(fields: [rfpId], references: [id])
  team         ProposalTeam[]
  timeTracking ProposalTimeTracking[]
}

model ProposalTeam {
  id              String    @id @default(uuid())
  proposalId      String
  memberProfileId String
  role            String
  rateRange       Json?
  status          String    @default("invited") // "invited" | "accepted" | "declined"
  invitedAt       DateTime  @default(now())
  respondedAt     DateTime?

  proposal Proposal       @relation(fields: [proposalId], references: [id])
  member   CompanyProfile @relation(fields: [memberProfileId], references: [id])
}

model NetworkConnection {
  id                 String   @id @default(uuid())
  userId             String
  connectedProfileId String
  notes              String?
  connectionMethod   String   // "manual" | "qr" | "marketplace"
  connectedAt        DateTime @default(now())

  user User @relation("UserConnections", fields: [userId], references: [id])
}

model ProposalTimeTracking {
  id          String    @id @default(uuid())
  proposalId  String
  stage       String    // "upload" | "parsing" | "generation" | "editing" | "export"
  startedAt   DateTime
  completedAt DateTime?

  proposal Proposal @relation(fields: [proposalId], references: [id])
}
```

---

## Backend Architecture

### Folder Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── profile.controller.ts
│   │   ├── proposal.controller.ts
│   │   ├── team.controller.ts
│   │   ├── marketplace.controller.ts
│   │   └── analytics.controller.ts
│   ├── services/
│   │   ├── gemini.service.ts (moved from frontend)
│   │   ├── email.service.ts (Nodemailer)
│   │   ├── s3.service.ts (AWS SDK)
│   │   ├── parser.service.ts (PDF/DOCX parsing)
│   │   └── scoring.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts (JWT verification)
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── profile.routes.ts
│   │   ├── proposal.routes.ts
│   │   ├── team.routes.ts
│   │   ├── marketplace.routes.ts
│   │   └── analytics.routes.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── utils/
│   │   ├── jwt.util.ts
│   │   ├── email.templates.ts
│   │   └── validators.ts
│   └── index.ts (Express app entry)
├── .env
├── package.json
└── tsconfig.json
```

### Key Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "@aws-sdk/client-s3": "^3.454.0",
    "@aws-sdk/s3-request-presigner": "^3.454.0",
    "nodemailer": "^6.9.7",
    "@google/generative-ai": "^0.1.3",
    "pdfjs-dist": "^4.5.136",
    "mammoth": "^1.8.0",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/nodemailer": "^6.4.14",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2"
  }
}
```

---

## Migration Strategy

### Phase 1: Parallel Development (Week 1-2)
- Keep existing frontend running
- Build backend alongside
- Test backend endpoints with Postman/Thunder Client
- No changes to frontend yet

### Phase 2: Incremental Integration (Week 2-3)
- Replace frontend API calls one feature at a time
- Start with Auth → Profile → Proposals
- Keep fallback to localStorage during transition
- Gradual cutover

### Phase 3: Complete Migration (Week 3-4)
- Remove all localStorage dependencies
- All data flows through backend
- Remove Gemini API key from frontend .env
- Frontend only stores JWT token

### Example Migration

**BEFORE (Frontend - services/geminiService.ts):**
```typescript
export async function generateProposal(rfpText, profileData) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // ❌ Client-side
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

**AFTER (Backend - services/gemini.service.ts):**
```typescript
export async function generateProposal(rfpText, profileData) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // ✅ Server-side
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

**AFTER (Frontend - refactored call):**
```typescript
async function generateProposal(rfpId) {
  const response = await fetch('/api/proposals/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ rfpId })
  });
  return response.json();
}
```

---

## Risk Assessment

### HIGH RISK (Likely to cause delays)

| Risk | Mitigation |
|------|------------|
| **Backend architecture unfamiliarity** | Use Express.js boilerplate, pair programming |
| **S3 setup complexity** | Use presigned URLs, test early in Week 1 |
| **Database schema changes** | Design fully in Week 1, freeze schema after Day 2 |

### MEDIUM RISK

| Risk | Mitigation |
|------|------------|
| **Email deliverability** | Use SendGrid, verify domain, test with real emails early |
| **Gemini API rate limits** | Implement caching, batch requests, monitor usage |

### LOW RISK

| Risk | Mitigation |
|------|------------|
| **Frontend refactoring** | Incremental changes, test after each component |

---

## Success Criteria

### Must Work (End of Week 4)

- ✅ User can register and login
- ✅ User can create company profile and upload documents
- ✅ User can upload RFP and generate proposal
- ✅ User can edit proposal and export to DOCX/PDF
- ✅ User can manually add network connections
- ✅ User can invite team members to proposals
- ✅ Team members can accept/decline invitations
- ✅ Dashboard shows all proposals with status
- ✅ Basic marketplace shows public profiles

### Acceptable to Skip

- ⚠️ QR code scanning (manual entry is fine)
- ⚠️ Job board bidding (direct invites work)
- ⚠️ Advanced analytics (basic time tracking OK)
- ⚠️ Real-time updates (email notifications sufficient)

---

## Next Steps

### Immediate Actions (Start Monday)

#### Day 1 (Monday) - Setup Day

**Morning:**
1. Create `backend/` folder structure
2. Initialize Node.js project (`npm init`)
3. Install dependencies (Express, Prisma, AWS SDK, etc.)
4. Setup PostgreSQL (local + Railway)

**Afternoon:**
5. Design database schema in Prisma
6. Run first migration
7. Setup AWS S3 bucket
8. Create .env files (frontend + backend)

#### Day 2 (Tuesday) - Auth
1. Build registration endpoint
2. Build login endpoint
3. Build email verification
4. Test with Postman

#### Day 3-4 (Wed-Thu) - Profiles
1. Build profile CRUD endpoints
2. Build document upload to S3
3. Test full profile creation flow

**By Friday Week 1:** Demo working auth + profile creation

---

## Critical Decisions Needed

### Decision 1: Hosting Budget
- **Railway** (easiest): ~$20/month (backend + DB + S3)
- **AWS** (cheaper): ~$10/month but more complex setup
- **Heroku** (simple): ~$16/month

**Recommendation:** Railway for speed (4-week timeline)

### Decision 2: Email Service
- **SendGrid:** Free tier (100 emails/day)
- **AWS SES:** $0.10 per 1000 emails
- **Mailgun:** Free tier (5000 emails/month)

**Recommendation:** SendGrid for simplicity

### Decision 3: Features to Cut if Behind Schedule

Priority order (cut from bottom up):
1. ✅ Auth + Profiles (MUST HAVE)
2. ✅ Proposal generation (MUST HAVE)
3. ✅ Team invitations (MUST HAVE)
4. 🔶 Basic marketplace (NICE TO HAVE - cut if needed)
5. 🔶 Analytics tracking (NICE TO HAVE - cut if needed)
6. ❌ Scoring algorithm (CUT - use simple version)

---

## Tools & Resources Needed

### Backend
- Node.js 18+ installed
- PostgreSQL 14+ installed locally
- Railway account (for deployment)
- AWS account (for S3)
- Postman/Thunder Client (API testing)

### Services
- SendGrid account (free tier)
- Gemini API key (already have)

### Code Templates Available
- Express.js boilerplate
- Prisma schema template
- JWT auth middleware
- Email templates

---

## Change Log

All changes will be documented in `CHANGELOG.md` organized by:
- Week number
- Feature area
- Files modified
- Migration notes

**Format:**
```markdown
## Week 1 - Day 1 (2025-11-18)

### Backend Setup
- Created `backend/` folder structure
- Initialized Node.js project
- Files: `backend/package.json`, `backend/src/index.ts`

### Database
- Designed Prisma schema
- Created first migration
- Files: `backend/prisma/schema.prisma`
```

---

**Document Status:** Ready for Implementation
**Next Review:** End of Week 1 (2025-11-22)
**Owner:** Development Team
**Stakeholder:** Sean (Product Owner)
