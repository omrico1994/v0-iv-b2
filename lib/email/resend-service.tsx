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

interface SendPasswordResetEmailParams {
  to: string
  firstName: string
  lastName: string
  role: string
  businessName?: string
  resetUrl: string
}

interface EmailResult {
  success: boolean
  emailId?: string
  error?: string
}

function safeCapitalize(str: string | null | undefined): string {
  if (!str || typeof str !== "string") return "User"
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function safeString(str: string | null | undefined, fallback = ""): string {
  return str && typeof str === "string" ? str : fallback
}

function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    admin: "#dc2626",
    office: "#2563eb",
    retailer: "#16a34a",
    location: "#ca8a04",
  }
  return roleColors[role?.toLowerCase()] || "#6b7280"
}

function getEmailTemplate(params: SendInvitationEmailParams): string {
  const firstName = safeCapitalize(params.firstName)
  const lastName = safeCapitalize(params.lastName)
  const role = safeCapitalize(params.role)
  const businessName = safeString(params.businessName, "IV Relife")
  const roleColor = getRoleColor(params.role)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to IV Relife</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${roleColor} 0%, ${roleColor}dd 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to IV Relife</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Complete your ${role} account setup</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hello ${firstName} ${lastName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            You've been invited to join <strong>${businessName}</strong> as a <strong style="color: ${roleColor};">${role}</strong>. 
            To get started, please complete your account setup by clicking the button below.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.setupUrl}" 
               style="display: inline-block; background-color: ${roleColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
              Complete Account Setup
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${params.setupUrl}" style="color: ${roleColor}; word-break: break-all;">${params.setupUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © 2025 IV Relife. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getPasswordResetTemplate(params: SendPasswordResetEmailParams): string {
  const firstName = safeCapitalize(params.firstName)
  const lastName = safeCapitalize(params.lastName)
  const role = safeCapitalize(params.role)
  const businessName = safeString(params.businessName, "IV Relife")
  const roleColor = getRoleColor(params.role)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Complete Your Account Setup - IV Relife</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${roleColor} 0%, ${roleColor}dd 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Complete Your Setup</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Set your password to get started</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hello ${firstName} ${lastName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            Complete your <strong style="color: ${roleColor};">${role}</strong> account setup for <strong>${businessName}</strong> 
            by setting your password. Click the button below to get started.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.resetUrl}" 
               style="display: inline-block; background-color: ${roleColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Set Your Password
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${params.resetUrl}" style="color: ${roleColor}; word-break: break-all;">${params.resetUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © 2025 IV Relife. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  try {
    console.log("[v0] Sending invitation email to:", params.to)
    console.log("[v0] Email params:", {
      firstName: params.firstName,
      lastName: params.lastName,
      role: params.role,
      businessName: params.businessName,
      setupUrl: params.setupUrl,
    })

    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY not found")
      return { success: false, error: "Email service not configured" }
    }

    const firstName = safeCapitalize(params.firstName)
    const lastName = safeCapitalize(params.lastName)
    const role = safeCapitalize(params.role)

    const { data, error } = await resend.emails.send({
      from: "IV Relife <noreply@updates.iv-relife.com>",
      to: params.to,
      subject: `Welcome to IV Relife - Complete Your ${role} Account Setup`,
      html: getEmailTemplate(params),
    })

    if (error) {
      console.error("[v0] Resend API error:", error)
      return { success: false, error: error.message || "Failed to send email" }
    }

    console.log("[v0] Email sent successfully:", data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error("[v0] Email sending error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<EmailResult> {
  try {
    console.log("[v0] Sending password reset email to:", params.to)
    console.log("[v0] Reset params:", {
      firstName: params.firstName,
      lastName: params.lastName,
      role: params.role,
      businessName: params.businessName,
      resetUrl: params.resetUrl,
    })

    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY not found")
      return { success: false, error: "Email service not configured" }
    }

    const firstName = safeCapitalize(params.firstName)
    const lastName = safeCapitalize(params.lastName)
    const role = safeCapitalize(params.role)

    const { data, error } = await resend.emails.send({
      from: "IV Relife <noreply@updates.iv-relife.com>",
      to: params.to,
      subject: `Complete Your ${role} Account Setup - IV Relife`,
      html: getPasswordResetTemplate(params),
    })

    if (error) {
      console.error("[v0] Resend API error:", error)
      return { success: false, error: error.message || "Failed to send email" }
    }

    console.log("[v0] Password reset email sent successfully:", data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error("[v0] Password reset email error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
