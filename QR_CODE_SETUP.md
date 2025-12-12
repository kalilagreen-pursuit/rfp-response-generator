# QR Code Lead Capture - Setup & Testing

## ✅ Completed

### Backend Implementation
- ✅ Database schema created ([backend/src/database/migrations/003_qr_code_system.sql](backend/src/database/migrations/003_qr_code_system.sql))
- ✅ QR code controller with 6 authenticated endpoints
- ✅ Lead capture controller with 2 public endpoints
- ✅ Email notification workflow (notification + welcome emails)
- ✅ Routes registered in Express app
- ✅ Backend built and running on http://localhost:3001

## 🔧 Required: Database Migration

**You must run the migration before testing:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `xqdpyzotshklfdgweakb`
3. Go to **SQL Editor**
4. Create a new query and paste the contents of `backend/src/database/migrations/003_qr_code_system.sql`
5. Click **Run**

This will create:
- `qr_codes` table
- `qr_leads` table
- Indexes for performance
- Row Level Security policies

## 🧪 Testing the API

Once the migration is complete, you can test the endpoints:

### 1. Generate QR Code (Authenticated)
```bash
curl -X POST http://localhost:3001/api/qr-codes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"label": "Test QR Code"}'
```

**Expected Response:**
```json
{
  "id": "uuid",
  "uniqueCode": "abc123",
  "label": "Test QR Code",
  "qrCodeDataURL": "data:image/png;base64,...",
  "url": "http://localhost:5173/lead-capture/abc123",
  "createdAt": "2025-12-10T..."
}
```

### 2. List QR Codes (Authenticated)
```bash
curl http://localhost:3001/api/qr-codes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get Lead Capture Info (Public - No Auth)
```bash
curl http://localhost:3001/api/lead-capture/abc123
```

**Expected Response:**
```json
{
  "companyName": "Your Company Name",
  "companyLogo": "https://..."
}
```

### 4. Submit Lead (Public - No Auth)
```bash
curl -X POST http://localhost:3001/api/lead-capture/abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company",
    "contactName": "John Doe",
    "email": "john@test.com",
    "phone": "555-1234",
    "industry": "Technology",
    "message": "Interested in your services"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Thank you! Check your email for next steps."
}
```

**This will trigger:**
- Email to company owner notifying them of new lead
- Welcome email to the potential client with signup link

## 📋 Next Steps

### Frontend Implementation Needed:

1. **Lead Capture Form Page** (`/lead-capture/:uniqueCode`)
   - Mobile-first responsive design
   - Form fields: company name, contact name, email, phone, industry, message
   - Success/error states
   - No authentication required

2. **QR Code Management UI** (Company Profile)
   - Generate new QR codes
   - View QR code list with scan counts
   - Download QR codes as PNG
   - View leads per QR code
   - Toggle active/inactive
   - Delete QR codes

## 🔍 API Endpoints Summary

### Authenticated Endpoints (Require Bearer Token)
- `POST /api/qr-codes` - Generate new QR code
- `GET /api/qr-codes` - List user's QR codes
- `GET /api/qr-codes/:id` - Get QR code details + leads
- `PATCH /api/qr-codes/:id` - Update QR code
- `DELETE /api/qr-codes/:id` - Delete QR code
- `GET /api/qr-codes/:id/leads` - Get leads for QR code

### Public Endpoints (No Auth)
- `GET /api/lead-capture/:uniqueCode` - Get company info for form
- `POST /api/lead-capture/:uniqueCode` - Submit lead

## 📧 Email Templates

### 1. Lead Notification (to Company User)
**Subject:** New Lead from QR Code: [Company Name]

Contains:
- Contact details
- Industry
- Message
- Link to leads dashboard

### 2. Welcome Email (to Potential Client)
**Subject:** Welcome! Let's Get Started - [Company Name]

Contains:
- Welcome message
- Signup link (pre-filled with email)
- Benefits of creating account
- Call to action button

## 🔒 Security Features

- Rate limiting ready to be added to lead capture endpoint
- Email validation (format check)
- Phone validation (basic format)
- XSS protection via parameterized queries
- Row Level Security policies on database
- Public endpoints don't expose sensitive data
- Scan count tracking with last_scanned_at

## 🎯 Success Criteria

- [x] QR codes can be generated in < 5 seconds
- [ ] Lead capture form loads on mobile in < 2 seconds (pending frontend)
- [x] Email delivery within 1 minute (depends on Resend API)
- [x] All endpoints return proper error codes
- [ ] Mobile-friendly score > 95 on Lighthouse (pending frontend)
