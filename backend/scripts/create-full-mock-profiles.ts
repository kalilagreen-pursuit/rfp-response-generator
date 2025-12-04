import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const fullMockProfiles = [
  {
    email: 'techsolutions@example.com',
    company_name: 'TechSolutions Inc.',
    industry: 'Technology',
    website: 'https://techsolutions.example.com',
    capabilities: ['Web Development', 'Cloud Computing', 'AI/ML', 'Mobile Apps', 'DevOps'],
    contact_info: {
      email: 'contact@techsolutions.example.com',
      phone: '+1 (415) 555-0123',
      address: '123 Tech Street, San Francisco, CA 94102',
      linkedin: 'https://linkedin.com/company/techsolutions',
      twitter: '@techsolutions'
    },
    teams: [
      { name: 'Alice Johnson', role: 'CEO & Founder', bio: 'Former Google engineer with 15 years of experience in cloud architecture' },
      { name: 'Bob Smith', role: 'CTO', bio: 'Expert in AI/ML and distributed systems' },
      { name: 'Carol Davis', role: 'Lead Developer', bio: 'Full-stack developer specializing in React and Node.js' },
      { name: 'David Wilson', role: 'DevOps Engineer', bio: 'AWS and Kubernetes certified professional' }
    ],
    industryPlaybooks: {
      healthcare: 'HIPAA-compliant cloud solutions with 99.99% uptime guarantee',
      finance: 'SOC 2 Type II certified infrastructure for financial services',
      retail: 'Scalable e-commerce platforms handling millions of transactions'
    },
    documents: [
      { title: 'AWS Migration Case Study', type: 'case_study', description: 'Successfully migrated Fortune 500 company to AWS, reducing costs by 40%' },
      { title: 'Company Certifications', type: 'certification', description: 'AWS Advanced Consulting Partner, ISO 27001, SOC 2 Type II' },
      { title: 'Sample Web Application', type: 'past_work', description: 'Enterprise SaaS platform serving 50,000+ users' }
    ]
  },
  {
    email: 'dataexperts@example.com',
    company_name: 'Data Experts LLC',
    industry: 'Data Analytics',
    website: 'https://dataexperts.example.com',
    capabilities: ['Data Analytics', 'Business Intelligence', 'Machine Learning', 'Data Visualization', 'Big Data'],
    contact_info: {
      email: 'hello@dataexperts.example.com',
      phone: '+1 (512) 555-0145',
      address: '456 Analytics Ave, Austin, TX 78701',
      linkedin: 'https://linkedin.com/company/dataexperts',
      twitter: '@dataexperts'
    },
    teams: [
      { name: 'Emily Chen', role: 'Chief Data Scientist', bio: 'PhD in Statistics, published researcher in machine learning' },
      { name: 'Frank Martinez', role: 'Analytics Director', bio: 'Former McKinsey consultant specializing in data strategy' },
      { name: 'Grace Lee', role: 'Data Engineer', bio: 'Expert in building scalable data pipelines' }
    ],
    industryPlaybooks: {
      retail: 'Customer analytics and predictive modeling for retail optimization',
      healthcare: 'Patient outcome predictions and operational efficiency analytics',
      manufacturing: 'Predictive maintenance and supply chain optimization'
    },
    documents: [
      { title: 'Retail Analytics Case Study', type: 'case_study', description: 'Increased customer retention by 25% through predictive analytics' },
      { title: 'Data Warehouse Architecture', type: 'past_work', description: 'Built enterprise data warehouse processing 10TB daily' },
      { title: 'Team Certifications', type: 'certification', description: 'Google Cloud Professional Data Engineer, Tableau Desktop Specialist' }
    ]
  },
  {
    email: 'cloudmasters@example.com',
    company_name: 'CloudMasters',
    industry: 'Cloud Infrastructure',
    website: 'https://cloudmasters.example.com',
    capabilities: ['Cloud Computing', 'DevOps', 'Infrastructure', 'Security', 'Migration Services'],
    contact_info: {
      email: 'info@cloudmasters.example.com',
      phone: '+1 (206) 555-0167',
      address: '789 Cloud Lane, Seattle, WA 98101',
      linkedin: 'https://linkedin.com/company/cloudmasters',
      twitter: '@cloudmasters'
    },
    teams: [
      { name: 'Henry Zhang', role: 'Cloud Architect', bio: '10+ years managing multi-cloud infrastructures' },
      { name: 'Isabel Rodriguez', role: 'Security Engineer', bio: 'CISSP certified, specializing in cloud security' },
      { name: 'Jack Thompson', role: 'DevOps Lead', bio: 'Kubernetes expert and CNCF ambassador' },
      { name: 'Karen White', role: 'Migration Specialist', bio: 'Led 100+ successful cloud migrations' }
    ],
    industryPlaybooks: {
      enterprise: 'Hybrid cloud solutions for large enterprises with legacy systems',
      startups: 'Cost-optimized cloud infrastructure for rapid scaling',
      government: 'FedRAMP compliant cloud solutions for government agencies'
    },
    documents: [
      { title: 'Multi-Cloud Strategy Guide', type: 'past_work', description: 'Comprehensive guide to AWS, Azure, and GCP integration' },
      { title: 'Security Compliance Report', type: 'certification', description: 'SOC 2, ISO 27001, FedRAMP authorized' },
      { title: 'Enterprise Migration Case Study', type: 'case_study', description: 'Zero-downtime migration of 200+ applications to cloud' }
    ]
  },
  {
    email: 'designstudio@example.com',
    company_name: 'Creative Design Studio',
    industry: 'Design & UX',
    website: 'https://designstudio.example.com',
    capabilities: ['UI/UX Design', 'Branding', 'Web Design', 'Mobile Design', 'Design Systems'],
    contact_info: {
      email: 'design@designstudio.example.com',
      phone: '+1 (212) 555-0189',
      address: '321 Design Plaza, New York, NY 10001',
      linkedin: 'https://linkedin.com/company/creative-design-studio',
      dribbble: 'https://dribbble.com/designstudio'
    },
    teams: [
      { name: 'Luna Park', role: 'Creative Director', bio: 'Award-winning designer featured in Communication Arts' },
      { name: 'Marcus Brown', role: 'UX Research Lead', bio: 'PhD in Human-Computer Interaction' },
      { name: 'Nina Patel', role: 'Brand Strategist', bio: 'Former designer at Apple and Airbnb' },
      { name: 'Oscar Kim', role: 'UI Designer', bio: 'Specialist in design systems and component libraries' }
    ],
    industryPlaybooks: {
      saas: 'User-centered design for SaaS products with focus on conversion',
      ecommerce: 'Mobile-first design increasing checkout completion rates',
      fintech: 'Trust-building interfaces for financial applications'
    },
    documents: [
      { title: 'Mobile App Redesign Portfolio', type: 'past_work', description: 'App redesign that increased user engagement by 60%' },
      { title: 'Design System Documentation', type: 'past_work', description: 'Comprehensive design system serving 50+ products' },
      { title: 'UX Research Report', type: 'case_study', description: 'In-depth user research leading to 3x conversion improvement' }
    ]
  },
  {
    email: 'cybersecure@example.com',
    company_name: 'CyberSecure Solutions',
    industry: 'Cybersecurity',
    website: 'https://cybersecure.example.com',
    capabilities: ['Security', 'Penetration Testing', 'Compliance', 'Risk Assessment', 'Security Audits'],
    contact_info: {
      email: 'security@cybersecure.example.com',
      phone: '+1 (202) 555-0201',
      address: '555 Security Blvd, Washington, DC 20001',
      linkedin: 'https://linkedin.com/company/cybersecure',
      twitter: '@cybersecure'
    },
    teams: [
      { name: 'Patricia Green', role: 'Chief Security Officer', bio: 'Former NSA analyst, CISSP and CEH certified' },
      { name: 'Quinn Adams', role: 'Penetration Tester', bio: 'Ethical hacker with OSCP certification' },
      { name: 'Rachel Moore', role: 'Compliance Manager', bio: 'Expert in GDPR, HIPAA, and SOC 2 compliance' },
      { name: 'Samuel Turner', role: 'Security Analyst', bio: 'Threat intelligence and incident response specialist' }
    ],
    industryPlaybooks: {
      healthcare: 'HIPAA compliance and healthcare security assessments',
      finance: 'PCI DSS compliance and financial security audits',
      enterprise: 'Comprehensive security programs for Fortune 500 companies'
    },
    documents: [
      { title: 'Penetration Testing Report Sample', type: 'case_study', description: 'Identified and remediated critical vulnerabilities' },
      { title: 'Security Certifications', type: 'certification', description: 'CISSP, CEH, OSCP, Security+ certified team' },
      { title: 'Incident Response Playbook', type: 'past_work', description: 'Comprehensive IR procedures and documentation' }
    ]
  },
  {
    email: 'mobiledevs@example.com',
    company_name: 'Mobile Devs Pro',
    industry: 'Mobile Development',
    website: 'https://mobiledevs.example.com',
    capabilities: ['Mobile Apps', 'iOS Development', 'Android Development', 'React Native', 'Flutter'],
    contact_info: {
      email: 'apps@mobiledevs.example.com',
      phone: '+1 (310) 555-0223',
      address: '888 Mobile Way, Los Angeles, CA 90001',
      linkedin: 'https://linkedin.com/company/mobiledevspro',
      twitter: '@mobiledevspro'
    },
    teams: [
      { name: 'Tyler Scott', role: 'Mobile Architect', bio: 'Built apps with 10M+ downloads combined' },
      { name: 'Uma Singh', role: 'iOS Lead', bio: 'Apple Design Award winner, Swift expert' },
      { name: 'Victor Nguyen', role: 'Android Lead', bio: 'Google Developer Expert in Android' },
      { name: 'Wendy Clark', role: 'React Native Specialist', bio: 'Cross-platform development expert' }
    ],
    industryPlaybooks: {
      consumer: 'Viral mobile apps with focus on retention and monetization',
      enterprise: 'Secure mobile apps for workforce productivity',
      healthcare: 'HIPAA-compliant health and wellness applications'
    },
    documents: [
      { title: 'Top-Rated Apps Portfolio', type: 'past_work', description: 'Portfolio of 4.8+ star rated apps in App Store and Play Store' },
      { title: 'Mobile Performance Optimization', type: 'case_study', description: 'Reduced app load time by 70% and crashes by 90%' },
      { title: 'Development Certifications', type: 'certification', description: 'Apple Certified iOS Developer, Google Associate Android Developer' }
    ]
  },
  {
    email: 'aiinnovations@example.com',
    company_name: 'AI Innovations',
    industry: 'Artificial Intelligence',
    website: 'https://aiinnovations.example.com',
    capabilities: ['AI/ML', 'Natural Language Processing', 'Computer Vision', 'Deep Learning', 'AI Strategy'],
    contact_info: {
      email: 'ai@aiinnovations.example.com',
      phone: '+1 (617) 555-0245',
      address: '999 Innovation Dr, Boston, MA 02101',
      linkedin: 'https://linkedin.com/company/ai-innovations',
      twitter: '@aiinnovations'
    },
    teams: [
      { name: 'Xavier Liu', role: 'AI Research Director', bio: 'PhD from MIT, published 30+ papers in top AI conferences' },
      { name: 'Yara Hassan', role: 'ML Engineer', bio: 'Former Google Brain researcher' },
      { name: 'Zachary Cooper', role: 'Computer Vision Lead', bio: 'Expert in autonomous systems and image recognition' },
      { name: 'Aria Johnson', role: 'NLP Specialist', bio: 'Built production NLP systems for major tech companies' }
    ],
    industryPlaybooks: {
      retail: 'Recommendation engines and demand forecasting',
      healthcare: 'Medical imaging analysis and diagnostic assistance',
      manufacturing: 'Quality control through computer vision'
    },
    documents: [
      { title: 'AI Implementation Case Study', type: 'case_study', description: 'Deployed ML model improving accuracy from 70% to 95%' },
      { title: 'Research Publications', type: 'past_work', description: 'Published research in NeurIPS, CVPR, and ACL' },
      { title: 'AI Ethics Framework', type: 'past_work', description: 'Comprehensive ethical AI development guidelines' }
    ]
  },
  {
    email: 'consultinggroup@example.com',
    company_name: 'Strategic Consulting Group',
    industry: 'Business Consulting',
    website: 'https://consultinggroup.example.com',
    capabilities: ['Business Strategy', 'Digital Transformation', 'Process Optimization', 'Change Management', 'Project Management'],
    contact_info: {
      email: 'consulting@consultinggroup.example.com',
      phone: '+1 (312) 555-0267',
      address: '777 Strategy Tower, Chicago, IL 60601',
      linkedin: 'https://linkedin.com/company/strategic-consulting-group',
      twitter: '@stratconsult'
    },
    teams: [
      { name: 'Blake Anderson', role: 'Managing Partner', bio: 'Former McKinsey principal with 20 years experience' },
      { name: 'Clara Martinez', role: 'Digital Transformation Lead', bio: 'Led digital transformations for 50+ Fortune 500 companies' },
      { name: 'Derek Thompson', role: 'Strategy Director', bio: 'MBA from Harvard, specialized in M&A strategy' },
      { name: 'Elena Rodriguez', role: 'Change Management Expert', bio: 'Prosci certified, managed 100+ organizational changes' }
    ],
    industryPlaybooks: {
      manufacturing: 'Industry 4.0 transformation and operational excellence',
      retail: 'Omnichannel strategy and customer experience optimization',
      financial: 'Digital banking transformation and fintech integration'
    },
    documents: [
      { title: 'Digital Transformation Case Study', type: 'case_study', description: '$50M cost savings through digital transformation' },
      { title: 'Strategic Framework', type: 'past_work', description: 'Proprietary strategy development methodology' },
      { title: 'Client Testimonials', type: 'past_work', description: 'References from 20+ Fortune 500 companies' }
    ]
  }
];

