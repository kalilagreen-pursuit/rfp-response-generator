# Endpoint Testing Guide
**RFP Response Generator - Complete API Testing Checklist**

## Testing Setup
- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173
- **API Documentation:** http://localhost:3001/api

## Testing Order

We'll test endpoints in this order to ensure dependencies are met:
1. Authentication (required for all other endpoints)
2. Profile Management (required for documents & proposals)
3. Documents (required for proposal generation)
4. RFP Upload & Parsing
5. Proposal Generation & Management
6. Network Connections
7. Export Functionality

---

## 1. Authentication Endpoints ✓

### 1.1 Register New User
**Endpoint:** `POST /api/auth/register`

**Test in Frontend:**
1. Go to http://localhost:5173
2. If not logged in, you should see login/signup screen
3. Click "Sign Up" or "Register"
4. Fill in:
   - Email: test@example.com
   - Password: Test123456!
5. Submit form

**Expected Result:**
- Success message
- User created in database
- Redirected or shown next step

**Verify:**
- [ ] User registration successful
- [ ] No errors in console
- [ ] Backend logs show successful registration

---

### 1.2 Login
**Endpoint:** `POST /api/auth/login`

**Test in Frontend:**
1. Go to http://localhost:5173
2. Click "Log In"
3. Enter credentials from registration
4. Submit

**Expected Result:**
- Success message
- Access token received
- Redirected to dashboard

**Verify:**
- [ ] Login successful
- [ ] Token stored (check localStorage or cookies)
- [ ] User sees authenticated UI
- [ ] Backend logs show successful login

---

### 1.3 Get Current User
**Endpoint:** `GET /api/auth/me`

**Test in Frontend:**
1. After logging in, check if user data loads
2. Open browser DevTools > Network tab
3. Look for request to `/api/auth/me`

**Expected Result:**
- User profile data returned
- Email and ID visible

**Verify:**
- [ ] User data loads correctly
- [ ] Request shows 200 status
- [ ] No authentication errors

---

## 2. Profile Management Endpoints ✓

### 2.1 Get Profile
**Endpoint:** `GET /api/profile`

**Test in Frontend:**
1. Navigate to Profile section/tab
2. Open DevTools > Network
3. Look for `/api/profile` request

**Expected Result:**
- Profile data loads (may be empty for new user)
- Company name field visible

