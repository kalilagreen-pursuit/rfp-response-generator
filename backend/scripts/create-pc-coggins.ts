/**
 * Script to create mock company "PC Coggins Inc Lawyer and Compliance" for marketplace
 * Run with: npx tsx backend/scripts/create-pc-coggins.ts
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createPCCoggins() {
  console.log('🌱 Creating PC Coggins Inc Lawyer and Compliance...\n');

  const companyName = 'PC Coggins Inc.';
  const email = 'contact@pccoggins.com';
  const contactPerson = 'Patrick Coggins';
  const contactTitle = 'Lawyer/Compliance Officer';

  try {
    // Check if company already exists
    const { data: existingProfile } = await supabase
      .from('company_profiles')
      .select('id, company_name, user_id')
      .eq('company_name', companyName)
      .maybeSingle();

    if (existingProfile) {
      console.log('✓ Company already exists, updating to public...');
      
      const { error: updateError } = await supabase
        .from('company_profiles')
        .update({
          visibility: 'public',
          profile_strength: 75,
          industry: 'Legal & Compliance',
          contact_info: {
            email: email,
            location: 'New York, NY',
            website: 'https://www.pccoggins.com',
            phone: '+1 (212) 555-0100',
            contact_person: contactPerson,
            contact_title: contactTitle,
            capabilities: [
              'Legal Compliance',
              'Regulatory Affairs',
              'Risk Management',
              'Corporate Governance',
              'Contract Review',
              'Policy Development'
            ]
          }
        })
        .eq('id', existingProfile.id);

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Company profile updated successfully!');
      console.log(`   Company: ${companyName}`);
      console.log(`   Visibility: public`);
      console.log(`   Profile ID: ${existingProfile.id}`);
      return;
    }

    // Check if user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    let existingUser = users.find(u => u.email === email);
    let userId: string;

    if (existingUser) {
      console.log('✓ User already exists, using existing user...');
      userId = existingUser.id;

      // Check if profile exists for this user
      const { data: userProfile } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (userProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('company_profiles')
          .update({
            company_name: companyName,
            visibility: 'public',
            profile_strength: 75,
            industry: 'Legal & Compliance',
            contact_info: {
              email: email,
              location: 'New York, NY',
              website: 'https://www.pccoggins.com',
              phone: '+1 (212) 555-0100',
              capabilities: [
                'Legal Compliance',
                'Regulatory Affairs',
                'Risk Management',
                'Corporate Governance',
                'Contract Review',
                'Policy Development'
              ]
            }
          })
          .eq('id', userProfile.id);

        if (updateError) throw updateError;

        console.log('✅ Company profile updated successfully!');
        console.log(`   Company: ${companyName}`);
        console.log(`   Visibility: public`);
        return;
      }
    } else {
      // Create new user
      console.log('Creating new user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'Demo123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'PC Coggins Admin'
        }
      });

      if (authError) throw authError;
      userId = authData.user.id;
      console.log(`✓ User created with ID: ${userId}`);
    }

    // Create company profile
    console.log('Creating company profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('company_profiles')
      .insert({
        user_id: userId,
        company_name: companyName,
        visibility: 'public',
        profile_strength: 75,
        industry: 'Legal & Compliance',
        contact_info: {
          email: email,
          location: 'New York, NY',
          website: 'https://www.pccoggins.com',
          phone: '+1 (212) 555-0100',
          capabilities: [
            'Legal Compliance',
            'Regulatory Affairs',
            'Risk Management',
            'Corporate Governance',
            'Contract Review',
            'Policy Development'
          ]
        }
      })
      .select()
      .single();

    if (profileError) throw profileError;

    console.log('\n✅ Company profile created successfully!');
    console.log(`   Company: ${companyName}`);
    console.log(`   Email: ${email}`);
    console.log(`   Visibility: public`);
    console.log(`   Industry: Legal & Compliance`);
    console.log(`   Profile ID: ${profileData.id}`);
    console.log('\n🎉 PC Coggins Inc will now appear in the marketplace!');
  } catch (error: any) {
    console.error('\n❌ Error creating company:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createPCCoggins();

