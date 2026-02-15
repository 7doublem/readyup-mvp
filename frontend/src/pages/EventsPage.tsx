// Upcoming events feed with real-time Firestore updates, RAWG game images,
// join/payment flow, Google Calendar integration, and full error handling

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  addToGoogleCalendar,
  isGoogleCalendarAvailable,
} from "../lib/googleCalendar";
import { getGoogleCalendarUrl } from "../utils/calendar";
import { redirectToCheckout } from "../lib/stripe";
import { searchGames, type RawgGame } from "../lib/rawg";
import LoadingSkeleton from "../components/LoadingSkeleton";
import toast from "react-hot-toast";

interface Event {
  id: string;
  title: string;
  game: string;
  date: Timestamp;
  location: string;
  prizePool: number;
  entryFee: number;
  maxParticipants: number;
  attendees: string[];
  description: string;
  status: string;
}

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Game images pulled from RAWG API, keyed by lowercase game name
  const [gameImages, setGameImages] = useState<Map<string, RawgGame>>(
    new Map(),
  );
  // Track which event is currently being joined or added to calendar
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);
  const [calendarLoadingId, setCalendarLoadingId] = useState<string | null>(null);

  // Real-time listener so users see slots filling up instantly
  useEffect(() => {
    setFetchError(null);

    const q = query(
      collection(db, "events"),
      where("status", "==", "upcoming"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Event[];

        // Sort by date (soonest first)
        docs.sort((a, b) => a.date.toMillis() - b.date.toMillis());
        setEvents(docs);
        setLoading(false);

        // Fetch game images from RAWG for each unique game title
        const gameNames = [...new Set(docs.map((e) => e.game))];
        searchGames(gameNames).then(setGameImages);
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
        setFetchError("Failed to load events. Please check your connection and try again.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  // Handle payment success redirect from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const eventId = params.get("eventId");
    const uid = params.get("uid");

    if (payment === "success" && eventId && uid) {
      // Payment went through — add user to attendees
      updateDoc(doc(db, "events", eventId), {
        attendees: arrayUnion(uid),
      })
        .then(() => toast.success("Payment successful! You're registered."))
        .catch(() =>
          toast.error(
            "Payment received but registration failed. Contact support.",
          ),
        );

      // Clean up the URL so it doesn't re-trigger on refresh
      window.history.replaceState({}, "", "/");
    } else if (payment === "cancelled") {
      toast.error("Payment cancelled.");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // Adds the current user's UID to the event's attendees array
  // Free events go straight through; paid events redirect to Stripe first
  async function handleJoin(event: Event) {
    if (!user) {
      navigate("/login");
      return;
    }

    // Guard: already registered
    if (event.attendees.includes(user.uid)) {
      toast.error("You are already registered for this event.");
      return;
    }

    // Guard: event is full
    if (event.attendees.length >= event.maxParticipants) {
      toast.error("This event is full.");
      return;
    }

    // Guard: event date has passed
    try {
      if (event.date.toDate() < new Date()) {
        toast.error("This event has already started.");
        return;
      }
    } catch {
      toast.error("Invalid event date.");
      return;
    }

    setJoiningEventId(event.id);

    // Paid event — redirect to Stripe Checkout
    if (event.entryFee > 0) {
      try {
        await redirectToCheckout({
          eventId: event.id,
          eventTitle: event.title,
          entryFee: event.entryFee,
          userUid: user.uid,
        });
      } catch {
        toast.error("Payment failed. Please try again.");
      } finally {
        setJoiningEventId(null);
      }
      return;
    }

    // Free event — add to attendees directly
    try {
      await updateDoc(doc(db, "events", event.id), {
        attendees: arrayUnion(user.uid),
      });
      toast.success("You're in! See you there.");
    } catch {
      toast.error("Join Failed: Server Error.");
    } finally {
      setJoiningEventId(null);
    }
  }

  // Adds the event to the user's Google Calendar via the Calendar API
  async function handleAddToCalendar(event: Event) {
    setCalendarLoadingId(event.id);

    let eventDate: Date;
    try {
      eventDate = event.date.toDate();
    } catch {
      toast.error("Invalid event date. Cannot add to calendar.");
      setCalendarLoadingId(null);
      return;
    }

    const calendarEvent = {
      title: event.title,
      date: eventDate,
      location: event.location,
      game: event.game,
      description: event.description,
    };

    // If the Google Calendar API is available, use it directly
    if (isGoogleCalendarAvailable()) {
      try {
        await addToGoogleCalendar(calendarEvent);
        toast.success("Event added to your Google Calendar!");
      } catch (error) {
        console.error("Google Calendar API error:", error);
        toast.error("Failed to add to calendar. Opening fallback link...");
        // Fallback to URL method on API failure
        window.open(getGoogleCalendarUrl(calendarEvent), "_blank", "noopener");
      }
    } else {
      // Fallback: open the Google Calendar URL in a new tab
      window.open(getGoogleCalendarUrl(calendarEvent), "_blank", "noopener");
    }

    setCalendarLoadingId(null);
  }

  // Loading state shows skeleton cards
  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1
            className="text-2xl sm:text-3xl font-black text-white uppercase tracking-widest mb-8"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Upcoming <span className="text-red-500">Events</span>
          </h1>
          <LoadingSkeleton />
        </div>
      </main>
    );
  }

  // Error state with retry button
  if (fetchError) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-500 px-6 py-2 text-sm font-semibold text-white hover:bg-red-400 transition"
            aria-label="Retry loading events"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1
          className="text-2xl sm:text-3xl font-black text-white uppercase tracking-widest mb-8"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          Upcoming <span className="text-red-500">Events</span>
        </h1>

        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-16">
            No upcoming events. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const isFull = event.attendees.length >= event.maxParticipants;
              const isRegistered = user
                ? event.attendees.includes(user.uid)
                : false;
              const spotsLeft = event.maxParticipants - event.attendees.length;
              const isJoining = joiningEventId === event.id;
              const isCalendarLoading = calendarLoadingId === event.id;

              let eventDate: Date;
              try {
                eventDate = event.date.toDate();
              } catch {
                // Skip events with invalid dates
                return null;
              }

              const isPast = eventDate < new Date();
              // Look up the RAWG image for this game
              const rawg = gameImages.get(event.game.trim().toLowerCase());
              const bannerUrl = rawg?.background_image;

              return (
                <div
                  key={event.id}
                  className={`rounded-xl border border-gray-800 bg-gray-950 overflow-hidden flex flex-col justify-between ${isPast ? "opacity-60" : ""}`}
                >
                  {/* Game banner image from RAWG API */}
                  {bannerUrl ? (
                    <img
                      src={bannerUrl}
                      alt={`${event.game} banner`}
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-900 flex items-center justify-center">
                      <span className="text-gray-700 text-sm uppercase tracking-wider">
                        {event.game}
                      </span>
                    </div>
                  )}

                  {/* Card body */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                        {event.game}
                      </span>
                      <span
                        className={`text-xs ${
                          spotsLeft <= 3 && spotsLeft > 0
                            ? "text-yellow-400 font-semibold"
                            : "text-gray-500"
                        }`}
                      >
                        {spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-white mb-2">
                      {event.title}
                    </h2>

                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    {/* RAWG metadata: genres + Metacritic score */}
                    {rawg && (
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        {rawg.metacritic && (
                          <span className="inline-flex items-center rounded bg-green-900/40 px-2 py-0.5 text-xs font-semibold text-green-400 border border-green-800/50">
                            Metacritic {rawg.metacritic}
                          </span>
                        )}
                        {rawg.genres.slice(0, 3).map((g) => (
                          <span
                            key={g.id}
                            className="inline-flex items-center rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Event details */}
                    <div className="space-y-1.5 text-sm text-gray-400 mb-5">
                      <p>
                        <span className="text-gray-500">Date:</span>{" "}
                        {eventDate.toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {eventDate.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p>
                        <span className="text-gray-500">Location:</span>{" "}
                        {event.location}
                      </p>
                      <p>
                        <span className="text-gray-500">Prize:</span>{" "}
                        <span className="text-white font-semibold">
                          £{event.prizePool}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Entry:</span>{" "}
                        <span className="text-white font-semibold">
                          {event.entryFee > 0 ? `£${event.entryFee}` : "Free"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-5 pb-5 space-y-2">
                    {isPast ? (
                      <button
                        disabled
                        className="w-full rounded-lg bg-gray-800 py-2.5 text-sm font-semibold text-gray-500 cursor-default"
                        aria-label="Event has ended"
                      >
                        Event Ended
                      </button>
                    ) : isRegistered ? (
                      <>
                        <button
                          disabled
                          className="w-full rounded-lg bg-gray-800 py-2.5 text-sm font-semibold text-green-400 cursor-default"
                          aria-label={`You are registered for ${event.title}`}
                        >
                          Registered ✅
                        </button>
                        <button
                          onClick={() => handleAddToCalendar(event)}
                          disabled={isCalendarLoading}
                          className="w-full rounded-lg border border-gray-700 py-2.5 text-sm font-medium text-gray-300 text-center hover:border-gray-500 hover:text-white transition disabled:opacity-50"
                          aria-label={`Add ${event.title} to Google Calendar`}
                        >
                          {isCalendarLoading ? "Adding..." : "📅 Add to Google Calendar"}
                        </button>
                      </>
                    ) : isFull ? (
                      <button
                        disabled
                        className="w-full rounded-lg bg-gray-800 py-2.5 text-sm font-semibold text-gray-500 cursor-default"
                        aria-label={`${event.title} is full`}
                      >
                        Full ⛔
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(event)}
                        disabled={isJoining}
                        className="w-full rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                        aria-label={`Join ${event.title}${event.entryFee > 0 ? ` for £${event.entryFee}` : ""}`}
                      >
                        {isJoining
                          ? "Processing..."
                          : event.entryFee > 0
                            ? `Pay £${event.entryFee} & Join`
                            : "Join Queue"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
