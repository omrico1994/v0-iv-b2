import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailResult {
  success: boolean
  emailId?: string
  error?: string
}

interface SendInvitationEmailParams {
  email: string
  firstName: string
  lastName: string
  role: string
  businessName?: string
  invitationToken: string
}

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  console.log("[v0] Resend: Starting invitation email send")
  console.log("[v0] Resend: API Key exists:", !!process.env.RESEND_API_KEY)
  console.log("[v0] Resend: Email params:", {
    email: params.email,
    role: params.role,
    businessName: params.businessName,
  })

  try {
    const setupUrl = `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "https://app.iv-relife.com"}/auth/setup-account?token=${params.invitationToken}&type=invitation`

    const roleColors = {
      admin: "#dc2626",
      office: "#2563eb",
      retailer: "#059669",
      location: "#7c3aed",
    }

    const roleColor = roleColors[params.role as keyof typeof roleColors] || "#6b7280"

    const { data, error } = await resend.emails.send({
      from: "IV Relife <noreply@iv-relife.com>",
      to: [params.email],
      subject: `Welcome to IV Relife - Complete Your ${params.role} Account Setup`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Account Setup</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${roleColor} 0%, ${roleColor}dd 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to IV Relife</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You've been invited as a ${params.role}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Account Details</h2>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Name:</strong> ${params.firstName} ${params.lastName}</p>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Email:</strong> ${params.email}</p>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Role:</strong> ${params.role}</p>
            ${params.businessName ? `<p style="margin: 8px 0; color: #4b5563;"><strong>Business:</strong> ${params.businessName}</p>` : ""}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" style="background: ${roleColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">Complete Account Setup</a>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Important:</strong> This invitation link will expire in 7 days. Please complete your setup as soon as possible.</p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
            <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">© 2024 IV Relife. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    })

    console.log("[v0] Resend: Email send result:", { data, error })

    if (error) {
      console.error("[v0] Resend: Email send error:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Resend: Email sent successfully, ID:", data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error("[v0] Resend: Exception during email send:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function sendPasswordResetEmail(email: string, firstName: string, lastName: string): Promise<EmailResult> {
  console.log("[v0] Resend: Starting password reset email send")
  console.log("[v0] Resend: Email:", email)

  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "https://app.iv-relife.com"}/auth/setup-account?type=recovery`

    const { data, error } = await resend.emails.send({
      from: "IV Relife <noreply@iv-relife.com>",
      to: [email],
      subject: "Complete Your Account Setup - IV Relife",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Account Setup</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Complete Your Setup</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Set your password to access your account</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Hello ${firstName} ${lastName},</h2>
            <p style="color: #4b5563; margin: 0;">You need to complete your account setup to access the IV Relife system. Click the button below to set your password and get started.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">Set Your Password</a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">© 2024 IV Relife. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    })

    console.log("[v0] Resend: Password reset email result:", { data, error })

    if (error) {
      console.error("[v0] Resend: Password reset email error:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Resend: Password reset email sent successfully, ID:", data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error("[v0] Resend: Exception during password reset email send:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
