// Signup page with gamertag, email, password validation, avatar picker, and password strength meter

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import AvatarPicker, { DEFAULT_AVATAR } from "../components/AvatarPicker";
import {
  validateGamertag,
  validateEmail,
  validatePassword,
  getPasswordStrength,
} from "../utils/validation";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength meter values
  const strength = getPasswordStrength(password);

  // Removes the error for a specific field when the user starts typing
  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // Checks if the gamertag is already taken by another user
  async function isGamertagTaken(tag: string): Promise<boolean> {
    const q = query(
      collection(db, "users"),
      where("displayName", "==", tag.trim())
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Validate all fields before submitting
    const newErrors: Record<string, string> = {};

    const gamertagError = validateGamertag(displayName);
    if (gamertagError) newErrors.displayName = gamertagError;

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      // Check gamertag uniqueness before creating the account
      const taken = await isGamertagTaken(displayName);
      if (taken) {
        setErrors({ displayName: "Gamertag is already in use." });
        setSubmitting(false);
        return;
      }

      await signup(email, password, displayName.trim(), avatarUrl);
      navigate("/");
    } catch {
      // Error toast is handled inside AuthContext.signup()
    } finally {
      setSubmitting(false);
    }
  }

  // Input styling that changes to red border on error
  const inputBase =
    "w-full rounded-lg border bg-gray-900 px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2";
  const inputNormal = `${inputBase} border-gray-700 focus:border-red-500 focus:ring-red-500/50`;
  const inputError = `${inputBase} border-red-500 focus:border-red-500 focus:ring-red-500/50`;

  return (
    <main className="min-h-screen flex flex-col bg-black px-4 sm:px-6 lg:px-8">
      {/* Branding pinned to the top */}
      <div className="flex flex-col items-center gap-3 pt-12 sm:pt-16">
        <img src="/favicon.png" alt="" className="h-20 w-20 sm:h-24 sm:w-24" />
        <h1
          className="text-5xl sm:text-6xl font-black text-white uppercase tracking-widest"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          READY<span className="text-red-500">UP</span>
        </h1>
        <p className="text-base sm:text-lg font-bold uppercase tracking-[0.3em] text-gray-300">
          Compete. Win. Get Paid.
        </p>
      </div>

      {/* Form centred in remaining space */}
      <div className="flex-1 flex items-start justify-center pt-8 sm:pt-12">
        <div className="w-full max-w-sm sm:max-w-md space-y-6">
          <p className="text-center text-sm text-gray-500">
            Create your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Avatar picker */}
            <AvatarPicker value={avatarUrl} onChange={setAvatarUrl} />

            {/* Gamertag */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Gamertag
              </label>
              <input
                id="displayName"
                type="text"
                required
                autoComplete="username"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  clearError("displayName");
                }}
                className={errors.displayName ? inputError : inputNormal}
                placeholder="e.g. Player1X"
                aria-invalid={!!errors.displayName}
                aria-describedby={errors.displayName ? "displayName-error" : undefined}
              />
              {errors.displayName && (
                <p id="displayName-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.displayName}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-600">Must contain both letters and numbers</p>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                className={errors.email ? inputError : inputNormal}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
                }}
                className={errors.password ? inputError : inputNormal}
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : "password-strength"}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.password}
                </p>
              )}

              {/* Password strength meter */}
              {password.length > 0 && (
                <div id="password-strength" className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < strength.score ? strength.color : "bg-gray-800"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{strength.label}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              aria-label="Create your account"
              className="w-full rounded-lg bg-red-500 py-3 text-base font-semibold text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-red-400 hover:underline focus:outline-none focus:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
