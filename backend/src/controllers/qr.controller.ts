import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Generate a unique short code for QR codes
 */
function generateUniqueCode(): string {
  return crypto.randomBytes(6).toString('base64url').substring(0, 8);
}

/**
 * POST /api/qr-codes
 * Generate a new QR code for the authenticated user
 */
export async function createQRCode(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { label } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get user's company profile
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ error: 'Company profile not found' });
      return;
    }

    // Generate unique code
    let uniqueCode = generateUniqueCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('unique_code', uniqueCode)
        .single();

      if (!existing) break;
      uniqueCode = generateUniqueCode();
      attempts++;
    }

    if (attempts === maxAttempts) {
      res.status(500).json({ error: 'Failed to generate unique code' });
      return;
    }

    // Create QR code record
    const { data: qrCode, error: insertError } = await supabase
      .from('qr_codes')
      .insert({
        user_id: userId,
        profile_id: profile.id,
        unique_code: uniqueCode,
        label: label || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('QR code insert error:', insertError);
      res.status(500).json({ error: 'Failed to create QR code' });
      return;
    }

    // Generate QR code image
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrUrl = `${frontendUrl}/lead-capture/${uniqueCode}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 400,
      margin: 2,
    });

    res.status(201).json({
      id: qrCode.id,
      uniqueCode: qrCode.unique_code,
      label: qrCode.label,
      qrCodeDataURL,
      url: qrUrl,
      createdAt: qrCode.created_at,
    });
  } catch (error) {
    console.error('Create QR code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/qr-codes
 * List all QR codes for the authenticated user
 */
export async function listQRCodes(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { data: qrCodes, error } = await supabase
      .from('qr_codes')
      .select('id, unique_code, label, created_at, is_active, scan_count, last_scanned_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('List QR codes error:', error);
      res.status(500).json({ error: 'Failed to fetch QR codes' });
      return;
    }

    res.json(qrCodes || []);
  } catch (error) {
    console.error('List QR codes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/qr-codes/:id
 * Get details of a specific QR code including leads
 */
export async function getQRCodeDetails(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get QR code
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (qrError || !qrCode) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    // Get associated leads
    const { data: leads, error: leadsError } = await supabase
      .from('qr_leads')
      .select('id, company_name, contact_name, email, phone, industry, message, created_at, converted_to_user')
      .eq('qr_code_id', id)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('Fetch leads error:', leadsError);
      res.status(500).json({ error: 'Failed to fetch leads' });
      return;
    }

    // Transform leads from snake_case to camelCase for frontend
    const transformedLeads = (leads || []).map((lead: any) => ({
      id: lead.id,
      companyName: lead.company_name,
      contactName: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      industry: lead.industry,
      message: lead.message,
      createdAt: lead.created_at,
      convertedToUser: lead.converted_to_user,
    }));

    // Generate QR code data URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrUrl = `${frontendUrl}/lead-capture/${qrCode.unique_code}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 400,
      margin: 2,
    });

    res.json({
      ...qrCode,
      qrCodeDataURL,
      url: qrUrl,
      leads: transformedLeads,
    });
  } catch (error) {
    console.error('Get QR code details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/qr-codes/:id
 * Update QR code (toggle active status or update label)
 */
export async function updateQRCode(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { isActive, label } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const updates: any = {};
    if (typeof isActive === 'boolean') updates.is_active = isActive;
    if (label !== undefined) updates.label = label;

    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !qrCode) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    res.json(qrCode);
  } catch (error) {
    console.error('Update QR code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/qr-codes/:id
 * Delete a QR code
 */
export async function deleteQRCode(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete QR code error:', error);
      res.status(500).json({ error: 'Failed to delete QR code' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete QR code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/qr-codes/:id/leads
 * Get all leads for a specific QR code
 */
export async function getQRCodeLeads(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify ownership
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (qrError || !qrCode) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    // Get leads
    const { data: leads, error: leadsError } = await supabase
      .from('qr_leads')
      .select('id, company_name, contact_name, email, phone, industry, message, created_at, invited_at, converted_to_user')
      .eq('qr_code_id', id)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('Fetch leads error:', leadsError);
      res.status(500).json({ error: 'Failed to fetch leads' });
      return;
    }

    // Transform leads from snake_case to camelCase for frontend
    const transformedLeads = (leads || []).map((lead: any) => ({
      id: lead.id,
      companyName: lead.company_name,
      contactName: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      industry: lead.industry,
      message: lead.message,
      createdAt: lead.created_at,
      invitedAt: lead.invited_at,
      convertedToUser: lead.converted_to_user,
    }));

    res.json(transformedLeads);
  } catch (error) {
    console.error('Get QR code leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
