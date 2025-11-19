import { Router } from 'express';
import { supabaseAnon } from '../utils/supabase.js';

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

export default router;
