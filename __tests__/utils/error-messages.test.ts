import { ErrorMessageHandler } from "@/lib/utils/error-messages"

describe("ErrorMessageHandler", () => {
  describe("getErrorMessage", () => {
    it("should return specific message for expired invitation", () => {
      const error = "Invalid or expired invitation"
      const message = ErrorMessageHandler.getErrorMessage(error, { type: "invitation" })

      expect(message).toBe(
        "This invitation link has expired or is no longer valid. Please contact your administrator for a new invitation.",
      )
    })

    it("should return specific message for existing user", () => {
      const error = "User with this email address has already been registered"
      const message = ErrorMessageHandler.getErrorMessage(error)

      expect(message).toBe(
        "An account with this email already exists. Try signing in instead, or contact support if you need help accessing your account.",
      )
    })

    it("should return specific message for network errors", () => {
      const error = "Failed to connect to server"
      const message = ErrorMessageHandler.getErrorMessage(error)

      expect(message).toBe("Unable to connect to the server. Please check your internet connection and try again.")
    })

    it("should return context-specific fallback for invitation type", () => {
      const error = "Unknown error"
      const message = ErrorMessageHandler.getErrorMessage(error, { type: "invitation" })

      expect(message).toBe(
        "There was a problem with your invitation. Please contact your administrator for assistance.",
      )
    })

    it("should return generic fallback for unknown errors", () => {
      const error = "Some random error"
      const message = ErrorMessageHandler.getErrorMessage(error)

      expect(message).toBe("Something went wrong. Please try again or contact support if the problem persists.")
    })
  })

  describe("getRecoveryActions", () => {
    it("should return appropriate actions for expired invitation", () => {
      const error = "Invalid or expired invitation"
      const actions = ErrorMessageHandler.getRecoveryActions(error, { type: "invitation" })

      expect(actions).toEqual([
        { label: "Request New Invitation", action: "request_invitation", primary: true },
        { label: "Contact Support", action: "contact_support" },
      ])
    })

    it("should return appropriate actions for existing user", () => {
      const error = "already been registered"
      const actions = ErrorMessageHandler.getRecoveryActions(error)

      expect(actions).toEqual([
        { label: "Sign In Instead", action: "sign_in", primary: true },
        { label: "Reset Password", action: "reset_password" },
        { label: "Contact Support", action: "contact_support" },
      ])
    })

    it("should return retry actions for network errors", () => {
      const error = "Network error"
      const actions = ErrorMessageHandler.getRecoveryActions(error)

      expect(actions).toEqual([
        { label: "Try Again", action: "retry", primary: true },
        { label: "Check Connection", action: "check_connection" },
      ])
    })

    it("should return context-specific actions for invitation type", () => {
      const error = "Unknown error"
      const actions = ErrorMessageHandler.getRecoveryActions(error, { type: "invitation" })

      expect(actions).toEqual([
        { label: "Request New Invitation", action: "request_invitation", primary: true },
        { label: "Contact Administrator", action: "contact_admin" },
      ])
    })
  })
})
