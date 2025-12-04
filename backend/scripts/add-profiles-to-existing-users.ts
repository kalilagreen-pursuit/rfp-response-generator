import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const mockProfiles = [
  {
    email: 'techsolutions@example.com',
    company_name: 'TechSolutions Inc.',
    industry: 'Technology',
    website: 'https://techsolutions.example.com',
    capabilities: ['Web Development', 'Cloud Computing', 'AI/ML', 'Mobile Apps', 'DevOps']
  },
  {
    email: 'dataexperts@example.com',
    company_name: 'Data Experts LLC',
    industry: 'Data Analytics',
    website: 'https://dataexperts.example.com',
    capabilities: ['Data Analytics', 'Business Intelligence', 'Machine Learning', 'Data Visualization', 'Big Data']
  },
  {
    email: 'cloudmasters@example.com',
    company_name: 'CloudMasters',
    industry: 'Cloud Infrastructure',
    website: 'https://cloudmasters.example.com',
    capabilities: ['Cloud Computing', 'DevOps', 'Infrastructure', 'Security', 'Migration Services']
  },
  {
    email: 'designstudio@example.com',
    company_name: 'Creative Design Studio',
    industry: 'Design & UX',
    website: 'https://designstudio.example.com',
    capabilities: ['UI/UX Design', 'Branding', 'Web Design', 'Mobile Design', 'Design Systems']
  },
  {
    email: 'cybersecure@example.com',
    company_name: 'CyberSecure Solutions',
    industry: 'Cybersecurity',
    website: 'https://cybersecure.example.com',
    capabilities: ['Security', 'Penetration Testing', 'Compliance', 'Risk Assessment', 'Security Audits']
  },
  {
    email: 'mobiledevs@example.com',
    company_name: 'Mobile Devs Pro',
    industry: 'Mobile Development',
    website: 'https://mobiledevs.example.com',
    capabilities: ['Mobile Apps', 'iOS Development', 'Android Development', 'React Native', 'Flutter']
  },
  {
    email: 'aiinnovations@example.com',
    company_name: 'AI Innovations',
    industry: 'Artificial Intelligence',
    website: 'https://aiinnovations.example.com',
    capabilities: ['AI/ML', 'Natural Language Processing', 'Computer Vision', 'Deep Learning', 'AI Strategy']
  },
  {
    email: 'consultinggroup@example.com',
    company_name: 'Strategic Consulting Group',
    industry: 'Business Consulting',
    website: 'https://consultinggroup.example.com',
    capabilities: ['Business Strategy', 'Digital Transformation', 'Process Optimization', 'Change Management', 'Project Management']
  }
];

async function addProfilesToExistingUsers() {
  console.log('🌱 Adding profiles to existing users...\n');

  for (const mock of mockProfiles) {
    try {
      console.log(`Processing: ${mock.email}`);

      // Get user by email
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) throw listError;

      const user = users.find(u => u.email === mock.email);

      if (!user) {
        console.log(`  ⚠️  User not found, skipping...`);
        continue;
      }

      console.log(`  ✅ Found user ID: ${user.id}`);

      // Check if profile already exists
      const { data: existing } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        console.log(`  ⚠️  Profile already exists, skipping...`);
        continue;
      }

      // Create company profile
      const { error: profileError } = await supabase
        .from('company_profiles')
        .insert({
          user_id: user.id,
          company_name: mock.company_name,
          industry: mock.industry,
          website: mock.website,
          capabilities: mock.capabilities,
          visibility: 'public'
        });

      if (profileError) {
        console.log(`  ❌ Profile creation failed: ${profileError.message}`);
        continue;
      }

      console.log(`  ✅ Profile created for ${mock.company_name}\n`);

    } catch (error: any) {
      console.error(`  ❌ Error processing ${mock.email}:`, error.message);
    }
  }

  console.log('\n🎉 Profile creation complete!');
  console.log('\nMock companies created:');
  mockProfiles.forEach(p => console.log(`  - ${p.company_name} (${p.industry})`));
  console.log('\nYou can now find these companies in the Marketplace!');
  console.log('Try searching for capabilities like:');
  console.log('  - "Web Development"');
  console.log('  - "Cloud Computing"');
  console.log('  - "AI/ML"');
  console.log('  - "Security"');
}

addProfilesToExistingUsers().catch(console.error);
