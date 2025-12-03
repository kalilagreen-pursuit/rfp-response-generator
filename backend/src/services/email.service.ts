/**
 * Email Service
 * Handles email template generation and sending
 */

import { Resend } from 'resend';

// Lazy-initialize Resend to avoid crashes when API key is missing
let resend: Resend | null = null;

const getResendClient = (): Resend | null => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

// Default from email
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@rfp-generator.com';

interface InvitationEmailData {
  recipientEmail: string;
  recipientRole: string;
  proposalTitle: string;
  inviterCompanyName: string;
  invitationLink: string;
  personalMessage?: string;
  rateRange?: { min: number; max: number };
}

interface AcceptanceNotificationData {
  recipientEmail: string;
  memberEmail: string;
  memberRole: string;
  proposalTitle: string;
}

interface DeclineNotificationData {
  recipientEmail: string;
  memberEmail: string;
  memberRole: string;
  proposalTitle: string;
}

/**
 * Generate HTML email template for team invitation
 */
export const generateInvitationEmailHTML = (data: InvitationEmailData): string => {
  const rateRangeHTML = data.rateRange
    ? `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Proposed Rate Range:</p>
        <p style="margin: 4px 0 0 0; font-size: 16px; color: #111827; font-weight: 600;">
          $${data.rateRange.min} - $${data.rateRange.max}/hour
        </p>
      </td>
    </tr>
    `
    : '';

  const personalMessageHTML = data.personalMessage
    ? `
    <div style="background-color: #f9fafb; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #6b7280; font-style: italic;">
        "${data.personalMessage}"
      </p>
    </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposal Collaboration Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">
                You're Invited to Collaborate!
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: #fecaca;">
                Proposal Team Collaboration
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">

              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #111827; line-height: 1.6;">
                Hello,
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #111827; line-height: 1.6;">
                <strong>${data.inviterCompanyName}</strong> has invited you to collaborate on a proposal as a <strong>${data.recipientRole}</strong>.
              </p>

              <!-- Personal Message (if provided) -->
              ${personalMessageHTML}

              <!-- Proposal Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827; font-weight: 600;">
                  Proposal Details
                </h2>

                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">Project Title:</p>
                      <p style="margin: 4px 0 0 0; font-size: 16px; color: #111827; font-weight: 600;">
                        ${data.proposalTitle}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">Your Role:</p>
                      <p style="margin: 4px 0 0 0; font-size: 16px; color: #111827; font-weight: 600;">
                        ${data.recipientRole}
                      </p>
                    </td>
                  </tr>

                  ${rateRangeHTML}

                  <tr>
                    <td style="padding: 16px 0 0 0;">
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">Invited by:</p>
                      <p style="margin: 4px 0 0 0; font-size: 16px; color: #111827; font-weight: 600;">
                        ${data.inviterCompanyName}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.invitationLink}" style="display: inline-block; padding: 14px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.4);">
                      View Invitation & Respond
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${data.invitationLink}" style="color: #dc2626; word-break: break-all;">
                  ${data.invitationLink}
                </a>
              </p>

              <!-- Next Steps -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 600;">
                  What happens next?
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                  <li>Review the proposal details and your proposed role</li>
                  <li>Accept or decline the invitation within the platform</li>
                  <li>If you accept, you'll gain access to the proposal workspace</li>
                  <li>Collaborate with the team to deliver an outstanding proposal</li>
                </ul>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                This invitation was sent by ${data.inviterCompanyName}
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} RFP Response Generator. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Generate plain text version of invitation email
 */
export const generateInvitationEmailText = (data: InvitationEmailData): string => {
  const rateRangeText = data.rateRange
    ? `\nProposed Rate Range: $${data.rateRange.min} - $${data.rateRange.max}/hour\n`
    : '';

  const personalMessageText = data.personalMessage
    ? `\nPersonal Message:\n"${data.personalMessage}"\n`
    : '';

  return `
You're Invited to Collaborate!

Hello,

${data.inviterCompanyName} has invited you to collaborate on a proposal as a ${data.recipientRole}.
${personalMessageText}
PROPOSAL DETAILS
================
Project Title: ${data.proposalTitle}
Your Role: ${data.recipientRole}${rateRangeText}
Invited by: ${data.inviterCompanyName}

VIEW INVITATION & RESPOND
=========================
${data.invitationLink}

WHAT HAPPENS NEXT?
==================
1. Review the proposal details and your proposed role
2. Accept or decline the invitation within the platform
3. If you accept, you'll gain access to the proposal workspace
4. Collaborate with the team to deliver an outstanding proposal

---
This invitation was sent by ${data.inviterCompanyName}
© ${new Date().getFullYear()} RFP Response Generator. All rights reserved.
  `.trim();
};

/**
 * Generate HTML email for acceptance notification
 */
export const generateAcceptanceNotificationHTML = (data: AcceptanceNotificationData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Member Accepted Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">
                ✓ Invitation Accepted!
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #111827; line-height: 1.6;">
                Great news! <strong>${data.memberEmail}</strong> has accepted your invitation to join the proposal team.
              </p>

              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #15803d; font-weight: 600;">
                  Proposal: ${data.proposalTitle}
                </p>
                <p style="margin: 0; font-size: 14px; color: #166534;">
                  Role: ${data.memberRole}
                </p>
              </div>

              <p style="margin: 24px 0; font-size: 16px; color: #111827; line-height: 1.6;">
                They now have access to the proposal workspace and can start collaborating with your team.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} RFP Response Generator. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Generate HTML email for decline notification
 */
export const generateDeclineNotificationHTML = (data: DeclineNotificationData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Member Declined Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">
                Invitation Declined
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #111827; line-height: 1.6;">
                <strong>${data.memberEmail}</strong> has declined your invitation to join the proposal team.
              </p>

              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">
                  Proposal: ${data.proposalTitle}
                </p>
                <p style="margin: 0; font-size: 14px; color: #7f1d1d;">
                  Role: ${data.memberRole}
                </p>
              </div>

              <p style="margin: 24px 0; font-size: 16px; color: #111827; line-height: 1.6;">
                You may want to consider inviting another team member to fill this role.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} RFP Response Generator. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Send invitation email to team member
 */
export const sendInvitationEmail = async (data: InvitationEmailData): Promise<{ success: boolean; error?: string }> => {
  try {
    const client = getResendClient();
    if (!client) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    const htmlContent = generateInvitationEmailHTML(data);
    const textContent = generateInvitationEmailText(data);

    const result = await client.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: `You're invited to collaborate on ${data.proposalTitle}`,
      html: htmlContent,
      text: textContent,
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Invitation email sent successfully:', result.data?.id);
    return { success: true };
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Send acceptance notification email to proposal owner
 */
export const sendAcceptanceNotification = async (data: AcceptanceNotificationData): Promise<{ success: boolean; error?: string }> => {
  try {
    const client = getResendClient();
    if (!client) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    const htmlContent = generateAcceptanceNotificationHTML(data);

    const result = await client.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: `${data.memberEmail} accepted your invitation`,
      html: htmlContent,
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Acceptance notification sent successfully:', result.data?.id);
    return { success: true };
  } catch (error) {
    console.error('Failed to send acceptance notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Send decline notification email to proposal owner
 */
export const sendDeclineNotification = async (data: DeclineNotificationData): Promise<{ success: boolean; error?: string }> => {
  try {
    const client = getResendClient();
    if (!client) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    const htmlContent = generateDeclineNotificationHTML(data);

    const result = await client.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: `${data.memberEmail} declined your invitation`,
      html: htmlContent,
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Decline notification sent successfully:', result.data?.id);
    return { success: true };
  } catch (error) {
    console.error('Failed to send decline notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export default {
  generateInvitationEmailHTML,
  generateInvitationEmailText,
  generateAcceptanceNotificationHTML,
  generateDeclineNotificationHTML,
  sendInvitationEmail,
  sendAcceptanceNotification,
  sendDeclineNotification,
};
