// Staff-only dashboard for creating events and promoting users to staff
// All form fields are validated client-side with inline error messages

import { useState, useEffect, useRef, type FormEvent } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { searchGame, type RawgGame } from "../lib/rawg";
import { validateEmail } from "../utils/validation";
import toast from "react-hot-toast";

// Default form values so we can reset after successful creation
const initialForm = {
  title: "",
  game: "",
  date: "",
  location: "",
  prizePool: 0,
  entryFee: 0,
  maxParticipants: 20,
  description: "",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // RAWG game preview shown when staff types a game name
  const [gamePreview, setGamePreview] = useState<RawgGame | null>(null);
  const [gameSearching, setGameSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced RAWG search: triggers 500ms after the user stops typing in the game field
  useEffect(() => {
    if (!form.game.trim()) {
      setGamePreview(null);
      return;
    }

    setGameSearching(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const result = await searchGame(form.game);
      setGamePreview(result);
      setGameSearching(false);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.game]);

  // Staff management state
  const [staffEmail, setStaffEmail] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [staffError, setStaffError] = useState("");

  // Validates all event creation fields, returns an errors object
  function validateEventForm(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (!form.title.trim()) errs.title = "Event title is required.";
    if (!form.game.trim()) errs.game = "Game name is required.";
    if (!form.date) {
      errs.date = "Date and time is required.";
    } else if (new Date(form.date) <= new Date()) {
      errs.date = "Date must be in the future.";
    }
    if (!form.location.trim()) errs.location = "Location is required.";
    if (form.prizePool < 0) errs.prizePool = "Prize pool cannot be negative.";
    if (form.entryFee < 0) errs.entryFee = "Entry fee cannot be negative.";
    if (form.maxParticipants < 2) errs.maxParticipants = "Must allow at least 2 participants.";
    if (form.maxParticipants > 1000) errs.maxParticipants = "Maximum 1000 participants.";
    if (!form.description.trim()) errs.description = "Description is required.";

    return errs;
  }

  // Finds a user by email and promotes them to staff
  async function handlePromote(e: FormEvent) {
    e.preventDefault();
    setStaffError("");

    // Validate the email field
    const emailError = validateEmail(staffEmail);
    if (emailError) {
      setStaffError(emailError);
      return;
    }

    setPromoting(true);
    try {
      // Look up the user document by email
      const q = query(
        collection(db, "users"),
        where("email", "==", staffEmail.trim().toLowerCase()),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setStaffError("No registered user found with that email.");
        setPromoting(false);
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      if (userData.role === "staff") {
        setStaffError("That user is already staff.");
        setPromoting(false);
        return;
      }

      // Update their role to staff
      await updateDoc(doc(db, "users", userDoc.id), { role: "staff" });
      toast.success(`${staffEmail} has been promoted to staff!`);
      setStaffEmail("");
      setStaffError("");
    } catch {
      toast.error("Failed to promote user. Check permissions.");
    } finally {
      setPromoting(false);
    }
  }

  // Updates a single field in the form state and clears its error
  function updateField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    // Validate all fields before submitting
    const errs = validateEventForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      // Scroll to the first error
      const firstErrorField = Object.keys(errs)[0];
      document.getElementById(firstErrorField)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      // Write the event to Firestore with auto-filled fields
      await addDoc(collection(db, "events"), {
        title: form.title,
        game: form.game,
        date: new Date(form.date),
        location: form.location,
        prizePool: form.prizePool,
        entryFee: form.entryFee,
        maxParticipants: form.maxParticipants,
        description: form.description,
        createdBy: user.uid,
        attendees: [],
        status: "upcoming",
        createdAt: serverTimestamp(),
      });

      toast.success("Tournament Created!");
      setForm(initialForm);
    } catch (error) {
      // Firestore permission errors have code "permission-denied"
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "permission-denied"
      ) {
        toast.error("Access Denied: You do not have Staff permissions.");
      } else {
        toast.error("Failed to create event. Please try again.");
      }
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
    <main className="min-h-screen bg-black px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1
          className="text-2xl sm:text-3xl font-black text-white uppercase tracking-widest mb-2"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          Create <span className="text-red-500">Event</span>
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Fill in the details below to create a new tournament.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Title and Game side by side on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Event Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className={formErrors.title ? inputError : inputNormal}
                placeholder="e.g. Apex Legends Solo Queue"
                aria-invalid={!!formErrors.title}
                aria-describedby={formErrors.title ? "title-error" : undefined}
              />
              {formErrors.title && (
                <p id="title-error" className="mt-1 text-sm text-red-400" role="alert">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="game"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Game
              </label>
              <input
                id="game"
                type="text"
                required
                value={form.game}
                onChange={(e) => updateField("game", e.target.value)}
                className={formErrors.game ? inputError : inputNormal}
                placeholder="e.g. Apex Legends"
                aria-invalid={!!formErrors.game}
                aria-describedby={formErrors.game ? "game-error" : undefined}
              />
              {formErrors.game && (
                <p id="game-error" className="mt-1 text-sm text-red-400" role="alert">{formErrors.game}</p>
              )}
            </div>
          </div>

          {/* RAWG game preview: shows a thumbnail and metadata when a game is matched */}
          {gameSearching && form.game.trim() && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
              Searching RAWG...
            </div>
          )}
          {gamePreview && !gameSearching && (
            <div className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900 p-3">
              {gamePreview.background_image && (
                <img
                  src={gamePreview.background_image}
                  alt={gamePreview.name}
                  className="h-16 w-24 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {gamePreview.name}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {gamePreview.metacritic && (
                    <span className="text-xs text-green-400">
                      Metacritic {gamePreview.metacritic}
                    </span>
                  )}
                  {gamePreview.released && (
                    <span className="text-xs text-gray-500">
                      Released {gamePreview.released}
                    </span>
                  )}
                  {gamePreview.genres.slice(0, 2).map((g) => (
                    <span key={g.id} className="text-xs text-gray-500">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Date and Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Date & Time
              </label>
              <input
                id="date"
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                className={formErrors.date ? inputError : inputNormal}
                aria-invalid={!!formErrors.date}
                aria-describedby={formErrors.date ? "date-error" : undefined}
              />
              {formErrors.date && (
                <p id="date-error" className="mt-1 text-sm text-red-400" role="alert">{formErrors.date}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Location
              </label>
              <input
                id="location"
                type="text"
                required
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className={formErrors.location ? inputError : inputNormal}
                placeholder="e.g. Online - EU Servers"
                aria-invalid={!!formErrors.location}
                aria-describedby={formErrors.location ? "location-error" : undefined}
              />
              {formErrors.location && (
                <p id="location-error" className="mt-1 text-sm text-red-400" role="alert">{formErrors.location}</p>
              )}
            </div>
          </div>

          {/* Prize Pool and Entry Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="prizePool"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Prize Pool (£)
              </label>
              <input
                id="prizePool"
                type="number"
                required
                min={0}
                value={form.prizePool}
                onChange={(e) =>
                  updateField("prizePool", Number(e.target.value))
                }
                className={formErrors.prizePool ? inputError : inputNormal}
                placeholder="0"
                aria-invalid={!!formErrors.prizePool}
                aria-describedby={formErrors.prizePool ? "prizePool-error" : undefined}
              />
              {formErrors.prizePool && (
                <p id="prizePool-error" className="mt-1 text-sm text-red-400" role="alert">{formErrors.prizePool}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="entryFee"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Entry Fee (£)
              </label>
              <input
                id="entryFee"
                type="number"
                required
                min={0}
                step={0.5}
                value={form.entryFee}
                onChange={(e) =>
                  updateField("entryFee", Number(e.target.value))
                }
                className={formErrors.entryFee ? inputError : inputNormal}
                placeholder="0"
                aria-invalid={!!formErrors.entryFee}
                aria-describedby={formErrors.entryFee ? "entryFee-error" : undefined}
              />
              {formErrors.entryFee && (
                <p id="entryFee-error" className="mt-1 text-sm text-red-400" role="alert">{formErrors.entryFee}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Set to 0 for free events
              </p>
            </div>
          </div>

          {/* Max Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="maxParticipants"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Max Participants
              </label>
              <input
                id="maxParticipants"
                type="number"
                required
                min={2}
                value={form.maxParticipants}
                onChange={(e) =>
                  updateField("maxParticipants", Number(e.target.value))
                }
                className={formErrors.maxParticipants ? inputError : inputNormal}
                placeholder="20"
                aria-invalid={!!formErrors.maxParticipants}
                aria-describedby={formErrors.maxParticipants ? "maxParticipants-error" : undefined}
              />
              {formErrors.maxParticipants && (
                <p id="maxParticipants-error" className="mt-1 text-sm text-red-400" role="alert">{formErrors.maxParticipants}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className={(formErrors.description ? inputError : inputNormal) + " resize-none"}
              placeholder="Describe the tournament format, rules, and what players should expect..."
              aria-invalid={!!formErrors.description}
              aria-describedby={formErrors.description ? "description-error" : undefined}
            />
            {formErrors.description && (
              <p id="description-error" className="mt-1 text-sm text-red-400" role="alert">{formErrors.description}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            aria-label="Create tournament"
            className="w-full rounded-lg bg-red-500 py-3 text-base font-semibold text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating..." : "Create Tournament"}
          </button>
        </form>

        {/* Staff Management Section */}
        <div className="mt-16 border-t border-gray-800 pt-10">
          <h2
            className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest mb-2"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Manage <span className="text-red-500">Staff</span>
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Promote a registered user to staff by entering their email address.
          </p>

          <form onSubmit={handlePromote} className="space-y-3">
            <div className="flex gap-3">
              <label htmlFor="staffEmail" className="sr-only">
                User email
              </label>
              <input
                id="staffEmail"
                type="email"
                required
                value={staffEmail}
                onChange={(e) => {
                  setStaffEmail(e.target.value);
                  if (staffError) setStaffError("");
                }}
                className={staffError ? inputError : inputNormal}
                placeholder="user@example.com"
                autoComplete="email"
                aria-invalid={!!staffError}
                aria-describedby={staffError ? "staff-error" : undefined}
              />
              <button
                type="submit"
                disabled={promoting}
                aria-busy={promoting}
                aria-label="Promote user to staff"
                className="flex-shrink-0 rounded-lg bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promoting ? "Promoting..." : "Make Staff"}
              </button>
            </div>
            {staffError && (
              <p id="staff-error" className="text-sm text-red-400" role="alert">{staffError}</p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
