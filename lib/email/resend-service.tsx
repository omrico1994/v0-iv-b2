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

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  console.log("[v0] Sending invitation email with params:", {
    to: params.to,
    firstName: params.firstName,
    lastName: params.lastName,
    role: params.role,
    businessName: params.businessName,
    setupUrl: params.setupUrl,
  })

  try {
    const roleColors = {
      admin: "#dc2626",
      office: "#2563eb",
      retailer: "#059669",
      location: "#7c3aed",
    }

    const roleColor = roleColors[params.role as keyof typeof roleColors] || "#6b7280"
    const displayName = `${params.firstName} ${params.lastName}`
    const roleDisplay = params.role.charAt(0).toUpperCase() + params.role.slice(1)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to IV Relife</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${roleColor} 0%, ${roleColor}dd 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to IV Relife</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Complete your ${roleDisplay} account setup</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hello ${displayName},</h2>
            
            <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px;">
              You've been invited to join IV Relife as a <strong style="color: ${roleColor};">${roleDisplay}</strong>${params.businessName ? ` for <strong>${params.businessName}</strong>` : ""}. To get started, please complete your account setup by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${params.setupUrl}" style="background: ${roleColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; transition: all 0.2s;">
                Complete Account Setup
              </a>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: ${roleColor}; margin: 10px 0 0 0; font-size: 14px; word-break: break-all;">
                <a href="${params.setupUrl}" style="color: ${roleColor};">${params.setupUrl}</a>
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            © 2025 IV Relife. All rights reserved.
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: `IV Relife <noreply@updates.iv-relife.com>`,
      to: params.to,
      subject: `Welcome to IV Relife - Complete Your ${roleDisplay} Account Setup`,
      html: htmlContent,
    })

    if (error) {
      console.error("[v0] Resend API error:", error)
      return {
        success: false,
        error: error.message || "Failed to send email",
      }
    }

    console.log("[v0] Email sent successfully:", data)
    return {
      success: true,
      emailId: data?.id,
    }
  } catch (error) {
    console.error("[v0] Error sending invitation email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function sendPasswordResetEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  console.log("[v0] Sending password reset email with params:", {
    to: params.to,
    firstName: params.firstName,
    lastName: params.lastName,
    role: params.role,
    setupUrl: params.setupUrl,
  })

  try {
    const roleColors = {
      admin: "#dc2626",
      office: "#2563eb",
      retailer: "#059669",
      location: "#7c3aed",
    }

    const roleColor = roleColors[params.role as keyof typeof roleColors] || "#6b7280"
    const displayName = `${params.firstName} ${params.lastName}`
    const roleDisplay = params.role.charAt(0).toUpperCase() + params.role.slice(1)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - IV Relife</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${roleColor} 0%, ${roleColor}dd 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Reset Your Password</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Complete your account setup</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hello ${displayName},</h2>
            
            <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px;">
              You requested to reset your password for your IV Relife ${roleDisplay} account. Click the button below to set a new password and complete your account setup.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${params.setupUrl}" style="background: ${roleColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Reset Password & Complete Setup
              </a>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: ${roleColor}; margin: 10px 0 0 0; font-size: 14px; word-break: break-all;">
                <a href="${params.setupUrl}" style="color: ${roleColor};">${params.setupUrl}</a>
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            © 2025 IV Relife. All rights reserved.
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: `IV Relife <noreply@updates.iv-relife.com>`,
      to: params.to,
      subject: `Reset Your Password - IV Relife`,
      html: htmlContent,
    })

    if (error) {
      console.error("[v0] Resend API error:", error)
      return {
        success: false,
        error: error.message || "Failed to send email",
      }
    }

    console.log("[v0] Password reset email sent successfully:", data)
    return {
      success: true,
      emailId: data?.id,
    }
  } catch (error) {
    console.error("[v0] Error sending password reset email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
