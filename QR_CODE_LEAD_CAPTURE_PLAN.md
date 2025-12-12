# QR Code Lead Capture Feature - Implementation Plan

## Overview
A lead capture system where users can generate unique QR codes for marketing materials, events, or their website. When potential clients scan the QR code, they're directed to a mobile-optimized form to provide preliminary contact information, which triggers an automated email workflow to onboard them.

## User Flow

### 1. QR Code Generation (Company User)
- Company user logs into their profile
- Navigates to a "Lead Capture" or "Marketing Tools" section
- Generates a unique QR code linked to their company profile
- Can download the QR code as PNG/SVG for use in:
  - Business cards
  - Marketing materials
  - Event booths
  - Website
  - Social media

### 2. Lead Scanning & Capture (Potential Client)
- Potential client scans QR code with their phone
- Redirected to: `https://rfp-response-generator.vercel.app/lead-capture/:uniqueId`
- Sees mobile-optimized form with fields:
  - Company Name (required)
  - Contact Name (required)
  - Email (required)
  - Phone (required)
  - Industry (optional dropdown)
  - Message/Interest (optional textarea)

### 3. Email Workflow
- Upon form submission:
  - Lead data saved to database
  - Two emails sent:
    1. **To Company User**: "New lead captured from QR code"
    2. **To Potential Client**: Welcome email with signup link

## Database Schema

### New Table: `qr_codes`
```sql
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  unique_code VARCHAR(50) UNIQUE NOT NULL, -- Short unique identifier
  label VARCHAR(255), -- Optional label like "Trade Show 2024"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMPTZ
);

CREATE INDEX idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_unique_code ON qr_codes(unique_code);
CREATE INDEX idx_qr_codes_profile_id ON qr_codes(profile_id);
```

### New Table: `qr_leads`
```sql
CREATE TABLE qr_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  company_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  industry VARCHAR(100),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  invited_at TIMESTAMPTZ, -- When invitation email was sent
  converted_to_user BOOLEAN DEFAULT FALSE,
  converted_user_id UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_qr_leads_qr_code_id ON qr_leads(qr_code_id);
CREATE INDEX idx_qr_leads_company_owner_id ON qr_leads(company_owner_id);
CREATE INDEX idx_qr_leads_email ON qr_leads(email);
CREATE INDEX idx_qr_leads_created_at ON qr_leads(created_at DESC);
```

## Backend API Endpoints

### QR Code Management
```typescript
// Generate new QR code
POST /api/qr-codes
Body: { label?: string }
Returns: { id, uniqueCode, qrCodeDataURL, label }

// List user's QR codes
GET /api/qr-codes
Returns: [{ id, uniqueCode, label, scanCount, createdAt, isActive }]

// Get QR code details
GET /api/qr-codes/:id
Returns: { id, uniqueCode, label, scanCount, leads: [], createdAt }

// Toggle QR code active status
PATCH /api/qr-codes/:id
Body: { isActive: boolean }

// Delete QR code
DELETE /api/qr-codes/:id
```

### Lead Capture
```typescript
// Get QR code info for lead capture page (public endpoint)
GET /api/lead-capture/:uniqueCode
Returns: { companyName, companyLogo?, industries: [] }

// Submit lead form (public endpoint)
POST /api/lead-capture/:uniqueCode
Body: {
  companyName: string,
  contactName: string,
  email: string,
  phone: string,
  industry?: string,
  message?: string
}
Returns: { success: true, message: "Check your email..." }

// List leads for a QR code (authenticated)
GET /api/qr-codes/:id/leads
Returns: [{ id, companyName, contactName, email, phone, createdAt }]
```

## Frontend Components

### 1. QR Code Management Page (`/marketing/qr-codes`)
- **Location**: `components/QRCodeManagement.tsx`
- **Features**:
  - List of all user's QR codes
  - "Generate New QR Code" button
  - Each QR code shows:
    - QR code image preview
    - Label
    - Scan count
    - Download buttons (PNG, SVG)
    - Copy link button
    - Toggle active/inactive
    - Delete option
    - View leads button

### 2. Lead Capture Form (`/lead-capture/:uniqueCode`)
- **Location**: `components/LeadCaptureForm.tsx`
- **Features**:
  - Mobile-first responsive design
  - Shows company branding (if available)
  - Form fields with validation
  - Loading states
  - Success confirmation
  - Error handling

### 3. Leads Dashboard (`/marketing/leads`)
- **Location**: `components/LeadsDashboard.tsx`
- **Features**:
  - Table view of all leads
  - Filter by QR code
  - Search by company name or contact
  - Export to CSV
  - Bulk actions (invite, archive)
  - Individual lead actions (invite, convert to connection)

