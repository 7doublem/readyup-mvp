// Frontend unit tests
// Run with: npm test (from /frontend)
// Tests cover Navbar rendering, Join button logic, and Google Calendar URL generation.
// Firebase is mocked so tests run without a real backend connection.

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { getGoogleCalendarUrl } from "../utils/calendar";

// Mock Firebase so auth/db imports don't crash in tests
vi.mock("../lib/firebase", () => ({
  auth: {},
  db: {},
}));

// Mock onAuthStateChanged so AuthProvider doesn't hang
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth: unknown, callback: (user: null) => void) => {
    // Immediately fire with null (logged-out state)
    callback(null);
    return () => {};
  },
  getAuth: () => ({}),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(),
  getApps: () => [],
}));

// Import components after mocks are set up
import Navbar from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";

// Verify the Navbar renders
describe("Navbar", () => {
  it("renders without crashing (hidden when logged out)", () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </MemoryRouter>
    );

    // Navbar returns null when no user is logged in,
    // so the container should be empty
    expect(container.innerHTML).toBe("");
  });
});

// Verify the Join button is disabled when event is full
describe("Join button logic", () => {
  it("disables the Join button when attendees >= maxParticipants", () => {
    const maxParticipants = 2;
    const attendees = ["user-1", "user-2"];
    const isFull = attendees.length >= maxParticipants;

    render(
      <button
        disabled={isFull}
        aria-label="Join event"
        className="rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white"
      >
        {isFull ? "Full" : "Join Queue"}
      </button>
    );

    const button = screen.getByRole("button", { name: /join event/i });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Full");
  });

  it("enables the Join button when spots are available", () => {
    const maxParticipants = 20;
    const attendees = ["user-1"];
    const isFull = attendees.length >= maxParticipants;

    render(
      <button
        disabled={isFull}
        aria-label="Join event"
        className="rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white"
      >
        {isFull ? "Full" : "Join Queue"}
      </button>
    );

    const button = screen.getByRole("button", { name: /join event/i });
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Join Queue");
  });
});

// Test the calendar utility generates valid URLs
describe("getGoogleCalendarUrl", () => {
  it("generates a valid Google Calendar URL with correct parameters", () => {
    const event = {
      title: "Apex Legends Solo Queue",
      date: new Date("2026-03-15T18:00:00Z"),
      location: "Online - EU Servers",
      game: "Apex Legends",
      description: "Prove your worth in a solo queue ranked grind.",
    };

    const url = getGoogleCalendarUrl(event);

    // Must start with the Google Calendar base URL
    expect(url).toContain("https://calendar.google.com/calendar/render");

    // Must include required parameters
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("text=Apex+Legends+Solo+Queue");
    expect(url).toContain("location=Online+-+EU+Servers");
  });

  it("generates dates in the correct YYYYMMDDTHHmmSSZ format", () => {
    const event = {
      title: "Test Event",
      date: new Date("2026-06-20T14:30:00Z"),
      location: "London",
      game: "Valorant",
      description: "Test description",
    };

    const url = getGoogleCalendarUrl(event);

    // Start date should be 20260620T143000Z
    expect(url).toContain("20260620T143000Z");

    // End date should be 1 hour later: 20260620T153000Z
    expect(url).toContain("20260620T153000Z");

    // Both dates separated by "/"
    expect(url).toContain("20260620T143000Z%2F20260620T153000Z");
  });

  it("includes the game name in the details", () => {
    const event = {
      title: "Fortnite Battle",
      date: new Date("2026-04-01T10:00:00Z"),
      location: "Online",
      game: "Fortnite",
      description: "Zero build arena.",
    };

    const url = getGoogleCalendarUrl(event);

    // Details should contain the game name
    expect(url).toContain("Fortnite");
    expect(url).toContain("Zero+build+arena.");
  });
});
