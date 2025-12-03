/**
 * Seed script for team collaboration testing
 * Creates mock users, proposals, and team invitations
 */

import { supabase } from '../utils/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

interface MockUser {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
}

const mockUsers: MockUser[] = [
  {
    email: 'alice@example.com',
    password: 'password123',
    fullName: 'Alice Johnson',
    companyName: 'Acme Consulting'
  },
  {
    email: 'bob@example.com',
    password: 'password123',
    fullName: 'Bob Smith',
    companyName: 'Tech Solutions Inc'
  },
  {
    email: 'carol@example.com',
    password: 'password123',
    fullName: 'Carol Williams',
    companyName: 'Design Studio Pro'
  },
  {
    email: 'david@example.com',
    password: 'password123',
    fullName: 'David Brown',
    companyName: 'Development Experts'
  }
];

const mockProposals = [
  {
    title: 'City Transportation Platform',
    status: 'draft',
    content: {
      executiveSummary: 'A comprehensive transportation management system for the city.',
      technicalApproach: 'We will use modern web technologies including React and Node.js.',
      projectTimeline: 'Phase 1: Discovery (2 weeks)\nPhase 2: Development (8 weeks)\nPhase 3: Testing (2 weeks)',
      valueProposition: 'This solution will reduce transportation costs by 30%.',
      resources: [
        {
          role: 'Project Manager',
          hours: 160,
          lowRate: 120,
          highRate: 150,
          description: 'Oversees the entire project lifecycle and coordinates team efforts.'
        },
        {
          role: 'Senior Developer',
          hours: 320,
          lowRate: 100,
          highRate: 140,
          description: 'Leads development of core features and mentors junior developers.'
        },
        {
          role: 'UI/UX Designer',
          hours: 120,
          lowRate: 90,
          highRate: 120,
          description: 'Designs user interfaces and creates interactive prototypes.'
        }
      ],
      investmentEstimate: {
        low: 75000,
        high: 95000,
        breakdown: [
          { component: 'Development Team', lowCost: 60000, highCost: 75000 },
          { component: 'Infrastructure', lowCost: 10000, highCost: 15000 },
          { component: 'Testing & QA', lowCost: 5000, highCost: 5000 }
        ]
      }
    }
  },
  {
    title: 'Healthcare Data Analytics Platform',
    status: 'draft',
    content: {
      executiveSummary: 'AI-powered analytics platform for healthcare providers.',
      technicalApproach: 'Leveraging machine learning and cloud infrastructure.',
      projectTimeline: 'Phase 1: Data Integration (3 weeks)\nPhase 2: ML Models (6 weeks)\nPhase 3: Dashboard Development (4 weeks)',
      valueProposition: 'Improve patient outcomes through data-driven insights.',
      resources: [
        {
          role: 'Data Scientist',
          hours: 200,
          lowRate: 130,
          highRate: 170,
          description: 'Develops and trains machine learning models for predictive analytics.'
        },
        {
          role: 'Backend Engineer',
          hours: 240,
          lowRate: 110,
          highRate: 145,
          description: 'Builds secure APIs and data processing pipelines.'
        }
      ],
      investmentEstimate: {
        low: 85000,
        high: 110000,
        breakdown: [
          { component: 'Engineering Team', lowCost: 65000, highCost: 85000 },
          { component: 'Cloud Services', lowCost: 15000, highCost: 20000 },
          { component: 'Compliance & Security', lowCost: 5000, highCost: 5000 }
        ]
      }
    }
  }
];

