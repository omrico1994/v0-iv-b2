import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailTemplate {
  subject: string
  html: string
}

interface SendInvitationEmailParams {
  email: string
  role: string
  invitationToken: string
  invitedBy: string
  retailerName?: string
}

interface EmailResult {
  success: boolean
  emailId?: string
  error?: string
}

function getEmailTemplate(role: string, invitationToken: string, retailerName?: string): EmailTemplate {
  const setupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://app.iv-relife.com"}/auth/setup-account?token=${invitationToken}&type=invitation`

  const roleColors = {
    admin: "#dc2626", // red-600
    office: "#2563eb", // blue-600
    retailer: "#059669", // emerald-600
    location: "#7c3aed", // violet-600
  }

  const roleDescriptions = {
    admin: "system administrator with full access",
    office: "office staff member with management access",
    retailer: `retailer partner${retailerName ? ` for ${retailerName}` : ""}`,
    location: `location manager${retailerName ? ` for ${retailerName}` : ""}`,
  }

  const color = roleColors[role as keyof typeof roleColors] || "#6b7280"
  const description = roleDescriptions[role as keyof typeof roleDescriptions] || "team member"

  return {
    subject: `Complete Your Account Setup - ${role.charAt(0).toUpperCase() + role.slice(1)} Access`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Account Setup</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">
                Welcome to IV Relife
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                You've been invited as a ${description}
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 32px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background-color: ${color}15; color: ${color}; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 24px;">
                  ${role.toUpperCase()} ACCESS
                </div>
                
                <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 600;">
                  Complete Your Account Setup
                </h2>
                
                <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                  Click the button below to set your password and complete your profile setup. This link will expire in 24 hours.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${setupUrl}" 
                   style="display: inline-block; background-color: ${color}; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.2s;">
                  Complete Account Setup
                </a>
              </div>

              <!-- Alternative Link -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0; word-break: break-all; color: ${color}; font-size: 14px;">
                  ${setupUrl}
                </p>
              </div>

              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export async function sendInvitationEmail({
  email,
  role,
  invitationToken,
  invitedBy,
  retailerName,
}: SendInvitationEmailParams): Promise<EmailResult> {
  try {
    const template = getEmailTemplate(role, invitationToken, retailerName)

    const { data, error } = await resend.emails.send({
      from: "IV Relife <noreply@iv-relife.com>",
      to: [email],
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      console.error("[v0] Resend email error:", error)
      return {
        success: false,
        error: error.message || "Failed to send email",
      }
    }

    return {
      success: true,
      emailId: data?.id,
    }
  } catch (error) {
    console.error("[v0] Resend service error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName,
}: {
  to: string
  resetUrl: string
  userName: string
}): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: "IV Relife <noreply@iv-relife.com>",
      to: [to],
      subject: "Reset Your Password - IV Relife",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #dc2626 0%, #dc2626dd 100%); padding: 40px 32px; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">
                  Reset Your Password
                </h1>
                <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                  Complete your account setup
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Hello ${userName}
                  </h2>
                  
                  <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                    Click the button below to set your password and complete your account setup. This link will expire in 24 hours.
                  </p>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}" 
                     style="display: inline-block; background-color: #dc2626; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.2s;">
                    Complete Account Setup
                  </a>
                </div>

                <!-- Alternative Link -->
                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 0; word-break: break-all; color: #dc2626; font-size: 14px;">
                    ${resetUrl}
                  </p>
                </div>

                <!-- Footer -->
                <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("[v0] Resend password reset email error:", error)
      return {
        success: false,
        error: error.message || "Failed to send password reset email",
      }
    }

    return {
      success: true,
      emailId: data?.id,
    }
  } catch (error) {
    console.error("[v0] Resend password reset service error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
