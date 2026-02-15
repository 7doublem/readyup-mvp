// Edit profile page for gamertag and avatar
// Available to any logged-in user (staff or player). Lets users change their
// gamertag (validated for format and uniqueness), change their avatar (upload
// or pick from RAWG options), and view their email and role (read-only).
// Updates are written directly to the Firestore users/{uid} document.

import { useState, type FormEvent } from "react";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import AvatarPicker from "../components/AvatarPicker";
import { validateGamertag } from "../utils/validation";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, displayName, avatarUrl, role } = useAuth();

  const [newDisplayName, setNewDisplayName] = useState(displayName);
  const [newAvatarUrl, setNewAvatarUrl] = useState(avatarUrl);
  const [saving, setSaving] = useState(false);
  const [gamertagError, setGamertagError] = useState<string | undefined>();

  // Track whether anything has actually changed
  const hasChanges =
    newDisplayName !== displayName || newAvatarUrl !== avatarUrl;

  // Checks if the gamertag is already taken by another user (not the current user)
  async function isGamertagTaken(tag: string): Promise<boolean> {
    const q = query(
      collection(db, "users"),
      where("displayName", "==", tag.trim())
    );
    const snapshot = await getDocs(q);
    // Ignore the current user's own document
    return snapshot.docs.some((d) => d.id !== user?.uid);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !hasChanges) return;

    // Validate gamertag format
    const validationError = validateGamertag(newDisplayName);
    if (validationError) {
      setGamertagError(validationError);
      return;
    }

    setSaving(true);
    setGamertagError(undefined);

    try {
      // Only check uniqueness if the gamertag actually changed
      if (newDisplayName.trim() !== displayName) {
        const taken = await isGamertagTaken(newDisplayName);
        if (taken) {
          setGamertagError("Gamertag is already in use.");
          setSaving(false);
          return;
        }
      }

      await updateDoc(doc(db, "users", user.uid), {
        displayName: newDisplayName.trim(),
        avatarUrl: newAvatarUrl,
      });
      toast.success("Profile updated!");
      window.location.reload();
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  // Shared Tailwind classes — inputError shows a red border for invalid fields
  const inputBase =
    "w-full rounded-lg border bg-gray-900 px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2";
  const inputNormal = `${inputBase} border-gray-700 focus:border-red-500 focus:ring-red-500/50`;
  const inputError = `${inputBase} border-red-500 focus:border-red-500 focus:ring-red-500/50`;

  return (
    <main className="min-h-screen bg-black px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1
          className="text-2xl sm:text-3xl font-black text-white uppercase tracking-widest mb-2"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          Edit <span className="text-red-500">Profile</span>
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Update your gamertag and avatar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Avatar */}
          <AvatarPicker value={newAvatarUrl} onChange={setNewAvatarUrl} />

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
              value={newDisplayName}
              onChange={(e) => {
                setNewDisplayName(e.target.value);
                if (gamertagError) setGamertagError(undefined);
              }}
              className={gamertagError ? inputError : inputNormal}
              placeholder="e.g. Player1X"
              aria-invalid={!!gamertagError}
              aria-describedby={gamertagError ? "gamertag-error" : undefined}
            />
            {gamertagError && (
              <p id="gamertag-error" className="mt-1 text-sm text-red-400" role="alert">
                {gamertagError}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-600">Must contain both letters and numbers</p>
          </div>

          {/* Read-only fields */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <p className="rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-base text-gray-500">
              {user?.email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Role
            </label>
            <p className="rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-base text-gray-500">
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                  role === "staff"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-gray-800 text-gray-400 border border-gray-700"
                }`}
              >
                {role === "staff" ? "Staff" : "Player"}
              </span>
            </p>
          </div>

          <button
            type="submit"
            disabled={saving || !hasChanges}
            aria-busy={saving}
            aria-label="Save profile changes"
            className="w-full rounded-lg bg-red-500 py-3 text-base font-semibold text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : hasChanges ? "Save Changes" : "No Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
