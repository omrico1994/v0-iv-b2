import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendInvitationEmailParams {
  email: string
  role: string
  invitationToken: string
  invitedBy: string
  retailerName?: string
}

export interface EmailResult {
  success: boolean
  emailId?: string
  error?: string
}

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  try {
    console.log("[v0] Sending invitation email to:", params.email)
    console.log("[v0] Using API key:", process.env.RESEND_API_KEY ? "Present" : "Missing")

    const fromEmail = "noreply@iv-relife.com" // Change this to your verified domain

    const setupUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/setup-account?token=${params.invitationToken}`

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.email,
      subject: `Welcome to IV Relife - Complete Your Account Setup`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to IV Relife</h2>
          <p>Hello,</p>
          <p>You've been invited to join IV Relife as a <strong>${params.role}</strong> by ${params.invitedBy}.</p>
          ${params.retailerName ? `<p>You'll be working with <strong>${params.retailerName}</strong>.</p>` : ""}
          <p>Click the button below to complete your account setup:</p>
          <a href="${setupUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Complete Setup</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${setupUrl}</p>
          <p>This invitation will expire in 7 days.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    })

    if (error) {
      console.error("[v0] Resend API error:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Email sent successfully, ID:", data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error("[v0] Error sending invitation email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName,
}: { to: string; resetUrl: string; userName: string }): Promise<EmailResult> {
  try {
    console.log("[v0] Sending password reset email to:", to)
    console.log("[v0] Using API key:", process.env.RESEND_API_KEY ? "Present" : "Missing")

    const fromEmail = "noreply@iv-relife.com" // Change this to your verified domain

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: "Complete Your IV Relife Account Setup",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Complete Your Account Setup</h2>
          <p>Hello ${userName},</p>
          <p>Click the button below to complete your account setup and create your password:</p>
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Setup Account</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    if (error) {
      console.error("[v0] Resend API error:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Password reset email sent successfully, ID:", data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error("[v0] Error sending password reset email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
