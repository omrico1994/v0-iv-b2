export interface ErrorContext {
  type: "invitation" | "password_reset" | "authentication" | "validation"
  action?: string
  details?: any
}

export class ErrorMessageHandler {
  static getErrorMessage(error: string | Error, context?: ErrorContext): string {
    const errorMessage = typeof error === "string" ? error : error.message

    // Handle specific error patterns with user-friendly messages
    if (errorMessage.includes("Invalid or expired invitation")) {
      return "This invitation link has expired or is no longer valid. Please contact your administrator for a new invitation."
    }

    if (errorMessage.includes("User with this email address has already been registered")) {
      return "An account with this email already exists. Try signing in instead, or contact support if you need help accessing your account."
    }

    if (errorMessage.includes("Token and email are required")) {
      return "The invitation link appears to be incomplete. Please use the full link from your email or request a new invitation."
    }

    if (errorMessage.includes("Invitation has expired")) {
      return "This invitation has expired. Invitations are valid for 24 hours. Please request a new invitation from your administrator."
    }

    if (errorMessage.includes("Failed to connect to server") || errorMessage.includes("Network error")) {
      return "Unable to connect to the server. Please check your internet connection and try again."
    }

    if (errorMessage.includes("Missing required fields")) {
      return "Please fill in all required fields to continue."
    }

    if (errorMessage.includes("Passwords do not match")) {
      return "The passwords you entered do not match. Please make sure both password fields are identical."
    }

    if (errorMessage.includes("Password must be at least")) {
      return "Your password must be at least 8 characters long and include a mix of letters, numbers, and symbols for security."
    }

    if (errorMessage.includes("otp_expired") || errorMessage.includes("expired")) {
      return "This link has expired for security reasons. Please request a new password reset link."
    }

    if (errorMessage.includes("Invalid login credentials")) {
      return "The email or password you entered is incorrect. Please check your credentials and try again."
    }

    if (errorMessage.includes("Email not confirmed")) {
      return "Please check your email and click the confirmation link before signing in."
    }

    if (errorMessage.includes("Too many requests")) {
      return "Too many attempts. Please wait a few minutes before trying again."
    }

    // Context-specific fallbacks
    if (context?.type === "invitation") {
      return "There was a problem with your invitation. Please contact your administrator for assistance."
    }

    if (context?.type === "password_reset") {
      return "Unable to reset your password. Please try requesting a new reset link."
    }

    if (context?.type === "authentication") {
      return "Authentication failed. Please try signing in again."
    }

    if (context?.type === "validation") {
      return "Please check your information and try again."
    }

    // Generic fallback
    return "Something went wrong. Please try again or contact support if the problem persists."
  }

  static getRecoveryActions(
    error: string | Error,
    context?: ErrorContext,
  ): Array<{
    label: string
    action: string
    primary?: boolean
  }> {
    const errorMessage = typeof error === "string" ? error : error.message

    if (errorMessage.includes("expired") || errorMessage.includes("Invalid or expired invitation")) {
      return [
        { label: "Request New Invitation", action: "request_invitation", primary: true },
        { label: "Contact Support", action: "contact_support" },
      ]
    }

    if (errorMessage.includes("already been registered")) {
      return [
        { label: "Sign In Instead", action: "sign_in", primary: true },
        { label: "Reset Password", action: "reset_password" },
        { label: "Contact Support", action: "contact_support" },
      ]
    }

    if (errorMessage.includes("Network error") || errorMessage.includes("connect to server")) {
      return [
        { label: "Try Again", action: "retry", primary: true },
        { label: "Check Connection", action: "check_connection" },
      ]
    }

    if (context?.type === "invitation") {
      return [
        { label: "Request New Invitation", action: "request_invitation", primary: true },
        { label: "Contact Administrator", action: "contact_admin" },
      ]
    }

    return [
      { label: "Try Again", action: "retry", primary: true },
      { label: "Contact Support", action: "contact_support" },
    ]
  }
}
