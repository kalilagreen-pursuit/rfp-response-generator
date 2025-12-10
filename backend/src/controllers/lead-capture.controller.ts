import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../services/email.service.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/lead-capture/:uniqueCode
 * Get company information for the lead capture page (public endpoint)
 */
export async function getLeadCaptureInfo(req: Request, res: Response): Promise<void> {
  try {
    const { uniqueCode } = req.params;

    // Find the QR code
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('id, user_id, profile_id, is_active, scan_count')
      .eq('unique_code', uniqueCode)
      .single();

    if (qrError || !qrCode) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    if (!qrCode.is_active) {
      res.status(403).json({ error: 'This QR code is no longer active' });
      return;
    }

    // Update scan count
    await supabase
      .from('qr_codes')
      .update({
        scan_count: (qrCode.scan_count || 0) + 1,
        last_scanned_at: new Date().toISOString(),
      })
      .eq('id', qrCode.id);

    // Get company profile info
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('company_name')
      .eq('id', qrCode.profile_id)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ error: 'Company profile not found' });
      return;
    }

    res.json({
      companyName: profile.company_name,
      companyLogo: null, // Logo URL not yet implemented in schema
    });
  } catch (error) {
    console.error('Get lead capture info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/lead-capture/:uniqueCode
 * Submit a new lead through the lead capture form (public endpoint)
 */
export async function submitLead(req: Request, res: Response): Promise<void> {
  try {
    const { uniqueCode } = req.params;
    const { companyName, contactName, email, phone, industry, message } = req.body;

    // Validate required fields
    if (!companyName || !contactName || !email || !phone) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Find the QR code
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('id, user_id, profile_id, label, is_active')
      .eq('unique_code', uniqueCode)
      .single();

    if (qrError || !qrCode) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    if (!qrCode.is_active) {
      res.status(403).json({ error: 'This QR code is no longer active' });
      return;
    }

    // Get company profile for emails
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('company_name')
      .eq('id', qrCode.profile_id)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ error: 'Company profile not found' });
      return;
    }

    // Get user info for email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      qrCode.user_id
    );

    if (userError || !userData.user) {
      console.error('User fetch error:', userError);
      res.status(500).json({ error: 'Failed to fetch user information' });
      return;
    }

    // Insert lead
    const { data: lead, error: insertError } = await supabase
      .from('qr_leads')
      .insert({
        qr_code_id: qrCode.id,
        company_owner_id: qrCode.user_id,
        company_name: companyName,
        contact_name: contactName,
        email: email.toLowerCase(),
        phone,
        industry: industry || null,
        message: message || null,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Lead insert error:', insertError);
      res.status(500).json({ error: 'Failed to save lead information' });
      return;
    }

    // Send email to company user (notification)
    const qrLabel = qrCode.label || 'Unnamed QR Code';
    const companyEmail = userData.user.email;

    if (companyEmail) {
      try {
        await sendEmail({
          to: companyEmail,
          subject: `New Lead from QR Code: ${companyName}`,
          html: `
            <h2>New Lead Captured!</h2>
            <p>You have a new lead from your QR code: <strong>${qrLabel}</strong></p>

            <h3>Contact Details:</h3>
            <ul>
              <li><strong>Company:</strong> ${companyName}</li>
              <li><strong>Name:</strong> ${contactName}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Phone:</strong> ${phone}</li>
              ${industry ? `<li><strong>Industry:</strong> ${industry}</li>` : ''}
            </ul>

            ${message ? `<h3>Message:</h3><p>${message}</p>` : ''}

            <p><a href="${process.env.FRONTEND_URL}/marketing/leads">View all leads in your dashboard</a></p>

            <hr />
            <p style="color: #666; font-size: 12px;">RFP Response Generator</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Send welcome email to potential client
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const signupLink = `${frontendUrl}/signup?email=${encodeURIComponent(email)}`;

    try {
      await sendEmail({
        to: email,
        subject: `Welcome! Let's Get Started - ${profile.company_name}`,
        html: `
          <h2>Thank you for connecting with ${profile.company_name}!</h2>
          <p>Hi ${contactName},</p>

          <p>We're excited to work with you. To get started, please create your account and complete your company profile:</p>

          <p style="margin: 20px 0;">
            <a href="${signupLink}"
               style="background-color: #4A5859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Create Your Account
            </a>
          </p>

          <h3>Once your profile is complete, you'll be able to:</h3>
          <ul>
            <li>Submit RFPs and receive proposals</li>
            <li>Connect with verified companies</li>
            <li>Manage your procurement workflow</li>
          </ul>

          <p>Questions? Reply to this email - we're here to help!</p>

          <p>Best regards,<br/>The ${profile.company_name} Team</p>

          <hr />
          <p style="color: #666; font-size: 12px;">RFP Response Generator</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Check your email for next steps.',
    });
  } catch (error) {
    console.error('Submit lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
