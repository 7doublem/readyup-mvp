// Maps raw Firebase Auth error codes to user-friendly messages
// Firebase throws errors with codes like "auth/email-already-in-use"
// which are not helpful to show directly to users
const errorMessages: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password must be at least 8 characters with uppercase, lowercase, and a number.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
  "auth/operation-not-allowed": "This sign-in method is not enabled.",
};

// Extracts the error code from a Firebase error and returns a friendly message
// Falls back to a generic message if the code isn't in our map
export function getAuthErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const code = (error as { code: string }).code;
    return errorMessages[code] || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
