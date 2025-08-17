import { EmailTemplateBase } from "./email-template-base"

interface PasswordResetEmailProps {
  userName: string
  resetUrl: string
  expiresIn: string
}

export function PasswordResetEmail({ userName, resetUrl, expiresIn }: PasswordResetEmailProps) {
  return (
    <EmailTemplateBase title="Reset Your Password" previewText="Reset your password to regain access to your account.">
      <div>
        <h2 style={{ color: "#1f2937", fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>
          Reset Your Password
        </h2>

        <p style={{ color: "#4b5563", fontSize: "16px", lineHeight: "1.6", marginBottom: "16px" }}>Hi {userName},</p>

        <p style={{ color: "#4b5563", fontSize: "16px", lineHeight: "1.6", marginBottom: "24px" }}>
          We received a request to reset your password. If you made this request, click the button below to create a new
          password.
        </p>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <a
            href={resetUrl}
            style={{
              display: "inline-block",
              backgroundColor: "#f59e0b",
              color: "#ffffff",
              padding: "12px 32px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            Reset Password
          </a>
        </div>

        <div
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "6px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <p style={{ color: "#92400e", fontSize: "14px", margin: 0, fontWeight: "600" }}>
            ⚠️ This link will expire in {expiresIn}
          </p>
        </div>

        <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5", marginBottom: "16px" }}>
          If the button doesn't work, copy and paste this link into your browser:
        </p>

        <p
          style={{
            color: "#164e63",
            fontSize: "14px",
            wordBreak: "break-all",
            backgroundColor: "#f1f5f9",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "24px",
          }}
        >
          {resetUrl}
        </p>

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "24px" }}>
          <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5", marginBottom: "12px" }}>
            <strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this
            email. Your password will remain unchanged.
          </p>
          <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
            For security reasons, this link will only work once and will expire automatically.
          </p>
        </div>
      </div>
    </EmailTemplateBase>
  )
}
