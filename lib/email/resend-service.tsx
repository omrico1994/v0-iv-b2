import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvitationEmailParams {
  email: string
  firstName: string
  lastName: string
  role: string
  businessName?: string
  invitationToken: string
}

interface EmailResult {
  success: boolean
  emailId?: string
  error?: string
}

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  try {
    console.log("[v0] Sending invitation email to:", params.email)
    console.log("[v0] Role:", params.role)
    console.log("[v0] Business:", params.businessName)

    const setupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://app.iv-relife.com"}/auth/setup-account?token=${params.invitationToken}&type=invitation`

    const roleColors = {
      admin: "#dc2626",
      office: "#2563eb",
      retailer: "#059669",
      location: "#7c3aed",
    }

    const roleColor = roleColors[params.role as keyof typeof roleColors] || "#6b7280"

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Setup Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${roleColor} 0%, ${roleColor}dd 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to IV Relife</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You've been invited as a ${params.role}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Hello ${params.firstName} ${params.lastName},</h2>
            <p style="margin: 0 0 15px 0; color: #4b5563;">You've been invited to join IV Relife as a <strong style="color: ${roleColor};">${params.role}</strong>${params.businessName ? ` for ${params.businessName}` : ""}.</p>
            <p style="margin: 0; color: #4b5563;">Click the button below to set up your account and get started.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" style="background: ${roleColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">Set Up My Account</a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">If you can't click the button, copy and paste this link into your browser:</p>
            <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 5px 0 0 0;">${setupUrl}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 IV Relife. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: "IV Relife <noreply@iv-relife.com>",
      to: params.email, // Single string, not array
      subject: `Welcome to IV Relife - Set up your ${params.role} account`,
      html: emailHtml,
    })

    console.log("[v0] Email sent successfully:", result.data?.id)

    return {
      success: true,
      emailId: result.data?.id,
    }
  } catch (error) {
    console.error("[v0] Failed to send invitation email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function sendPasswordResetEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  try {
    console.log("[v0] Sending password reset email to:", params.email)

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://app.iv-relife.com"}/auth/setup-account?token=${params.invitationToken}&type=recovery`

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #dc2626dd 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Reset Your Password</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">IV Relife Account Recovery</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Hello ${params.firstName} ${params.lastName},</h2>
            <p style="margin: 0 0 15px 0; color: #4b5563;">You requested to reset your password for your IV Relife account.</p>
            <p style="margin: 0; color: #4b5563;">Click the button below to set a new password.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">Reset Password</a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">If you can't click the button, copy and paste this link into your browser:</p>
            <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 5px 0 0 0;">${resetUrl}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">© 2024 IV Relife. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: "IV Relife <noreply@iv-relife.com>",
      to: params.email, // Single string, not array
      subject: "Reset your IV Relife password",
      html: emailHtml,
    })

    console.log("[v0] Password reset email sent successfully:", result.data?.id)

    return {
      success: true,
      emailId: result.data?.id,
    }
  } catch (error) {
    console.error("[v0] Failed to send password reset email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
