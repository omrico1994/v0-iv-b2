import { EmailTemplateBase } from "./email-template-base"

interface WelcomeEmailProps {
  userName: string
  verificationUrl: string
}

export function WelcomeEmail({ userName, verificationUrl }: WelcomeEmailProps) {
  return (
    <EmailTemplateBase
      title="Welcome to Your App"
      previewText="Welcome! Please verify your email address to get started."
    >
      <div>
        <h2 style={{ color: "#1f2937", fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>
          Welcome to Your App, {userName}!
        </h2>

        <p style={{ color: "#4b5563", fontSize: "16px", lineHeight: "1.6", marginBottom: "24px" }}>
          Thank you for creating an account with us. To get started, please verify your email address by clicking the
          button below.
        </p>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <a
            href={verificationUrl}
            style={{
              display: "inline-block",
              backgroundColor: "#164e63",
              color: "#ffffff",
              padding: "12px 32px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            Verify Email Address
          </a>
        </div>

        <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5", marginBottom: "16px" }}>
          If the button doesn't work, you can copy and paste this link into your browser:
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
          {verificationUrl}
        </p>

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "24px" }}>
          <h3 style={{ color: "#1f2937", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>What's next?</h3>
          <ul style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.6", paddingLeft: "20px" }}>
            <li style={{ marginBottom: "8px" }}>Complete your profile setup</li>
            <li style={{ marginBottom: "8px" }}>Explore our features and tools</li>
            <li style={{ marginBottom: "8px" }}>Join our community</li>
          </ul>
        </div>
      </div>
    </EmailTemplateBase>
  )
}
