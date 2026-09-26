export function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes("invalid login credentials")) {
    return "The email or password is incorrect. Please try again."
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email address before signing in."
  }

  if (normalized.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead."
  }

  if (normalized.includes("password should be")) {
    return "Use a stronger password with at least 8 characters."
  }

  if (normalized.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again."
  }

  if (normalized.includes("auth session missing")) {
    return "This reset link is invalid or expired. Request a new password reset link."
  }

  return "Something went wrong. Please try again."
}
