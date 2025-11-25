import { Request, Response } from 'express';
import { supabase } from '../utils/supabase.js';
import { generateProposalContent, refineProposalSection } from '../services/gemini.service.js';
import { generateDocx, generatePdf } from '../services/export.service.js';

/**
 * Create a new proposal directly (without RFP generation)
 * POST /api/proposals
 */
export const createProposal = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { title, content, status, template } = req.body;

    if (!title) {
      return res.status(400).json({
        error: 'Missing title',
        message: 'Proposal title is required'
      });
    }

    // Save proposal to database
    const { data: proposal, error: saveError } = await supabase
      .from('proposals')
      .insert({
        user_id: req.userId,
        title,
        status: status || 'draft',
        content: content || {},
        template: template || 'standard',
        score: 0
      })
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    res.status(201).json({
      message: 'Proposal created successfully',
      proposal: {
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        template: proposal.template,
        content: proposal.content,
        createdAt: proposal.created_at
      }
    });
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate a new proposal from RFP
 * POST /api/proposals/generate
 */
export const generateProposal = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { rfpId, template } = req.body;

    if (!rfpId) {
      return res.status(400).json({
        error: 'Missing rfpId',
        message: 'RFP ID is required'
      });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Please create a company profile first'
      });
    }

    // Get RFP data
    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_uploads')
      .select('*')
      .eq('id', rfpId)
      .eq('profile_id', profile.id)
      .single();

    if (rfpError || !rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'RFP not found or access denied'
      });
    }

    if (!rfp.parsed_data) {
      return res.status(400).json({
        error: 'RFP not parsed',
        message: 'RFP must be parsed before generating a proposal'
      });
    }

    // Get user's documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('profile_id', profile.id);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
    }

    // Generate proposal with Gemini AI
    const proposalContent = await generateProposalContent(
      rfp.parsed_data,
      profile,
      documents || []
    );

    // Create proposal title from RFP
    const proposalTitle = rfp.parsed_data.title || `Proposal for ${rfp.file_name}`;

    // Save proposal to database
    const { data: proposal, error: saveError } = await supabase
      .from('proposals')
      .insert({
        profile_id: profile.id,
        rfp_id: rfpId,
        title: proposalTitle,
        status: 'draft',
        content: proposalContent,
        template: template || 'standard',
        score: 0
      })
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    res.status(201).json({
      message: 'Proposal generated successfully',
      proposal: {
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        template: proposal.template,
        content: proposal.content,
        createdAt: proposal.created_at
      }
    });
  } catch (error) {
    console.error('Generate proposal error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all proposals for authenticated user
 * GET /api/proposals
 */
export const getUserProposals = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('proposals')
      .select(`
        id,
        title,
        status,
        score,
        template,
        content,
        created_at,
        updated_at,
        exported_at,
        rfp_uploads (
          id,
          file_name,
          extracted_data
        )
      `)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    // Filter by status
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    // Pagination
    const limitNum = parseInt(limit as string) || 20;
    const offsetNum = parseInt(offset as string) || 0;
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: proposals, error, count } = await query;

    if (error) throw error;

    // Format response
    const formattedProposals = proposals?.map(proposal => ({
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      score: proposal.score,
      template: proposal.template,
      content: proposal.content,
      createdAt: proposal.created_at,
      updatedAt: proposal.updated_at,
      exportedAt: proposal.exported_at,
      rfp: proposal.rfp_uploads ? {
        id: (proposal.rfp_uploads as any).id,
        fileName: (proposal.rfp_uploads as any).file_name,
        organization: (proposal.rfp_uploads as any).extracted_data?.issuingOrganization || null,
        deadline: (proposal.rfp_uploads as any).extracted_data?.timeline?.submissionDeadline || null
      } : null
    }));

    res.json({
      proposals: formattedProposals || [],
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: count
      }
    });
  } catch (error) {
    console.error('Get user proposals error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get proposal by ID
 * GET /api/proposals/:id
 */
export const getProposalById = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    // Get proposal with RFP data
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(`
        *,
        rfp_uploads (
          id,
          file_name,
          extracted_data
        )
      `)
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !proposal) {
      return res.status(404).json({
        error: 'Proposal not found',
        message: 'Proposal not found or access denied'
      });
    }

    res.json({
      proposal: {
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        score: proposal.score,
        template: proposal.template,
        content: proposal.content,
        createdAt: proposal.created_at,
        updatedAt: proposal.updated_at,
        exportedAt: proposal.exported_at,
        rfp: proposal.rfp_uploads ? {
          id: (proposal.rfp_uploads as any).id,
          fileName: (proposal.rfp_uploads as any).file_name,
          parsedData: (proposal.rfp_uploads as any).extracted_data
        } : null
      }
    });
  } catch (error) {
    console.error('Get proposal by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update proposal content
 * PUT /api/proposals/:id
 */
export const updateProposal = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const { title, content, status } = req.body;

    // Verify proposal ownership
    const { data: existing, error: existError } = await supabase
      .from('proposals')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (existError || !existing) {
      return res.status(404).json({
        error: 'Proposal not found',
        message: 'Proposal not found or access denied'
      });
    }

    // Build update object
    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide title, content, or status to update'
      });
    }

    // Update proposal
    const { data: proposal, error: updateError } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      message: 'Proposal updated successfully',
      proposal: {
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        content: proposal.content,
        updatedAt: proposal.updated_at
      }
    });
  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Refine a proposal section with AI
 * POST /api/proposals/:id/refine
 */
