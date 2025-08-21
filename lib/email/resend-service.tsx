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

function getEmailTemplate(
  role: string,
  firstName: string,
  lastName: string,
  businessName: string,
  invitationToken: string,
) {
  const setupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://app.iv-relife.com"}/auth/setup-account?token=${invitationToken}&type=invitation`

  const roleColors = {
    admin: "#dc2626",
    office: "#2563eb",
    retailer: "#059669",
    location: "#7c3aed",
  }

  const color = roleColors[role as keyof typeof roleColors] || "#6b7280"

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Setup Invitation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to IV Relife</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">You've been invited as a ${role}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: ${color}; margin-top: 0;">Hello ${firstName} ${lastName}!</h2>
          <p>You've been invited to join <strong>${businessName}</strong> as a <strong>${role}</strong>.</p>
          <p>Click the button below to set up your account and get started:</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupUrl}" style="background: ${color}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Set Up Your Account</a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666;">
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">${setupUrl}</p>
          <p style="margin-top: 20px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `
}

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  try {
    console.log("[v0] Sending invitation email with params:", {
      email: params.email,
      role: params.role,
      businessName: params.businessName,
    })

    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY is not configured")
      return { success: false, error: "Email service not configured" }
    }

    const emailHtml = getEmailTemplate(
      params.role,
      params.firstName,
      params.lastName,
      params.businessName || "IV Relife",
      params.invitationToken,
    )

    const result = await resend.emails.send({
      from: "IV Relife <noreply@iv-relife.com>",
      to: [params.email],
      subject: `Welcome to IV Relife - Set up your ${params.role} account`,
      html: emailHtml,
    })

    console.log("[v0] Resend API response:", result)

    if (result.data?.id) {
      return {
        success: true,
        emailId: result.data.id,
      }
    } else {
      console.error("[v0] Resend API error:", result.error)
      return {
        success: false,
        error: result.error?.message || "Failed to send email",
      }
    }
  } catch (error) {
    console.error("[v0] Error sending invitation email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function sendPasswordResetEmail(email: string, firstName: string, lastName: string): Promise<EmailResult> {
  try {
    console.log("[v0] Sending password reset email to:", email)

    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY is not configured")
      return { success: false, error: "Email service not configured" }
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://app.iv-relife.com"}/auth/setup-account?type=recovery`

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #dc2626dd 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">IV Relife Account</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #dc2626; margin-top: 0;">Hello ${firstName} ${lastName}!</h2>
            <p>We received a request to reset your password for your IV Relife account.</p>
            <p>Click the button below to set a new password:</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666;">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">${resetUrl}</p>
            <p style="margin-top: 20px;">If you didn't request this password reset, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: "IV Relife <noreply@iv-relife.com>",
      to: [email],
      subject: "Reset your IV Relife password",
      html: emailHtml,
    })

    console.log("[v0] Password reset email response:", result)

    if (result.data?.id) {
      return {
        success: true,
        emailId: result.data.id,
      }
    } else {
      console.error("[v0] Resend API error:", result.error)
      return {
        success: false,
        error: result.error?.message || "Failed to send email",
      }
    }
  } catch (error) {
    console.error("[v0] Error sending password reset email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
