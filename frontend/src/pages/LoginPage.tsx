// Login page with inline email/password validation and forgot password flow

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateEmail } from "../utils/validation";

export default function LoginPage() {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Removes the error for a specific field when the user starts typing
  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Validate before submitting
    const newErrors: Record<string, string> = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    if (!password) newErrors.password = "Password is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      await login(email, password);
      navigate("/");
    } catch {
      // Error toast is handled inside AuthContext.login()
    } finally {
      setSubmitting(false);
    }
  }

  // Validates email before sending a password reset link
  async function handleForgotPassword() {
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      document.getElementById("email")?.focus();
      return;
    }

    setResetting(true);
    setErrors({});
    try {
      await resetPassword(email);
    } catch {
      // Error toast handled by AuthContext
    } finally {
      setResetting(false);
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
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
                }}
                className={errors.password ? inputError : inputNormal}
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={resetting}
                onClick={handleForgotPassword}
                className="text-xs text-gray-500 hover:text-red-400 transition focus:outline-none focus:underline"
                aria-label="Reset your password"
              >
                {resetting ? "Sending..." : "Forgot password?"}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              aria-label="Sign in to your account"
              className="w-full rounded-lg bg-red-500 py-3 text-base font-semibold text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-red-400 hover:underline focus:outline-none focus:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
