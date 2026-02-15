// Client-side form validation utilities
// All validators return null if valid, or an error message string if invalid.
// Used by LoginPage, SignupPage, ProfilePage, and AdminDashboard.

// Gamertag must contain at least one letter AND at least one number
export function validateGamertag(tag: string): string | null {
  if (!tag.trim()) {
    return "Gamertag is required.";
  }

  const hasLetter = /[a-zA-Z]/.test(tag);
  const hasNumber = /[0-9]/.test(tag);

  if (!hasLetter || !hasNumber) {
    return "Gamertag must contain both letters and numbers.";
  }

  if (tag.length < 3) {
    return "Gamertag must be at least 3 characters.";
  }

  if (tag.length > 20) {
    return "Gamertag must be 20 characters or less.";
  }

  return null;
}

// Basic email format validation
export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return "Email is required.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address.";
  }

  return null;
}

// Password must contain at least one uppercase letter, one lowercase letter,
// one number, and be at least 8 characters long
export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUppercase) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!hasLowercase) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!hasNumber) {
    return "Password must contain at least one number.";
  }

  return null;
}

// Returns a score from 0–4 for the password strength meter on the signup page
// Scoring: +1 for 8+ chars, +1 for 12+ chars, +1 for mixed case,
//          +1 for a number, +1 for a special character (capped at 4)
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Cap at 4
  score = Math.min(score, 4);

  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-400",
    "bg-green-500",
  ];

  return {
    score,
    label: labels[score],
    color: colors[score],
  };
}