export const refineSection = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const { sectionName, currentContent, improvementGoals } = req.body;

    if (!sectionName || !currentContent || !improvementGoals) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sectionName, currentContent, and improvementGoals are required'
      });
    }

    // Verify ownership
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Profile not found'
      });
    }

    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id')
      .eq('id', id)
      .eq('profile_id', profile.id)
      .single();

    if (proposalError || !proposal) {
      return res.status(404).json({
        error: 'Proposal not found',
        message: 'Proposal not found or access denied'
      });
    }

    // Refine with AI
    const refinedContent = await refineProposalSection(
      sectionName,
      currentContent,
      improvementGoals
    );

    res.json({
      message: 'Section refined successfully',
      result: refinedContent
    });
  } catch (error) {
    console.error('Refine section error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update proposal status
 * PUT /api/proposals/:id/status
 */
export const updateProposalStatus = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'team_building', 'ready', 'submitted', 'withdrawn'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update status
    const { data: proposal, error: updateError } = await supabase
      .from('proposals')
      .update({ status })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (updateError || !proposal) {
      return res.status(404).json({
        error: 'Proposal not found',
        message: 'Proposal not found or access denied'
      });
    }

    res.json({
      message: 'Status updated successfully',
      proposal: {
        id: proposal.id,
        status: proposal.status,
        updatedAt: proposal.updated_at
      }
    });
  } catch (error) {
    console.error('Update proposal status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Withdraw proposal (convenience endpoint for setting status to 'withdrawn')
 * PUT /api/proposals/:id/withdraw
 */
export const withdrawProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { id } = req.params;

    // Update status to withdrawn
    const { data: proposal, error: updateError } = await supabase
      .from('proposals')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (updateError || !proposal) {
      res.status(404).json({
        error: 'Proposal not found',
        message: 'Proposal not found or access denied'
      });
      return;
    }

    res.json({
      message: 'Proposal withdrawn successfully',
      proposal: {
        id: proposal.id,
        status: proposal.status,
        updatedAt: proposal.updated_at
      }
    });
  } catch (error) {
    console.error('Withdraw proposal error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete proposal
 * DELETE /api/proposals/:id
 */
export const deleteProposal = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    // Delete proposal
    const { error: deleteError } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (deleteError) throw deleteError;

    res.json({
      message: 'Proposal deleted successfully'
    });
  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Export proposal as DOCX
 * GET /api/proposals/:id/export/docx
 */
export const exportProposalDocx = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    // Get proposal
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !proposal) {
      return res.status(404).json({
        error: 'Proposal not found',
        message: 'Proposal not found or access denied'
      });
    }

    // Get company name from profile
    const { data: profile } = await supabase
      .from('company_profiles')
      .select('company_name')
      .eq('user_id', req.userId)
      .single();

    // Generate DOCX - content.proposal contains the actual proposal data
    const proposalData = proposal.content?.proposal || proposal.content || {};
    const buffer = await generateDocx(
      proposal.title,
      proposalData,
      profile?.company_name
    );

    // Update exported_at timestamp
    await supabase
      .from('proposals')
      .update({ exported_at: new Date().toISOString() })
      .eq('id', id);

    // Send file
    const filename = `${proposal.title.replace(/[^a-z0-9]/gi, '_')}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export DOCX error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Export proposal as PDF
 * GET /api/proposals/:id/export/pdf
 */
export const exportProposalPdf = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    // Get proposal
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !proposal) {
      return res.status(404).json({
        error: 'Proposal not found',
        message: 'Proposal not found or access denied'
      });
    }

    // Get company name from profile
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('company_name')
      .eq('user_id', req.userId)
      .single();

    if (profileError) {
      console.log('Profile fetch error:', profileError);
    }
    console.log('Fetched profile for PDF export:', profile);

    // Generate PDF - content.proposal contains the actual proposal data
    const proposalData = proposal.content?.proposal || proposal.content || {};
    const buffer = await generatePdf(
      proposal.title,
      proposalData,
      profile?.company_name
    );

    // Update exported_at timestamp
    await supabase
      .from('proposals')
      .update({ exported_at: new Date().toISOString() })
      .eq('id', id);

    // Send file
    const filename = `${proposal.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