**Verify:**
- [ ] Profile page loads
- [ ] No 404 errors (404 is OK if profile doesn't exist yet)
- [ ] UI shows profile form

---

### 2.2 Update Profile
**Endpoint:** `PUT /api/profile`

**Test in Frontend:**
1. Go to Profile page
2. Fill in Company Name: "Test Company Inc."
3. Fill in SMS Number: "555-123-4567"
4. Save changes

**Expected Result:**
- Success toast message
- Profile data saved
- Fields update with saved values

**Verify:**
- [ ] Company name saved
- [ ] SMS number saved
- [ ] Success message displayed
- [ ] Page doesn't reload unnecessarily

---

## 3. Document Upload Endpoints ✓

### 3.1 Upload Document
**Endpoint:** `POST /api/documents/upload`

**Test in Frontend:**
1. Go to Profile page
2. Find document upload section
3. Click "Upload" for Capability Statement
4. Select a PDF or DOCX file
5. Upload file

**Expected Result:**
- Upload progress shown
- Success message
- Document appears in list

**Verify:**
- [ ] File uploads successfully
- [ ] Document appears in profile
- [ ] File size shown correctly
- [ ] Can download/view document

---

### 3.2 Get Documents
**Endpoint:** `GET /api/documents`

**Test in Frontend:**
1. After uploading, check if documents list loads
2. Refresh page
3. Documents should still be visible

**Expected Result:**
- All uploaded documents visible
- Correct file names and types

**Verify:**
- [ ] Documents list loads
- [ ] Document metadata correct (name, type, size)
- [ ] Multiple documents supported

---

### 3.3 Delete Document
**Endpoint:** `DELETE /api/documents/:id`

**Test in Frontend:**
1. Find delete button on uploaded document
2. Click delete
3. Confirm if prompted

**Expected Result:**
- Document removed from list
- Success message
- Document removed from storage

**Verify:**
- [ ] Document deleted successfully
- [ ] UI updates immediately
- [ ] No errors in console

---

## 4. RFP Upload & Parsing Endpoints ✓

### 4.1 Upload RFP
**Endpoint:** `POST /api/rfp/upload`

**Test in Frontend:**
1. Go to Dashboard or RFP Upload section
2. Click "Upload RFP" or similar button
3. Select an RFP PDF/DOCX file
4. Upload

**Expected Result:**
- File uploads
- Parsing starts (may show loading)
- Extracted data displayed

**Verify:**
- [ ] RFP uploads successfully
- [ ] Parsing completes
- [ ] Extracted data shown (deadline, requirements, etc.)
- [ ] No timeout errors

---

### 4.2 Get RFPs
**Endpoint:** `GET /api/rfp`

**Test in Frontend:**
1. After uploading, check RFP list
2. Refresh page
3. RFPs should be visible

**Expected Result:**
- List of uploaded RFPs
- File names and dates visible

**Verify:**
- [ ] RFP list loads
- [ ] RFP metadata correct
- [ ] Can click to view details

---

### 4.3 Reparse RFP
**Endpoint:** `POST /api/rfp/:id/reparse`

**Test in Frontend:**
1. View RFP details
2. Look for "Re-parse" or "Analyze Again" button
3. Click to trigger re-parsing

**Expected Result:**
- Re-parsing starts
- Updated data shown
- Success message

**Verify:**
- [ ] Re-parsing works
- [ ] Data updates
- [ ] No errors

---

## 5. Proposal Generation & Management Endpoints ✓

### 5.1 Generate Proposal
**Endpoint:** `POST /api/proposals/generate`

**Test in Frontend:**
1. From RFP details page, click "Generate Proposal"
2. Select template (Standard/Creative/Technical)
3. Select team profile if available
4. Click Generate

**Expected Result:**
- Generation starts (may take 30-60 seconds)
- Loading indicator shown
- Proposal created and displayed

**Verify:**
- [ ] Proposal generates successfully
- [ ] All sections populated (Executive Summary, Technical Approach, etc.)
- [ ] Company name appears in proposal
- [ ] Resources/team included
- [ ] Investment estimate shown

---

### 5.2 Get Proposals
**Endpoint:** `GET /api/proposals`

**Test in Frontend:**
1. Go to Dashboard or Proposals list
2. Check if proposals load

**Expected Result:**
- List of proposals
- Status badges visible
- RFP name shown for each

**Verify:**
- [ ] Proposals list loads
- [ ] Proposal metadata correct
- [ ] Can filter by status
- [ ] Pagination works if many proposals

---

### 5.3 Get Proposal by ID
**Endpoint:** `GET /api/proposals/:id`

**Test in Frontend:**
1. Click on a proposal from list
2. Proposal details should load

**Expected Result:**
- Full proposal content displayed
- All sections visible
- Editable fields work

**Verify:**
- [ ] Proposal details load
- [ ] Content renders correctly
- [ ] Can view all sections

---

### 5.4 Update Proposal
**Endpoint:** `PUT /api/proposals/:id`

**Test in Frontend:**
1. Open proposal details
2. Edit a section (e.g., Executive Summary)
3. Save changes

**Expected Result:**
- Changes saved
- Success message
- Content updates

**Verify:**
- [ ] Edit functionality works
- [ ] Changes persist after page reload
- [ ] No data loss

---

### 5.5 Update Proposal Status
**Endpoint:** `PUT /api/proposals/:id/status`

**Test in Frontend:**
1. Open proposal
2. Look for status dropdown/buttons
3. Change status (Draft → Team Building → Ready → Submitted)

**Expected Result:**
- Status updates
- Badge/indicator changes color
- Success message

**Verify:**
- [ ] Status updates correctly
- [ ] UI reflects new status
- [ ] Status persists

---

### 5.6 Withdraw Proposal
**Endpoint:** `PUT /api/proposals/:id/withdraw`

**Test in Frontend:**
1. Open a submitted proposal
2. Look for "Withdraw" button
3. Click withdraw
4. Confirm if prompted

**Expected Result:**
- Status changes to "Withdrawn"
- Success message
- Proposal marked appropriately

**Verify:**
- [ ] Withdrawal works
- [ ] Status updates to withdrawn
- [ ] UI updates

---

### 5.7 Delete Proposal
**Endpoint:** `DELETE /api/proposals/:id`

**Test in Frontend:**
1. Find delete option on proposal
2. Click delete
3. Confirm deletion

**Expected Result:**
- Proposal deleted
- Removed from list
- Success message

**Verify:**
- [ ] Deletion works
- [ ] Proposal removed from database
- [ ] No errors

---

## 6. Export Endpoints ✓

### 6.1 Export as PDF
**Endpoint:** `GET /api/proposals/:id/export/pdf`

**Test in Frontend:**
1. Open proposal details
2. Click "Export as PDF" or download button
3. PDF should download

**Expected Result:**
- PDF file downloads
- Professional formatting
- Company name in header
- All sections included
- Investment table formatted
- Resources table formatted

**Verify:**
- [ ] PDF downloads successfully
- [ ] Company branding present (Liceria Corporate style)
- [ ] All content sections included
- [ ] Investment Estimate formatted professionally
- [ ] Resources table with role descriptions
- [ ] Title page present
- [ ] Table of contents present
- [ ] Closing page present

---

### 6.2 Export as DOCX
**Endpoint:** `GET /api/proposals/:id/export/docx`

**Test in Frontend:**
1. Open proposal details
2. Click "Export as DOCX" or Word button
3. DOCX should download

**Expected Result:**
- DOCX file downloads
- Can open in Microsoft Word
- All sections included
- Editable content

**Verify:**
- [ ] DOCX downloads successfully
- [ ] File opens in Word/Google Docs
- [ ] All content present
- [ ] Formatting preserved
- [ ] Company name included

---

## 7. Network Connection Endpoints (NEW!) ✓

### 7.1 Create Network Connection
**Endpoint:** `POST /api/network/connections`

**Test in Frontend:**
1. Go to Network/Connections section
2. Click "Add Connection" or similar
3. Fill in:
   - Contact Name: "John Doe"
   - Email: "john@example.com"
   - Capabilities: ["JavaScript", "React", "Node.js"]
   - Notes: "Met at conference"
4. Save

**Expected Result:**
- Connection created
- Appears in connections list
- Success message

**Verify:**
- [ ] Connection created successfully
- [ ] Email validation works
- [ ] Capabilities saved as array
- [ ] Notes field optional

---

### 7.2 Get Network Connections
**Endpoint:** `GET /api/network/connections`

**Test in Frontend:**
1. Navigate to Network/Connections page
2. Connections list should load

**Expected Result:**
- List of all connections
- Contact names and emails visible
- Capabilities shown

**Verify:**
- [ ] Connections list loads
- [ ] Pagination works
- [ ] Search functionality works
- [ ] Can filter by capability

---

### 7.3 Update Connection
**Endpoint:** `PUT /api/network/connections/:id`

**Test in Frontend:**
1. Click edit on a connection
2. Modify fields (name, email, capabilities, notes)
3. Save changes

**Expected Result:**
- Changes saved
- Connection updated
- Success message

**Verify:**
- [ ] Update works
- [ ] All fields editable
- [ ] Changes persist

---

### 7.4 Delete Connection
**Endpoint:** `DELETE /api/network/connections/:id`

**Test in Frontend:**
1. Click delete on a connection
2. Confirm deletion

**Expected Result:**
- Connection deleted
- Removed from list
- Success message

**Verify:**
- [ ] Deletion works
- [ ] Connection removed
- [ ] No errors

---

### 7.5 Search by Capability
**Endpoint:** `GET /api/network/connections/search/capabilities?q=React`

**Test in Frontend:**
1. Use search/filter on connections page
2. Enter capability (e.g., "React")
3. Results should filter

**Expected Result:**
- Only matching connections shown
- Search is case-insensitive
- Clear results

**Verify:**
- [ ] Search works
- [ ] Results filtered correctly
- [ ] Can clear search

---

### 7.6 Connection Statistics
**Endpoint:** `GET /api/network/connections/stats`

**Test in Frontend:**
1. Look for stats/analytics section
2. Should show connection counts

**Expected Result:**
- Total connections count
- Breakdown by connection method
- Top capabilities listed

**Verify:**
- [ ] Stats load correctly
- [ ] Numbers accurate
- [ ] Updates when connections change

---

## 8. Marketplace Endpoints (Existing) ✓

### 8.1 Get Public Profiles
**Endpoint:** `GET /api/profile/marketplace`

**Test in Frontend:**
1. Navigate to Marketplace section
2. List of public profiles should load

**Expected Result:**
- Public profiles visible
- Can search/filter
- Profile cards show key info

**Verify:**
- [ ] Marketplace loads
- [ ] Only public profiles shown
- [ ] Search works
- [ ] Can view profile details

---

## Common Issues to Check

### During Testing, Watch For:

1. **Authentication Issues**
   - [ ] Token expiration handling
   - [ ] Logout functionality
   - [ ] Protected routes redirect to login

2. **Error Handling**
   - [ ] User-friendly error messages
   - [ ] No blank error screens
   - [ ] Console errors handled

3. **Loading States**
   - [ ] Spinners/loading indicators shown
   - [ ] No hanging requests
   - [ ] Timeout handling

4. **Data Persistence**
   - [ ] Data saves correctly
   - [ ] Page refresh doesn't lose data
   - [ ] Edits persist

5. **File Operations**
   - [ ] File uploads work with various sizes
   - [ ] File type validation
   - [ ] Download works for all browsers

6. **UI/UX Issues**
   - [ ] Forms validate input
   - [ ] Success/error toasts appear
   - [ ] Buttons disable during operations
   - [ ] Responsive on mobile

---

## Testing Checklist Summary

Use this quick checklist to track overall progress:

### Core Functionality
- [ ] User can register and login
- [ ] User can create/update profile
- [ ] User can upload documents
- [ ] User can upload RFP
- [ ] User can generate proposal
- [ ] User can export proposal (PDF & DOCX)
- [ ] User can manage network connections

### Advanced Features
- [ ] Proposal refinement works
- [ ] Status management works
- [ ] Search and filters work
- [ ] Marketplace visible
- [ ] Statistics display correctly

### Quality Checks
- [ ] No console errors
- [ ] Professional PDF formatting
- [ ] All data persists correctly
- [ ] Performance acceptable (< 3s for most operations)
- [ ] Mobile responsive

---

## Next Steps After Testing

Once all endpoints are verified:
1. Document any bugs found
2. Fix critical issues
3. Proceed to Week 3 Days 3-5: Team Invitations
4. Continue to Week 4: Final polish and deployment

---

**Testing Date:** _____________________
**Tester:** _____________________
**Issues Found:** _____________________
