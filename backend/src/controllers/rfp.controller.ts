import { Request, Response } from 'express';
import { supabase } from '../utils/supabase.js';
import { parseRFPDocument } from '../services/gemini.service.js';
import { generateFileName, formatFileSize } from '../middleware/upload.middleware.js';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract text from uploaded file
 */
const extractTextFromFile = async (buffer: Buffer, mimeType: string): Promise<string> => {
  try {
    if (mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (mimeType === 'text/plain') {
      return buffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Upload and parse RFP document
 * POST /api/rfp/upload
 */
export const uploadAndParseRFP = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload an RFP document (PDF, DOCX, or TXT)'
      });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Please create a company profile first'
      });
    }

    // Extract text from file
    const extractedText = await extractTextFromFile(req.file.buffer, req.file.mimetype);

    if (!extractedText || extractedText.trim().length < 100) {
      return res.status(400).json({
        error: 'Insufficient content',
        message: 'The uploaded document does not contain enough text to parse'
      });
    }

    // Upload file to Supabase Storage
    const fileName = generateFileName(req.file.originalname, req.userId);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rfp-documents')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({
        error: 'Upload failed',
        message: uploadError.message
      });
    }

    // Parse RFP with Gemini AI
    const parsedData = await parseRFPDocument(extractedText);

    // Save RFP metadata and parsed data to database
    const { data: rfpUpload, error: dbError } = await supabase
      .from('rfp_uploads')
      .insert({
        profile_id: profile.id,
        file_name: req.file.originalname,
        storage_path: uploadData.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        extracted_text: extractedText.substring(0, 50000), // Limit stored text
        parsed_data: parsedData,
        status: 'parsed'
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: Delete uploaded file
      await supabase.storage
        .from('rfp-documents')
        .remove([fileName]);
      throw dbError;
    }

    res.status(201).json({
      message: 'RFP uploaded and parsed successfully',
      rfp: {
        id: rfpUpload.id,
        fileName: rfpUpload.file_name,
        fileSize: formatFileSize(rfpUpload.file_size),
        status: rfpUpload.status,
        uploadedAt: rfpUpload.uploaded_at,
        parsedData: parsedData
      }
    });
  } catch (error) {
    console.error('RFP upload and parse error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all RFPs for authenticated user
 * GET /api/rfp
 */
export const getUserRFPs = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { status, limit = 20, offset = 0 } = req.query;

    // Get user's profile
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

    let query = supabase
      .from('rfp_uploads')
      .select('id, file_name, file_size, status, uploaded_at, parsed_data')
      .eq('profile_id', profile.id)
      .order('uploaded_at', { ascending: false });

    // Filter by status
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    // Pagination
    const limitNum = parseInt(limit as string) || 20;
    const offsetNum = parseInt(offset as string) || 0;
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: rfps, error, count } = await query;

    if (error) throw error;

    // Format response
    const formattedRFPs = rfps?.map(rfp => ({
      id: rfp.id,
      fileName: rfp.file_name,
      fileSize: formatFileSize(rfp.file_size),
      status: rfp.status,
      uploadedAt: rfp.uploaded_at,
      title: rfp.parsed_data?.title || 'Untitled RFP',
      organization: rfp.parsed_data?.issuingOrganization || null,
      deadline: rfp.parsed_data?.timeline?.submissionDeadline || null
    }));

    res.json({
      rfps: formattedRFPs || [],
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: count
      }
    });
  } catch (error) {
    console.error('Get user RFPs error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get RFP by ID
 * GET /api/rfp/:id
 */
export const getRFPById = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    // Get user's profile
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

    // Get RFP
    const { data: rfp, error } = await supabase
      .from('rfp_uploads')
      .select('*')
      .eq('id', id)
      .eq('profile_id', profile.id)
      .single();

    if (error || !rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'RFP not found or access denied'
      });
    }

    res.json({
      rfp: {
        id: rfp.id,
        fileName: rfp.file_name,
        fileSize: formatFileSize(rfp.file_size),
        mimeType: rfp.mime_type,
        status: rfp.status,
        uploadedAt: rfp.uploaded_at,
        extractedText: rfp.extracted_text,
        parsedData: rfp.parsed_data
      }
    });
  } catch (error) {
    console.error('Get RFP by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Re-parse an existing RFP
 * POST /api/rfp/:id/reparse
 */
export const reparseRFP = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    // Get user's profile
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

    // Get existing RFP
    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_uploads')
      .select('*')
      .eq('id', id)
      .eq('profile_id', profile.id)
      .single();

    if (rfpError || !rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'RFP not found or access denied'
      });
    }

    if (!rfp.extracted_text) {
      return res.status(400).json({
        error: 'No text available',
        message: 'This RFP does not have extracted text to re-parse'
      });
    }

    // Re-parse with Gemini AI
    const parsedData = await parseRFPDocument(rfp.extracted_text);

    // Update database
    const { data: updatedRFP, error: updateError } = await supabase
      .from('rfp_uploads')
      .update({
        parsed_data: parsedData,
        status: 'parsed'
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      message: 'RFP re-parsed successfully',
      rfp: {
        id: updatedRFP.id,
        fileName: updatedRFP.file_name,
        status: updatedRFP.status,
        parsedData: parsedData
      }
    });
  } catch (error) {
    console.error('Re-parse RFP error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete RFP
 * DELETE /api/rfp/:id
 */
export const deleteRFP = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    // Get user's profile
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

    // Get RFP
    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_uploads')
      .select('*')
      .eq('id', id)
      .eq('profile_id', profile.id)
      .single();

    if (rfpError || !rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'RFP not found or access denied'
      });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('rfp-documents')
      .remove([rfp.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('rfp_uploads')
      .delete()
      .eq('id', id)
      .eq('profile_id', profile.id);

    if (deleteError) throw deleteError;

    res.json({
      message: 'RFP deleted successfully'
    });
  } catch (error) {
    console.error('Delete RFP error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Download original RFP file
 * GET /api/rfp/:id/download
 */
export const downloadRFP = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    // Get user's profile
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

    // Get RFP
    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_uploads')
      .select('*')
      .eq('id', id)
      .eq('profile_id', profile.id)
      .single();

    if (rfpError || !rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'RFP not found or access denied'
      });
    }

    // Download from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('rfp-documents')
      .download(rfp.storage_path);

    if (downloadError || !fileData) {
      return res.status(404).json({
        error: 'File not found',
        message: 'File not found in storage'
      });
    }

    // Convert to buffer and send
    const buffer = Buffer.from(await fileData.arrayBuffer());

    res.setHeader('Content-Type', rfp.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${rfp.file_name}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('Download RFP error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
