# Team Collaboration Test Data

Mock data has been created to test the team collaboration features of the RFP Response Generator.

## Test Users

All test accounts use the password: `password123`

### 1. Alice Johnson (Proposal Owner)
- **Email**: alice@example.com
- **Company**: Acme Consulting
- **Role**: Proposal creator/owner
- **What to test**:
  - View proposals with team members
  - Send team invitations
  - See invitation acceptance/decline notifications

### 2. Bob Smith (Team Member)
- **Email**: bob@example.com
- **Company**: Tech Solutions Inc
- **Role**: Invited team member (Senior Developer & Backend Engineer)
- **What to test**:
  - View pending invitations
  - Accept invitations
  - Collaborate on proposals

### 3. Carol Williams (Team Member)
- **Email**: carol@example.com
- **Company**: Design Studio Pro
- **Role**: Invited team member (UI/UX Designer)
- **What to test**:
  - View pending invitations
  - Decline invitations
  - See how declined invitations appear

### 4. David Brown (Team Member)
- **Email**: david@example.com
- **Company**: Development Experts
- **Role**: Potential team member (Data Scientist)
- **What to test**:
  - Receive invitations
  - Team collaboration features

## Mock Proposals

### City Transportation Platform
- **Owner**: Alice Johnson (Acme Consulting)
- **Status**: Draft
- **Team Invitations**:
  - Bob Smith - Senior Developer
  - Carol Williams - UI/UX Designer
- **Content**: Includes executive summary, technical approach, resources, budget breakdown

## How to Test

### 1. Test as Proposal Owner (Alice)
```bash
1. Login with alice@example.com / password123
2. Navigate to proposals
3. View "City Transportation Platform"
4. See team members tab
5. Try inviting additional team members
6. Check notifications when team members respond
```

### 2. Test as Team Member (Bob or Carol)
```bash
1. Login with bob@example.com or carol@example.com / password123
2. Navigate to "My Invitations" or notifications
3. See pending invitation for "City Transportation Platform"
4. Click to view invitation details
5. Accept or decline the invitation
6. Verify email notification is sent to Alice
```

### 3. Test Email Notifications (if Resend API key is configured)
```bash
1. Invite a team member (as Alice)
2. Check email inbox for invitation email
3. Accept invitation (as team member)
4. Check Alice's email for acceptance notification
5. Decline invitation (as another team member)
6. Check Alice's email for decline notification
```

## Features to Test

✅ **Team Invitations**
- Send invitations with custom roles
- Specify rate ranges
- Add personal messages
- View invitation link

✅ **Invitation Management**
- View all sent invitations
- View all received invitations
- Filter by status (pending/accepted/declined)
- See invitation timestamps

✅ **Email Notifications**
- Invitation emails with branded templates
- Acceptance notifications to proposal owner
- Decline notifications to proposal owner
- Professional HTML email formatting

✅ **Team Collaboration**
- See team members on proposals
- View team member roles and rates
- Remove team members
- Track invitation history

## API Endpoints to Test

**Team Invitations**:
- `POST /api/team/invite` - Send invitation
- `GET /api/team/invitations` - Get my invitations
- `GET /api/team/proposal/:id` - Get team for proposal
- `POST /api/team/invitations/:id/accept` - Accept invitation
- `POST /api/team/invitations/:id/decline` - Decline invitation
- `DELETE /api/team/proposal/:proposalId/member/:memberId` - Remove team member

## Reset Test Data

To recreate the test data from scratch:

```bash
# Option 1: Run seed script (handles existing users automatically)
cd backend
npm run seed

# Option 2: Delete test users from Supabase Auth dashboard first, then run seed script
# This ensures completely fresh data
```

**Note:** The seed script now automatically handles existing users and will create missing profiles and proposals.

## Notes

- The seed script automatically creates 4 users with profiles
- One proposal is created with team invitations
- Email notifications require RESEND_API_KEY to be configured in `.env`
- All passwords are `password123` for easy testing
- Users can be managed from Supabase Auth dashboard

## Troubleshooting

**"User already exists" error**:
- Users from previous run still exist
- Either use existing users or delete them from Supabase first

**"Profile not found" error**:
- Profile wasn't created for user
- Check if company_profiles table has the user_id

**Email not sending**:
- Check RESEND_API_KEY in `.env`
- Check FROM_EMAIL in `.env`
- Verify email logs in backend console
