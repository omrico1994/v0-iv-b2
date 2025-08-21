import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvitationEmailParams {
  email: string
  role: "admin" | "office" | "retailer" | "location"
  invitationToken: string
  invitedBy: string
  retailerName?: string
}

interface SendPasswordResetEmailParams {
  to: string
  resetUrl: string
  userName: string
}

interface EmailResult {
  success: boolean
  emailId?: string
  error?: string
}

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  try {
    console.log("[v0] Sending invitation email to:", params.email)

    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY not configured")
      return { success: false, error: "Email service not configured" }
    }

    const setupUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/setup-account?token=${params.invitationToken}&email=${encodeURIComponent(params.email)}&type=invitation`

    const roleDisplayName = {
      admin: "Administrator",
      office: "Office Staff",
      retailer: "Retailer",
      location: "Location Staff",
    }[params.role]

    const emailTemplate = getInvitationEmailTemplate({
      role: params.role,
      roleDisplayName,
      invitedBy: params.invitedBy,
      retailerName: params.retailerName,
      setupUrl,
    })

    const { data, error } = await resend.emails.send({
      from: "IV Relife <noreply@iv-relife.com>",
      to: [params.email],
      subject: `Welcome to IV Relife - Complete Your ${roleDisplayName} Account Setup`,
      html: emailTemplate,
    })

    if (error) {
      console.error("[v0] Resend error:", error)
      return { success: false, error: error.message || "Failed to send email" }
    }

    console.log("[v0] Email sent successfully:", data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error("[v0] Error sending invitation email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<EmailResult> {
  try {
    console.log("[v0] Sending password reset email to:", params.to)

    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY not configured")
      return { success: false, error: "Email service not configured" }
    }

    const emailTemplate = getPasswordResetEmailTemplate({
      userName: params.userName,
      resetUrl: params.resetUrl,
    })

    const { data, error } = await resend.emails.send({
      from: "IV Relife <noreply@iv-relife.com>",
      to: [params.to],
      subject: "Complete Your Account Setup - IV Relife",
      html: emailTemplate,
    })

    if (error) {
      console.error("[v0] Resend error:", error)
      return { success: false, error: error.message || "Failed to send email" }
    }

    console.log("[v0] Password reset email sent successfully:", data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error("[v0] Error sending password reset email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

function getInvitationEmailTemplate({
  role,
  roleDisplayName,
  invitedBy,
  retailerName,
  setupUrl,
}: {
  role: string
  roleDisplayName: string
  invitedBy: string
  retailerName?: string
  setupUrl: string
}) {
  const roleColors = {
    admin: "#dc2626", // red-600
    office: "#2563eb", // blue-600
    retailer: "#059669", // emerald-600
    location: "#7c3aed", // violet-600
  }

  const roleColor = roleColors[role as keyof typeof roleColors] || "#6b7280"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to IV Relife</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 8px;">Welcome to IV Relife</h1>
        <div style="width: 60px; height: 4px; background: ${roleColor}; margin: 0 auto; border-radius: 2px;"></div>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 12px; border-left: 4px solid ${roleColor}; margin-bottom: 30px;">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">You've been invited as ${roleDisplayName}</h2>
        <p style="margin-bottom: 0; color: #6b7280;">
          ${invitedBy} has invited you to join IV Relife${retailerName ? ` for ${retailerName}` : ""}.
        </p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; font-size: 18px;">Complete Your Account Setup</h3>
        <p>To get started, please click the button below to set your password and complete your profile:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupUrl}" 
             style="display: inline-block; background: ${roleColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Complete Account Setup
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${setupUrl}" style="color: ${roleColor}; word-break: break-all;">${setupUrl}</a>
        </p>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280;">
        <p><strong>What's next?</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Set your secure password</li>
          <li>Complete your profile information</li>
          <li>Access your ${roleDisplayName.toLowerCase()} dashboard</li>
        </ul>
        
        <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">
          This invitation was sent by ${invitedBy}. If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `
}

function getPasswordResetEmailTemplate({
  userName,
  resetUrl,
}: {
  userName: string
  resetUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Complete Your Account Setup</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 8px;">Complete Your Account Setup</h1>
        <div style="width: 60px; height: 4px; background: #2563eb; margin: 0 auto; border-radius: 2px;"></div>
      </div>

      <div style="background: #f0f9ff; padding: 30px; border-radius: 12px; border-left: 4px solid #2563eb; margin-bottom: 30px;">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Hello ${userName}</h2>
        <p style="margin-bottom: 0; color: #6b7280;">
          Please complete your account setup by setting your password.
        </p>
      </div>

      <div style="margin-bottom: 30px;">
        <p>Click the button below to set your password and access your account:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Set Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af;">
        <p>This link will expire in 24 hours for security reasons. If you didn't request this, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `
}
