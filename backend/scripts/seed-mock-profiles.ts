import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// SECURITY FIX: Use environment variable for test passwords instead of hardcoding
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Demo123!';

if (process.env.NODE_ENV === 'production' && !process.env.TEST_PASSWORD) {
  console.warn('⚠️  WARNING: TEST_PASSWORD not set in production. Using default password.');
  console.warn('⚠️  Set TEST_PASSWORD environment variable for production test accounts.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const mockProfiles = [
  {
    email: 'techsolutions@example.com',
    password: TEST_PASSWORD,
    profile: {
      company_name: 'TechSolutions Inc.',
      industry: 'Technology',
      description: 'Full-stack software development company specializing in cloud solutions and AI integration.',
      website: 'https://techsolutions.example.com',
      capabilities: ['Web Development', 'Cloud Computing', 'AI/ML', 'Mobile Apps', 'DevOps'],
      years_in_business: 8,
      team_size: '25-50',
      location: 'San Francisco, CA'
    }
  },
  {
    email: 'dataexperts@example.com',
    password: TEST_PASSWORD,
    profile: {
      company_name: 'Data Experts LLC',
      industry: 'Data Analytics',
      description: 'Data science and analytics firm helping businesses make data-driven decisions.',
      website: 'https://dataexperts.example.com',
      capabilities: ['Data Analytics', 'Business Intelligence', 'Machine Learning', 'Data Visualization', 'Big Data'],
      years_in_business: 5,
      team_size: '10-25',
      location: 'Austin, TX'
    }
  },
  {
    email: 'cloudmasters@example.com',
    password: TEST_PASSWORD,
    profile: {
      company_name: 'CloudMasters',
      industry: 'Cloud Infrastructure',
      description: 'AWS and Azure certified cloud infrastructure and migration specialists.',
      website: 'https://cloudmasters.example.com',
      capabilities: ['Cloud Computing', 'DevOps', 'Infrastructure', 'Security', 'Migration Services'],
      years_in_business: 10,
      team_size: '50-100',
      location: 'Seattle, WA'
    }
  },
  {
    email: 'designstudio@example.com',
    password: TEST_PASSWORD,
    profile: {
      company_name: 'Creative Design Studio',
      industry: 'Design & UX',
      description: 'Award-winning design agency specializing in user experience and brand identity.',
      website: 'https://designstudio.example.com',
      capabilities: ['UI/UX Design', 'Branding', 'Web Design', 'Mobile Design', 'Design Systems'],
      years_in_business: 12,
      team_size: '10-25',
      location: 'New York, NY'
    }
  },
  {
    email: 'cybersecure@example.com',
    password: TEST_PASSWORD,
    profile: {
      company_name: 'CyberSecure Solutions',
      industry: 'Cybersecurity',
      description: 'Comprehensive cybersecurity services including penetration testing and compliance.',
      website: 'https://cybersecure.example.com',
      capabilities: ['Security', 'Penetration Testing', 'Compliance', 'Risk Assessment', 'Security Audits'],
      years_in_business: 7,
      team_size: '25-50',
      location: 'Washington, DC'
    }
  },
  {
    email: 'mobiledevs@example.com',
    password: TEST_PASSWORD,
    profile: {
      company_name: 'Mobile Devs Pro',
      industry: 'Mobile Development',
      description: 'iOS and Android app development with focus on performance and user experience.',
      website: 'https://mobiledevs.example.com',
      capabilities: ['Mobile Apps', 'iOS Development', 'Android Development', 'React Native', 'Flutter'],
      years_in_business: 6,
      team_size: '10-25',
      location: 'Los Angeles, CA'
    }
  },
  {
    email: 'aiinnovations@example.com',
    password: TEST_PASSWORD,
    profile: {
      company_name: 'AI Innovations',
      industry: 'Artificial Intelligence',
      description: 'Cutting-edge AI solutions including natural language processing and computer vision.',
      website: 'https://aiinnovations.example.com',
      capabilities: ['AI/ML', 'Natural Language Processing', 'Computer Vision', 'Deep Learning', 'AI Strategy'],
      years_in_business: 4,
      team_size: '25-50',
      location: 'Boston, MA'
    }
  },
  {
    email: 'consultinggroup@example.com',
    password: TEST_PASSWORD,
    profile: {
      company_name: 'Strategic Consulting Group',
      industry: 'Business Consulting',
      description: 'Management consulting firm specializing in digital transformation and strategy.',
      website: 'https://consultinggroup.example.com',
      capabilities: ['Business Strategy', 'Digital Transformation', 'Process Optimization', 'Change Management', 'Project Management'],
      years_in_business: 15,
      team_size: '100+',
      location: 'Chicago, IL'
    }
  }
];

async function seedMockProfiles() {
  console.log('🌱 Starting to seed mock profiles...\n');

  for (const mock of mockProfiles) {
    try {
      console.log(`Creating user: ${mock.email}`);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: mock.email,
        password: mock.password,
        email_confirm: true
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`  ⚠️  User already exists, skipping...`);
          continue;
        }
        throw authError;
      }

      const userId = authData.user.id;
      console.log(`  ✅ User created with ID: ${userId}`);

      // Create company profile
      const { error: profileError } = await supabase
        .from('company_profiles')
        .insert({
          profile_id: userId,
          company_name: mock.profile.company_name,
          industry: mock.profile.industry,
          website: mock.profile.website,
          capabilities: mock.profile.capabilities,
          marketplace_visible: true // Make visible in marketplace
        });

      if (profileError) {
        console.log(`  ❌ Profile creation failed: ${profileError.message}`);
        continue;
      }

      console.log(`  ✅ Profile created for ${mock.profile.company_name}\n`);

    } catch (error: any) {
      console.error(`  ❌ Error creating ${mock.email}:`, error.message);
    }
  }

  console.log('\n🎉 Mock profile seeding complete!');
  console.log('\nYou can now search for these companies in the marketplace.');
  console.log('All profiles have these capabilities you can search for:');
  console.log('  - Web Development');
  console.log('  - Cloud Computing');
  console.log('  - AI/ML');
  console.log('  - Mobile Apps');
  console.log('  - Security');
  console.log('  - Data Analytics');
  console.log('  - UI/UX Design');
  console.log(`\n⚠️  SECURITY: Default password for all mock accounts: ${TEST_PASSWORD}`);
  console.log('⚠️  Set TEST_PASSWORD environment variable to customize (recommended for production).');
}

seedMockProfiles().catch(console.error);