async function createUser(user: MockUser) {
  try {
    // Try to create auth user
    let authData = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName
      }
    });

    let userId: string;
    let isNewUser = false;

    if (authData.error) {
      // User already exists, try to get existing user
      console.log(`User ${user.email} already exists, fetching...`);

      // List all users and find by email
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error(`Failed to list users:`, listError.message);
        return null;
      }

      const existingUser = users.find(u => u.email === user.email);

      if (!existingUser) {
        console.error(`Could not find existing user ${user.email}`);
        return null;
      }

      userId = existingUser.id;
      console.log(`✓ Found existing user: ${user.email}`);
    } else {
      userId = authData.data.user.id;
      isNewUser = true;
      console.log(`✓ Created user: ${user.email}`);
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      console.log(`✓ Profile already exists for: ${user.email}`);
      return { id: userId, email: user.email };
    }

    // Create company profile with minimal required fields
    const { data: profileData, error: profileError} = await supabase
      .from('company_profiles')
      .insert({
        user_id: userId,
        company_name: user.companyName,
        visibility: 'private',
        profile_strength: 60
      })
      .select()
      .single();

    if (profileError) {
      console.error(`Failed to create profile for ${user.email}:`, profileError.message);
      return { id: userId, email: user.email };
    }

    console.log(`✓ Created profile: ${user.companyName}`);
    return { id: userId, email: user.email };
  } catch (error) {
    console.error(`Error creating user ${user.email}:`, error);
    return null;
  }
}

async function createProposal(userId: string, proposalData: any) {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        user_id: userId,
        title: proposalData.title,
        status: proposalData.status,
        content: proposalData.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`Failed to create proposal "${proposalData.title}":`, error.message);
      return null;
    }

    console.log(`✓ Created proposal: ${proposalData.title}`);
    return data;
  } catch (error) {
    console.error(`Error creating proposal:`, error);
    return null;
  }
}

async function createTeamInvitation(proposalId: string, memberEmail: string, role: string) {
  try {
    const { data, error } = await supabase
      .from('proposal_team')
      .insert({
        proposal_id: proposalId,
        member_email: memberEmail,
        role: role,
        status: 'invited',
        rate_range: { min: 100, max: 150 },
        invited_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`Failed to create invitation for ${memberEmail}:`, error.message);
      return null;
    }

    console.log(`✓ Created invitation: ${memberEmail} as ${role}`);
    return data;
  } catch (error) {
    console.error(`Error creating invitation:`, error);
    return null;
  }
}

async function seedData() {
  console.log('🌱 Starting database seeding...\n');

  // Create users
  console.log('Creating users...');
  const users = [];
  for (const mockUser of mockUsers) {
    const user = await createUser(mockUser);
    if (user) {
      users.push({ ...user, email: mockUser.email });
    }
  }
  console.log(`\n✓ Processed ${users.length} users\n`);

  if (users.length === 0) {
    console.error('❌ No users available. Exiting.');
    return;
  }

  // Create proposals for Alice (first user)
  console.log('Creating proposals...');
  const proposals = [];
  for (const proposalData of mockProposals) {
    const proposal = await createProposal(users[0].id, proposalData);
    if (proposal) {
      proposals.push(proposal);
    }
  }
  console.log(`\n✓ Created ${proposals.length} proposals\n`);

  // Create team invitations
  console.log('Creating team invitations...');
  if (proposals.length > 0) {
    // Invite Bob and Carol to the first proposal
    await createTeamInvitation(proposals[0].id, mockUsers[1].email, 'Senior Developer');
    await createTeamInvitation(proposals[0].id, mockUsers[2].email, 'UI/UX Designer');

    // Invite David to the second proposal (if it exists)
    if (proposals.length > 1) {
      await createTeamInvitation(proposals[1].id, mockUsers[3].email, 'Data Scientist');
      await createTeamInvitation(proposals[1].id, mockUsers[1].email, 'Backend Engineer');
    }
  }

  console.log('\n✅ Database seeding completed!\n');
  console.log('Test Credentials:');
  console.log('─────────────────');
  mockUsers.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Company: ${user.companyName}\n`);
  });

  console.log('You can now:');
  console.log('1. Login as alice@example.com to see proposals with team members');
  console.log('2. Login as bob@example.com or carol@example.com to see invitations');
  console.log('3. Test accepting/declining invitations');
  console.log('4. Test team collaboration features\n');
}

// Run the seed script
seedData()
  .then(() => {
    console.log('Seed script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
