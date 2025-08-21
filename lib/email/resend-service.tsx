import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvitationEmailParams {
  email: string
  role: string
  invitationToken: string
  retailerName?: string
  locationName?: string
}

interface EmailResult {
  success: boolean
  emailId?: string
  error?: string
}

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  console.log("[v0] Resend service - sendInvitationEmail called with:", {
    email: params.email,
    role: params.role,
    hasToken: !!params.invitationToken,
    retailerName: params.retailerName,
    locationName: params.locationName,
  })

  console.log("[v0] Resend API Key exists:", !!process.env.RESEND_API_KEY)
  console.log("[v0] Resend API Key length:", process.env.RESEND_API_KEY?.length || 0)

  try {
    const setupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://app.iv-relife.com"}/auth/setup-account?token=${params.invitationToken}`

    console.log("[v0] Setup URL generated:", setupUrl)

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
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to IV-Relife</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You've been invited as a ${params.role}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Account Details</h2>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Email:</strong> ${params.email}</p>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Role:</strong> ${params.role.charAt(0).toUpperCase() + params.role.slice(1)}</p>
            ${params.retailerName ? `<p style="margin: 8px 0; color: #4b5563;"><strong>Retailer:</strong> ${params.retailerName}</p>` : ""}
            ${params.locationName ? `<p style="margin: 8px 0; color: #4b5563;"><strong>Location:</strong> ${params.locationName}</p>` : ""}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" style="background: ${roleColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">Complete Account Setup</a>
          </div>

          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Important:</strong> This invitation link will expire in 24 hours. Please complete your account setup as soon as possible.</p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">If you didn't expect this invitation, please ignore this email.</p>
            <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">© 2024 IV-Relife. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    console.log("[v0] About to send email via Resend...")

    const result = await resend.emails.send({
      from: "IV-Relife <noreply@iv-relife.com>",
      to: [params.email],
      subject: `Welcome to IV-Relife - Complete Your ${params.role} Account Setup`,
      html: emailHtml,
    })

    console.log("[v0] Resend API response:", result)

    if (result.error) {
      console.error("[v0] Resend API error:", result.error)
      return {
        success: false,
        error: result.error.message || "Failed to send email",
      }
    }

    console.log("[v0] Email sent successfully, ID:", result.data?.id)

    return {
      success: true,
      emailId: result.data?.id,
    }
  } catch (error) {
    console.error("[v0] Resend service error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function sendPasswordResetEmail(email: string): Promise<EmailResult> {
  console.log("[v0] Resend service - sendPasswordResetEmail called for:", email)

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://app.iv-relife.com"}/auth/setup-account`,
    })

    if (error) {
      console.error("[v0] Supabase password reset error:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    console.log("[v0] Password reset email sent successfully")
    return {
      success: true,
    }
  } catch (error) {
    console.error("[v0] Password reset error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
