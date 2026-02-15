// Generates a Google Calendar "Add Event" URL from event details
// Opens in a new tab so the user can save it to their personal calendar

interface CalendarEventParams {
  title: string;
  date: Date;
  location: string;
  game: string;
  description: string;
}

// Formats a Date into the YYYYMMDDTHHmmSSZ format Google Calendar expects
function formatGoogleDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function getGoogleCalendarUrl(event: CalendarEventParams): string {
  const start = new Date(event.date);

  // Assume events last 1 hour
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details: `${event.game}\n\n${event.description}`,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
