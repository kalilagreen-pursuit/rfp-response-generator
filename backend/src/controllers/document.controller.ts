import { Request, Response } from 'express';
import { supabase } from '../utils/supabase.js';
import { generateFileName, getBucketName, formatFileSize } from '../middleware/upload.middleware.js';

/**
 * Upload a document
 * POST /api/documents/upload
 */
export const uploadDocument = async (req: Request, res: Response) => {
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
        message: 'Please upload a file'
      });
    }

    const { type = 'other' } = req.body;

    // Validate document type
    const validTypes = ['capability', 'resume', 'certification', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid document type',
        message: `Type must be one of: ${validTypes.join(', ')}`
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

    // Generate unique filename
    const fileName = generateFileName(req.file.originalname, req.userId);
    const bucketName = getBucketName(type);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
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

    // Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        profile_id: profile.id,
        type: type,
        file_name: req.file.originalname,
        storage_path: uploadData.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: Delete uploaded file if database insert fails
      await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      throw dbError;
    }

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        type: document.type,
        fileName: document.file_name,
        fileSize: formatFileSize(document.file_size),
        mimeType: document.mime_type,
        uploadedAt: document.uploaded_at
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Upload multiple documents
 * POST /api/documents/upload-multiple
 */
export const uploadMultipleDocuments = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please upload at least one file'
      });
    }

    const { type = 'other' } = req.body;

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

    const bucketName = getBucketName(type);
    const uploadedDocuments = [];
    const errors = [];

    // Upload each file
    for (const file of req.files) {
      try {
        const fileName = generateFileName(file.originalname, req.userId);

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Save metadata
        const { data: document, error: dbError } = await supabase
          .from('documents')
          .insert({
            profile_id: profile.id,
            type: type,
            file_name: file.originalname,
            storage_path: uploadData.path,
            file_size: file.size,
            mime_type: file.mimetype
          })
          .select()
          .single();

        if (dbError) throw dbError;

        uploadedDocuments.push({
          id: document.id,
          fileName: document.file_name,
          fileSize: formatFileSize(document.file_size)
        });
      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(201).json({
      message: `${uploadedDocuments.length} of ${req.files.length} documents uploaded successfully`,
      documents: uploadedDocuments,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Upload multiple documents error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all documents for authenticated user
 * GET /api/documents
 */
export const getUserDocuments = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { type, limit = 50, offset = 0 } = req.query;

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
      .from('documents')
      .select('*')
      .eq('profile_id', profile.id)
      .order('uploaded_at', { ascending: false });

    // Filter by type if provided
    if (type && typeof type === 'string') {
      query = query.eq('type', type);
    }

    // Pagination
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: documents, error, count } = await query;

    if (error) throw error;

    // Format documents
    const formattedDocuments = documents?.map(doc => ({
      id: doc.id,
      type: doc.type,
      fileName: doc.file_name,
      fileSize: formatFileSize(doc.file_size),
      mimeType: doc.mime_type,
      uploadedAt: doc.uploaded_at
    }));

    res.json({
      documents: formattedDocuments || [],
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: count
      }
    });
  } catch (error) {
    console.error('Get user documents error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get document by ID
 * GET /api/documents/:id
 */
export const getDocumentById = async (req: Request, res: Response) => {
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

    // Get document
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('profile_id', profile.id)
      .single();

    if (error || !document) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'Document not found or access denied'
      });
    }

    res.json({
      document: {
        id: document.id,
        type: document.type,
        fileName: document.file_name,
        fileSize: formatFileSize(document.file_size),
        mimeType: document.mime_type,
        uploadedAt: document.uploaded_at,
        storagePath: document.storage_path
      }
    });
  } catch (error) {
    console.error('Get document by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Download document
 * GET /api/documents/:id/download
 */
export const downloadDocument = async (req: Request, res: Response) => {
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

    // Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('profile_id', profile.id)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'Document not found or access denied'
      });
    }

    // Get bucket name
    const bucketName = getBucketName(document.type);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(document.storage_path);

    if (downloadError || !fileData) {
      return res.status(404).json({
        error: 'File not found',
        message: 'File not found in storage'
      });
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Set response headers
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send file
    res.send(buffer);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete document
 * DELETE /api/documents/:id
 */
export const deleteDocument = async (req: Request, res: Response) => {
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

    // Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('profile_id', profile.id)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'Document not found or access denied'
      });
    }

    // Delete from storage
    const bucketName = getBucketName(document.type);
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([document.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('profile_id', profile.id);

    if (deleteError) throw deleteError;

    res.json({
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get document statistics
 * GET /api/documents/stats
 */
export const getDocumentStats = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
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
        message: 'Profile not found'
      });
    }

    // Get document counts by type
    const { data: documents, error } = await supabase
      .from('documents')
      .select('type, file_size')
      .eq('profile_id', profile.id);

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: documents?.length || 0,
      byType: {} as Record<string, number>,
      totalSize: 0,
      totalSizeFormatted: ''
    };

    documents?.forEach(doc => {
      stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
      stats.totalSize += doc.file_size || 0;
    });

    stats.totalSizeFormatted = formatFileSize(stats.totalSize);

    res.json({ stats });
  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
