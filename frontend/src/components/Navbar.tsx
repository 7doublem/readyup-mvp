import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, role, avatarUrl, displayName, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function handleLogout() {
    setDropdownOpen(false);
    await logout();
    navigate("/login");
  }

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render the navbar if the user isn't logged in
  if (!user) return null;

  return (
    <nav className="bg-black border-b border-gray-800 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl flex items-center justify-between h-14">
        {/* Logo / Home link */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-black text-white uppercase"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          <img src="/favicon.png" alt="ReadyUp logo" className="h-7 w-7" /><span>READY<span className="text-red-500">UP</span></span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Events link */}
          <Link
            to="/"
            className="text-sm font-medium text-gray-300 hover:text-white transition"
          >
            Events
          </Link>

          {/* Only visible to staff users */}
          {role === "staff" && (
            <Link
              to="/admin"
              className="text-sm font-medium text-gray-300 hover:text-white transition"
            >
              Staff Dashboard
            </Link>
          )}

          {/* Avatar with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black rounded-full"
              aria-label="User menu"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Your avatar"
                  className="h-8 w-8 rounded-full object-cover border-2 border-gray-700 hover:border-red-500 transition"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-800 border-2 border-gray-700 hover:border-red-500 transition flex items-center justify-center text-sm font-semibold text-gray-400">
                  {(displayName || user.email || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-800 bg-gray-950 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                {/* User info header */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Your avatar"
                      className="h-10 w-10 rounded-full object-cover border border-gray-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-base font-semibold text-gray-400 flex-shrink-0">
                      {(displayName || user.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {displayName || "No gamertag"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Role badge */}
                <div className="px-4 py-2 border-b border-gray-800">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                      role === "staff"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                    }`}
                  >
                    {role === "staff" ? "Staff" : "Player"}
                  </span>
                </div>

                {/* Edit Profile link */}
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-400 hover:bg-gray-900 hover:text-white transition border-b border-gray-800"
                >
                  Edit Profile
                </Link>

                {/* Log out */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:bg-gray-900 hover:text-red-400 transition"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
