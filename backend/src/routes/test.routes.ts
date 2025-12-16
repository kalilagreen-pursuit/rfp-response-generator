import { Router } from 'express';
import { supabaseAnon, supabase } from '../utils/supabase.js';
import { testGeminiConnection } from '../services/gemini.service.js';

const router = Router();

// Test Supabase connection
router.get('/supabase', async (req, res) => {
  try {
    // Test 1: Check if company_profiles table exists
    const { data: profiles, error: profileError } = await supabaseAnon
      .from('company_profiles')
      .select('*')
      .limit(1);

    // Test 2: Check if proposals table exists
    const { data: proposals, error: proposalError } = await supabaseAnon
      .from('proposals')
      .select('*')
      .limit(1);

    // Test 3: Check if documents table exists
    const { data: documents, error: documentError } = await supabaseAnon
      .from('documents')
      .select('*')
      .limit(1);

    const tablesChecked = {
      company_profiles: !profileError,
      proposals: !proposalError,
      documents: !documentError
    };

    const allTablesExist = Object.values(tablesChecked).every(exists => exists);

    if (!allTablesExist) {
      return res.json({
        status: 'partial',
        message: 'Some tables are missing. Please run the SQL migration.',
        tablesFound: tablesChecked,
        errors: {
          company_profiles: profileError?.message,
          proposals: proposalError?.message,
          documents: documentError?.message
        },
        supabaseUrl: process.env.SUPABASE_URL
      });
    }

    res.json({
      status: 'success',
      message: 'Supabase connection successful! All core tables exist.',
      tablesFound: tablesChecked,
      supabaseUrl: process.env.SUPABASE_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Supabase',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test Gemini API connection
router.get('/gemini', async (_req, res) => {
  try {
    const result = await testGeminiConnection();

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Gemini API connection successful!',
        model: result.model,
        response: result.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to connect to Gemini API',
        model: result.model,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to test Gemini API',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear all connection requests (for demo/testing)
router.delete('/connection-requests', async (_req, res) => {
  try {
    // Get count before deletion
    const { count: beforeCount } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true });

    // Get all connection request IDs
    const { data: allRequests, error: selectError } = await supabase
      .from('connection_requests')
      .select('id');

    if (selectError) {
      throw selectError;
    }

    // Delete all connection requests (Supabase requires a filter, so delete each one)
    if (allRequests && allRequests.length > 0) {
      // Delete in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < allRequests.length; i += batchSize) {
        const batch = allRequests.slice(i, i + batchSize);
        const deletePromises = batch.map(request =>
          supabase
            .from('connection_requests')
            .delete()
            .eq('id', request.id)
        );
        await Promise.all(deletePromises);
      }
    }

    // Get count after deletion
    const { count: afterCount } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true });

    res.json({
      status: 'success',
      message: 'All connection requests cleared',
      deletedCount: beforeCount || 0,
      remainingCount: afterCount || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear connection requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear all team invitations (for demo/testing)
router.delete('/team-invitations', async (_req, res) => {
  try {
    // Get count before deletion
    const { count: beforeCount } = await supabase
      .from('proposal_team')
      .select('*', { count: 'exact', head: true });

    // Get all team invitation IDs
    const { data: allInvitations, error: selectError } = await supabase
      .from('proposal_team')
      .select('id');

    if (selectError) {
      throw selectError;
    }

    // Delete all team invitations (Supabase requires a filter, so delete each one)
    if (allInvitations && allInvitations.length > 0) {
      // Delete in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < allInvitations.length; i += batchSize) {
        const batch = allInvitations.slice(i, i + batchSize);
        const deletePromises = batch.map(invitation =>
          supabase
            .from('proposal_team')
            .delete()
            .eq('id', invitation.id)
        );
        await Promise.all(deletePromises);
      }
    }

    // Get count after deletion
    const { count: afterCount } = await supabase
      .from('proposal_team')
      .select('*', { count: 'exact', head: true });

    res.json({
      status: 'success',
      message: 'All team invitations cleared',
      deletedCount: beforeCount || 0,
      remainingCount: afterCount || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear team invitations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create mock company profile for marketplace (demo/testing)
router.post('/mock-company', async (_req, res) => {
  try {
    const companyName = 'PC Coggins Inc Lawyer and Compliance';
    const email = 'contact@pccoggins.com';
    
    // Check if company already exists
    const { data: existingProfile } = await supabase
      .from('company_profiles')
      .select('id, company_name')
      .eq('company_name', companyName)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile to be public
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

      return res.json({
        status: 'success',
        message: 'Mock company profile updated',
        profile: {
          id: existingProfile.id,
          company_name: companyName,
          visibility: 'public'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create a test user for this company
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'Demo123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'PC Coggins Admin'
      }
    });

    if (authError) {
      // If user already exists, try to find them
      if (authError.message.includes('already registered')) {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.find(u => u.email === email);
        if (!existingUser) {
          throw new Error('User exists but could not be found');
        }

        // Check if profile already exists for this user
        const { data: userProfile } = await supabase
          .from('company_profiles')
          .select('id')
          .eq('user_id', existingUser.id)
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

          return res.json({
            status: 'success',
            message: 'Mock company profile updated',
            profile: {
              id: userProfile.id,
              company_name: companyName,
              visibility: 'public'
            },
            timestamp: new Date().toISOString()
          });
        }

        // Create profile for existing user
        const { data: profileData, error: profileError } = await supabase
          .from('company_profiles')
          .insert({
            user_id: existingUser.id,
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

        return res.json({
          status: 'success',
          message: 'Mock company profile created',
          profile: profileData,
          timestamp: new Date().toISOString()
        });
      }
      throw authError;
    }

    const userId = authData.user.id;

    // Create company profile
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

    res.json({
      status: 'success',
      message: 'Mock company profile created',
      profile: profileData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create mock company error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create mock company profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