## Email Templates

### 1. Lead Notification Email (to Company User)
```
Subject: New Lead from QR Code: [Company Name]

Hi [User Name],

Great news! You have a new lead from your QR code "[QR Label]".

Contact Details:
- Company: [Company Name]
- Name: [Contact Name]
- Email: [Email]
- Phone: [Phone]
- Industry: [Industry]

Message:
[Message]

View all leads: [Dashboard Link]

---
RFP Response Generator
```

### 2. Welcome Email (to Potential Client)
```
Subject: Welcome! Let's Get Started - [Company Name]

Hi [Contact Name],

Thank you for connecting with [Company Name]! We're excited to work with you.

To get started, please create your account and complete your company profile:

[Sign Up Link with pre-filled email]

Once your profile is complete, you'll be able to:
✓ Submit RFPs and receive proposals
✓ Connect with verified companies
✓ Manage your procurement workflow

Questions? Reply to this email - we're here to help!

Best regards,
The [Company Name] Team

---
RFP Response Generator
```

## Implementation Phases

### Phase 1: Database & Backend (Estimated: 2-3 hours)
- [ ] Create migration files for new tables
- [ ] Run migrations on Supabase
- [ ] Create QR code controller (`backend/src/controllers/qr.controller.ts`)
- [ ] Create lead capture controller (`backend/src/controllers/lead-capture.controller.ts`)
- [ ] Add routes (`backend/src/routes/qr.routes.ts`)
- [ ] Implement QR code generation using `qrcode` package
- [ ] Add email templates

### Phase 2: Frontend - QR Management (Estimated: 2-3 hours)
- [ ] Create QRCodeManagement component
- [ ] Add route in App.tsx
- [ ] Implement QR code generation UI
- [ ] Add download functionality
- [ ] Create leads view per QR code

### Phase 3: Frontend - Lead Capture (Estimated: 2 hours)
- [ ] Create LeadCaptureForm component
- [ ] Add public route (no auth required)
- [ ] Implement mobile-responsive design
- [ ] Add form validation
- [ ] Success/error states

### Phase 4: Email Integration (Estimated: 1-2 hours)
- [ ] Add email templates to email.service.ts
- [ ] Test email sending
- [ ] Handle email failures gracefully

### Phase 5: Testing & Polish (Estimated: 1-2 hours)
- [ ] Test QR code generation
- [ ] Test lead capture flow end-to-end
- [ ] Test emails
- [ ] Mobile responsiveness testing
- [ ] Error handling edge cases

## Security Considerations

1. **Rate Limiting**: Add rate limiting to lead capture endpoint to prevent spam
2. **CAPTCHA**: Consider adding reCAPTCHA to lead form
3. **Email Validation**: Verify email format and potentially check for disposable emails
4. **Phone Validation**: Basic phone number format validation
5. **XSS Protection**: Sanitize all user inputs, especially message field
6. **SQL Injection**: Use parameterized queries (already handled by Supabase)

## Analytics & Tracking

Track the following metrics:
- Total QR codes generated per user
- Total scans per QR code
- Conversion rate (leads → signups)
- Lead source breakdown
- Most effective QR codes

## Future Enhancements

1. **Custom QR Design**: Allow users to customize QR code colors, add logo
2. **Analytics Dashboard**: Visual charts showing scan trends, conversion rates
3. **Lead Scoring**: Automatically score leads based on industry, company size
4. **CRM Integration**: Export leads to popular CRMs
5. **Multi-language Support**: Lead capture form in multiple languages
6. **SMS Notifications**: Optional SMS alerts for new leads
7. **QR Code Expiration**: Set expiration dates for time-limited campaigns
8. **A/B Testing**: Generate multiple QR codes to test different messaging

## Dependencies

### Backend
- `qrcode` - Already installed ✅
- `@types/qrcode` - Already installed ✅

### Frontend
- No additional dependencies needed (using built-in fetch API)

## Environment Variables

No new environment variables needed. Will use existing:
- `FRONTEND_URL` - For generating QR code URLs
- `RESEND_API_KEY` - For sending emails
- `FROM_EMAIL` - Email sender address

## Success Metrics

- Company users can generate QR codes in < 5 seconds
- Lead capture form loads on mobile in < 2 seconds
- Email delivery within 1 minute of form submission
- 0 email delivery failures
- Mobile-friendly score > 95 on Google Lighthouse
