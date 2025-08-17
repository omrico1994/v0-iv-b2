import { EmailTemplateBase } from "./email-template-base"

interface SecurityAlertEmailProps {
  userName: string
  alertType: "login" | "password_change" | "suspicious_activity"
  details: {
    timestamp: string
    location?: string
    device?: string
    ipAddress?: string
  }
}

export function SecurityAlertEmail({ userName, alertType, details }: SecurityAlertEmailProps) {
  const getAlertTitle = () => {
    switch (alertType) {
      case "login":
        return "New Login to Your Account"
      case "password_change":
        return "Password Changed Successfully"
      case "suspicious_activity":
        return "Suspicious Activity Detected"
      default:
        return "Security Alert"
    }
  }

  const getAlertMessage = () => {
    switch (alertType) {
      case "login":
        return "We detected a new login to your account from a device or location we haven't seen before."
      case "password_change":
        return "Your account password was successfully changed."
      case "suspicious_activity":
        return "We detected unusual activity on your account that may require your attention."
      default:
        return "We're notifying you about recent activity on your account."
    }
  }

  const getAlertColor = () => {
    switch (alertType) {
      case "login":
        return "#3b82f6"
      case "password_change":
        return "#10b981"
      case "suspicious_activity":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  return (
    <EmailTemplateBase title={getAlertTitle()} previewText={`Security alert for your account - ${getAlertTitle()}`}>
      <div>
        <div
          style={{
            backgroundColor: getAlertColor(),
            color: "#ffffff",
            padding: "16px",
            borderRadius: "6px",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>🔒 {getAlertTitle()}</h2>
        </div>

        <p style={{ color: "#4b5563", fontSize: "16px", lineHeight: "1.6", marginBottom: "16px" }}>Hi {userName},</p>

        <p style={{ color: "#4b5563", fontSize: "16px", lineHeight: "1.6", marginBottom: "24px" }}>
          {getAlertMessage()}
        </p>

        <div
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ color: "#1f2937", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
            Activity Details:
          </h3>
          <table style={{ width: "100%", fontSize: "14px", color: "#4b5563" }}>
            <tr>
              <td style={{ padding: "4px 0", fontWeight: "600" }}>Time:</td>
              <td style={{ padding: "4px 0" }}>{details.timestamp}</td>
            </tr>
            {details.location && (
              <tr>
                <td style={{ padding: "4px 0", fontWeight: "600" }}>Location:</td>
                <td style={{ padding: "4px 0" }}>{details.location}</td>
              </tr>
            )}
            {details.device && (
              <tr>
                <td style={{ padding: "4px 0", fontWeight: "600" }}>Device:</td>
                <td style={{ padding: "4px 0" }}>{details.device}</td>
              </tr>
            )}
            {details.ipAddress && (
              <tr>
                <td style={{ padding: "4px 0", fontWeight: "600" }}>IP Address:</td>
                <td style={{ padding: "4px 0" }}>{details.ipAddress}</td>
              </tr>
            )}
          </table>
        </div>

        {alertType === "suspicious_activity" && (
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <a
              href="#"
              style={{
                display: "inline-block",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                padding: "12px 32px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "16px",
                marginRight: "12px",
              }}
            >
              Secure My Account
            </a>
            <a
              href="#"
              style={{
                display: "inline-block",
                backgroundColor: "#6b7280",
                color: "#ffffff",
                padding: "12px 32px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              This Was Me
            </a>
          </div>
        )}

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "24px" }}>
          <h3 style={{ color: "#1f2937", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
            Security Tips:
          </h3>
          <ul style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.6", paddingLeft: "20px" }}>
            <li style={{ marginBottom: "8px" }}>Use a strong, unique password</li>
            <li style={{ marginBottom: "8px" }}>Enable two-factor authentication</li>
            <li style={{ marginBottom: "8px" }}>Keep your account information up to date</li>
            <li style={{ marginBottom: "8px" }}>Log out from shared or public devices</li>
          </ul>
        </div>
      </div>
    </EmailTemplateBase>
  )
}
