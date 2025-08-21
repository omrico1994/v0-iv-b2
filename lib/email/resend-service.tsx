import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvitationEmailParams {
  to: string
  firstName: string
  lastName: string
  role: string
  businessName?: string
  setupUrl: string
}

interface EmailResult {
  success: boolean
  emailId?: string
  error?: string
}

const fromEmail = "noreply@updates.iv-relife.com"
const fromName = "IV Relife Team"

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  console.log("[v0] Sending invitation email with params:", params)

  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY is not configured")
      return { success: false, error: "Email service not configured" }
    }

    const roleColors = {
      admin: "#dc2626",
      office: "#2563eb",
      retailer: "#059669",
      location: "#7c3aed",
    }

    const roleColor = roleColors[params.role as keyof typeof roleColors] || "#6b7280"

    const emailData = {
      from: `${fromName} <${fromEmail}>`,
      to: params.to,
      subject: `Welcome to IV Relife - Complete Your ${params.role} Account Setup`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Account Setup</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, ${roleColor} 0%, ${roleColor}dd 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to IV Relife</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Complete your ${params.role} account setup</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                Hello ${params.firstName} ${params.lastName},
              </p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                You've been invited to join IV Relife as a <strong style="color: ${roleColor};">${params.role}</strong>${params.businessName ? ` for ${params.businessName}` : ""}. 
                To get started, please complete your account setup by clicking the button below.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${params.setupUrl}" 
                   style="display: inline-block; background-color: ${roleColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; transition: all 0.2s;">
                  Complete Account Setup
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 20px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${params.setupUrl}" style="color: ${roleColor}; word-break: break-all;">${params.setupUrl}</a>
              </p>

              <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                © 2025 IV Relife. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    console.log("[v0] Sending email with data:", { ...emailData, html: "[HTML_CONTENT]" })

    const result = await resend.emails.send(emailData)

    console.log("[v0] Resend API response:", result)

    if (result.data?.id) {
      return { success: true, emailId: result.data.id }
    } else {
      console.error("[v0] Resend API error:", result.error)
      return { success: false, error: result.error?.message || "Failed to send email" }
    }
  } catch (error) {
    console.error("[v0] Email sending error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function sendPasswordResetEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  console.log("[v0] Sending password reset email with params:", params)

  return sendInvitationEmail({
    ...params,
    setupUrl: params.setupUrl, // This should be the password reset URL
  })
}
