import type React from "react"
interface EmailTemplateBaseProps {
  children: React.ReactNode
  title: string
  previewText?: string
}

export function EmailTemplateBase({ children, title, previewText }: EmailTemplateBaseProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {previewText && (
          <div
            style={{ display: "none", overflow: "hidden", lineHeight: "1px", opacity: 0, maxHeight: 0, maxWidth: 0 }}
          >
            {previewText}
          </div>
        )}
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f8fafc", fontFamily: "Arial, sans-serif" }}>
        <table
          role="presentation"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#f8fafc",
            padding: "40px 0",
          }}
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                style={{
                  width: "600px",
                  maxWidth: "100%",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <tr>
                  <td style={{ backgroundColor: "#164e63", padding: "32px", textAlign: "center" }}>
                    <h1 style={{ color: "#ffffff", fontSize: "24px", fontWeight: "bold", margin: 0 }}>Your App</h1>
                  </td>
                </tr>
                {/* Content */}
                <tr>
                  <td style={{ padding: "32px" }}>{children}</td>
                </tr>
                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: "#f1f5f9", padding: "24px", textAlign: "center" }}>
                    <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                      © 2024 Your App. All rights reserved.
                    </p>
                    <p style={{ color: "#64748b", fontSize: "12px", margin: "8px 0 0 0" }}>
                      If you didn't request this email, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