async function createFullMockProfiles() {
  console.log('🚀 Creating full mock profiles with complete data...\n');

  for (const mock of fullMockProfiles) {
    try {
      console.log(`\n📝 Processing: ${mock.company_name}`);

      // Get user by email
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const user = users.find(u => u.email === mock.email);
      if (!user) {
        console.log(`  ⚠️  User not found, skipping...`);
        continue;
      }

      console.log(`  ✅ Found user ID: ${user.id}`);

      // Update company profile with full details
      // Store teams and industryPlaybooks within contact_info
      const fullContactInfo = {
        ...mock.contact_info,
        teams: mock.teams,
        industryPlaybooks: mock.industryPlaybooks
      };

      const { error: updateError } = await supabase
        .from('company_profiles')
        .update({
          company_name: mock.company_name,
          industry: mock.industry,
          website: mock.website,
          capabilities: mock.capabilities,
          contact_info: fullContactInfo,
          visibility: 'public',
          profile_strength: 85
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.log(`  ❌ Profile update failed: ${updateError.message}`);
        continue;
      }

      console.log(`  ✅ Updated profile with complete information`);

      // Get profile ID for documents
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        console.log(`  ⚠️  Could not fetch profile ID`);
        continue;
      }

      // Create mock documents
      for (const doc of mock.documents) {
        const { error: docError } = await supabase
          .from('documents')
          .insert({
            profile_id: user.id,
            title: doc.title,
            type: doc.type,
            description: doc.description,
            file_path: `mock/${doc.type}/${doc.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
            file_size: Math.floor(Math.random() * 5000000) + 100000, // Random size between 100KB and 5MB
            file_type: 'application/pdf'
          });

        if (docError && !docError.message.includes('duplicate')) {
          console.log(`  ⚠️  Document creation warning: ${docError.message}`);
        }
      }

      console.log(`  ✅ Created ${mock.documents.length} documents`);
      console.log(`  🎉 ${mock.company_name} profile complete!`);

    } catch (error: any) {
      console.error(`  ❌ Error processing ${mock.email}:`, error.message);
    }
  }

  console.log('\n\n✨ All mock profiles created successfully!');
  console.log('\n📊 Profile Summary:');
  console.log('  - 8 complete company profiles');
  console.log('  - 4 team members per company');
  console.log('  - 3 documents per company');
  console.log('  - Industry-specific playbooks');
  console.log('  - Full contact information');
  console.log('\n🔍 Try viewing profiles in the Marketplace now!');
}

createFullMockProfiles().catch(console.error);
