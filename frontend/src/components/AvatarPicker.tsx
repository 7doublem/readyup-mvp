// Avatar selection component used on the Signup and Profile pages
// Provides two ways to set an avatar: upload a custom image (converted to
// base64, max 200KB) or pick from 8 prebuilt gaming avatars fetched from
// the RAWG API. The DEFAULT_AVATAR constant is exported for use as a fallback.

import { useState, useEffect, useRef } from "react";

// Default avatar used when a user doesn't pick one (GTA V)
export const DEFAULT_AVATAR =
  "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg";

// Popular game slugs to fetch avatar images from RAWG
const AVATAR_GAMES = [
  "grand-theft-auto-v",
  "the-witcher-3-wild-hunt",
  "portal-2",
  "cyberpunk-2077",
  "red-dead-redemption-2",
  "god-of-war-2018",
  "elden-ring",
  "minecraft",
];

const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY;

interface AvatarPickerProps {
  value: string;
  onChange: (url: string) => void;
}

export default function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const [prebuiltAvatars, setPrebuiltAvatars] = useState<string[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch game images from RAWG to use as prebuilt avatar options
  useEffect(() => {
    if (!RAWG_KEY) {
      setLoadingAvatars(false);
      return;
    }

    async function fetchAvatars() {
      try {
        const urls: string[] = [];
        for (const slug of AVATAR_GAMES) {
          const res = await fetch(
            `https://api.rawg.io/api/games/${slug}?key=${RAWG_KEY}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.background_image) {
              urls.push(data.background_image);
            }
          }
        }
        setPrebuiltAvatars(urls);
      } catch (error) {
        console.error("Failed to load avatar images:", error);
      } finally {
        setLoadingAvatars(false);
      }
    }

    fetchAvatars();
  }, []);

  // Converts an uploaded file to a base64 data URL (max 200KB)
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 200KB to stay within Firestore document limits
    if (file.size > 200 * 1024) {
      alert("Image must be under 200KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // Reset the input so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div>
      <p className="block text-sm font-medium text-gray-300 mb-2">
        Choose an Avatar
      </p>

      {/* Current selection preview */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-900 flex items-center justify-center flex-shrink-0">
          {value ? (
            <img
              src={value}
              alt="Selected avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-gray-600 text-xs">None</span>
          )}
        </div>

        {/* Upload custom image */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload a custom avatar image"
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-gray-500 hover:text-white transition"
        >
          Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileUpload}
          className="hidden"
          aria-label="Upload avatar image"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove selected avatar"
            className="text-sm text-gray-500 hover:text-red-400 transition"
          >
            Remove
          </button>
        )}
      </div>

      {/* Prebuilt avatars from RAWG */}
      <p className="text-xs text-gray-500 mb-2">Or pick a gaming avatar:</p>
      {loadingAvatars ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
          Loading avatars...
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {prebuiltAvatars.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(url)}
              aria-label={`Select avatar option ${i + 1}`}
              className={`h-14 w-14 rounded-full overflow-hidden border-2 transition hover:border-red-400 ${
                value === url
                  ? "border-red-500 ring-2 ring-red-500/50"
                  : "border-gray-700"
              }`}
            >
              <img
                src={url}
                alt={`Avatar option ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
