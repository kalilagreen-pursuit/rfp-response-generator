import multer from 'multer';
import { Request } from 'express';

// File type validation
const allowedMimeTypes = {
  document: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain'
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
};

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  document: 50 * 1024 * 1024, // 50 MB
  image: 10 * 1024 * 1024      // 10 MB
};

/**
 * Multer configuration for memory storage
 * Files are stored in memory temporarily before uploading to Supabase
 */
const storage = multer.memoryStorage();

/**
 * File filter to validate file types
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Get allowed types based on upload type from request body or default to document
  const uploadType = (req.body?.type || 'document') as string;

  const allowedTypes = [
    ...allowedMimeTypes.document,
    ...allowedMimeTypes.image
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: PDF, DOCX, DOC, TXT, JPG, PNG, GIF, WEBP`));
  }
};

/**
 * Multer upload middleware
 */
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.document, // Use max file size
    files: 1 // Single file upload per request
  }
});

/**
 * Multiple file upload middleware (for batch uploads)
 */
export const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.document,
    files: 10 // Max 10 files per request
  }
});

/**
 * Validate file size based on document type
 */
export const validateFileSize = (file: Express.Multer.File, type: string): boolean => {
  const maxSize = type === 'image' ? FILE_SIZE_LIMITS.image : FILE_SIZE_LIMITS.document;
  return file.size <= maxSize;
};

/**
 * Validate file type
 */
export const validateFileType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.mimetype);
};

/**
 * Generate unique filename
 */
export const generateFileName = (originalName: string, userId: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.split('.').slice(0, -1).join('.');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');

  return `${userId}/${timestamp}_${randomString}_${sanitizedName}.${extension}`;
};

/**
 * Get storage bucket name based on document type
 */
export const getBucketName = (type: string): string => {
  switch (type) {
    case 'capability':
      return 'capability-statements';
    case 'resume':
    case 'certification':
      return 'capability-statements'; // Same bucket for all company docs
    case 'rfp':
      return 'rfp-documents';
    case 'proposal':
      return 'proposal-exports';
    default:
      return 'capability-statements';
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
