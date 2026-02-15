// Google Calendar API integration using OAuth 2.0 (Token Model)
// Uses Google Identity Services (GIS) for authorization, then calls the
// Calendar REST API directly to insert events into the user's calendar.
// Docs: https://developers.google.com/calendar/api/v3/reference/events/insert

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/calendar.events";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

// TypeScript declarations for the Google Identity Services library
// loaded via <script> in index.html
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

interface TokenResponse {
  access_token: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: () => void;
}

export interface CalendarEvent {
  title: string;
  date: Date;
  location: string;
  game: string;
  description: string;
}

// Requests an OAuth token from Google, then inserts the event into the user's
// primary calendar. Returns true on success, throws on failure.
export function addToGoogleCalendar(event: CalendarEvent): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error("Google Identity Services not loaded"));
      return;
    }

    if (!CLIENT_ID) {
      reject(new Error("Google Client ID not configured"));
      return;
    }

    // Assume events last 1 hour
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (tokenResponse: TokenResponse) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
          return;
        }

        try {
          // Call the Calendar API to insert the event
          const res = await fetch(CALENDAR_API, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              summary: event.title,
              description: `${event.game}\n\n${event.description}`,
              location: event.location,
              start: {
                dateTime: start.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              end: {
                dateTime: end.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || "Failed to create calendar event");
          }

          resolve(true);
        } catch (error) {
          reject(error);
        }
      },
    });

    // Opens the Google consent popup for the user to authorize
    tokenClient.requestAccessToken();
  });
}

// Checks whether the Google Identity Services script has loaded
export function isGoogleCalendarAvailable(): boolean {
  return !!window.google?.accounts?.oauth2 && !!CLIENT_ID;
}
