# RFP Response Generator - Backend

Node.js + Express + TypeScript backend for the RFP Response Generator application.

## Tech Stack

- **Runtime:** Node.js 24.11.1
- **Framework:** Express 5.1.0
- **Language:** TypeScript 5.9.3
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (JWT)
- **AI:** Google Gemini API
- **File Storage:** Supabase Storage

## Quick Start

### Prerequisites

- Node.js 24+ (installed via nvm)
- Supabase account and project
- Google Gemini API key

### Installation

```bash
cd backend
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# AI
GEMINI_API_KEY=your-gemini-key

# CORS
FRONTEND_URL=http://localhost:5173
```

### Database Setup

1. Run the SQL migration in Supabase:
   - See `SUPABASE_SETUP_INSTRUCTIONS.md`
   - Execute `supabase_migration.sql`

2. Create storage buckets:
   - See `STORAGE_SETUP_GUIDE.md`
   - Create 3 buckets with RLS policies

### Start Development Server

```bash
npm run dev
```

Server runs at: `http://localhost:3001`

## Project Structure

```
backend/
├── src/
│   ├── controllers/          # Business logic
│   │   ├── auth.controller.ts
│   │   └── profile.controller.ts
│   ├── middleware/           # Express middleware
│   │   └── auth.middleware.ts
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── profile.routes.ts
│   │   └── test.routes.ts
│   ├── utils/               # Utilities
│   │   └── supabase.ts
│   └── index.ts            # Express app
├── supabase_migration.sql   # Database schema
├── API_DOCUMENTATION.md     # API reference
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset password

### Profiles
- `GET /api/profile` - Get own profile
- `PUT /api/profile` - Update profile
- `DELETE /api/profile` - Delete profile
- `GET /api/profile/marketplace` - Browse public profiles
- `GET /api/profile/:id` - Get public profile

### Testing
- `GET /health` - Health check
- `GET /api` - API info
- `GET /api/test/supabase` - Test DB connection

## Documentation

- **API Reference:** `API_DOCUMENTATION.md`
- **Database Setup:** `SUPABASE_SETUP_INSTRUCTIONS.md`
- **Storage Setup:** `STORAGE_SETUP_GUIDE.md`
- **Day 2 Summary:** `WEEK1_DAY2_SUMMARY.md`

## Testing

### Manual Testing

```bash
# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

### Automated Testing

```bash
bash test-auth.sh
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Code Style

- **Indentation:** 2 spaces
- **Quotes:** Single quotes
- **Semicolons:** Required
- **Naming:** camelCase for variables, PascalCase for types

## Security

- ✅ JWT authentication on protected routes
- ✅ Row Level Security (RLS) on database
- ✅ CORS configured for frontend only
- ✅ Password minimum 8 characters
- ✅ Input validation on all endpoints
- ✅ Secure file storage with RLS policies

## Database Schema

### Tables
1. `company_profiles` - User/company info
2. `documents` - File uploads
3. `rfp_uploads` - RFP documents
4. `proposals` - Generated proposals
5. `proposal_team` - Team members
6. `network_connections` - User network
7. `proposal_time_tracking` - Analytics

### Storage Buckets
1. `rfp-documents` - RFP files
2. `capability-statements` - Company docs
3. `proposal-exports` - Exported proposals

## Troubleshooting

### Common Issues

**Server won't start:**
```bash
# Check Node.js version
node --version  # Should be 24+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Database connection error:**
```bash
# Test Supabase connection
curl http://localhost:3001/api/test/supabase

# Check .env file has correct Supabase credentials
```

**Email validation error:**
- Disable email confirmation in Supabase for testing
- OR use a real email address
- See: Supabase Dashboard > Authentication > Providers

## Deployment

### Environment Variables

Set these in your production environment:
- `NODE_ENV=production`
- `PORT=3001`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `FRONTEND_URL`
- `JWT_SECRET` (generate new one)

### Build

```bash
npm run build
npm start
```

## Roadmap

### ✅ Week 1, Day 1 (Complete)
- Database setup
- Supabase integration
- Storage buckets

### ✅ Week 1, Day 2 (Complete)
- Authentication system
- User registration/login
- Profile management

### 🚧 Week 1, Day 3-4 (Next)
- Document upload
- File storage
- Document management

### 📅 Week 1, Day 5
- RFP parsing
- Gemini AI integration
- Data extraction

### 📅 Week 2
- Proposal generation
- Team building
- Collaboration features

## Contributing

1. Follow the code style guidelines
2. Write TypeScript with proper types
3. Add error handling
4. Update documentation
5. Test endpoints before committing

## Support

For issues or questions:
1. Check API documentation: `API_DOCUMENTATION.md`
2. Review setup guides in this directory
3. Check Supabase dashboard for errors
4. Review backend logs in terminal

## License

Private project - All rights reserved

---

**Current Status:** Authentication & Profiles Complete ✅
**Next:** Document Upload System
**Version:** 1.0.0
**Last Updated:** 2025-11-17
