import { google } from "googleapis";
import { ENV } from "./env";

let calendarClient: ReturnType<typeof google.calendar> | null = null;

export async function getCalendarClient() {
  if (calendarClient) {
    return calendarClient;
  }

  try {
    const serviceAccountKey = JSON.parse(ENV.googleCalendarServiceAccountJson);
    
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    calendarClient = google.calendar({ version: "v3", auth });
    return calendarClient;
  } catch (error) {
    console.error("[Google Calendar] Failed to initialize:", error);
    throw error;
  }
}

export async function getAvailableSlots(date: Date) {
  try {
    const calendar = await getCalendarClient();
    const calendarId = ENV.googleCalendarId;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const bookedSlots = (events.data.items || []).map((event: any) => {
      if (event.start?.dateTime) {
        const time = new Date(event.start.dateTime);
        return `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
      }
      return null;
    }).filter(Boolean);

    const allSlots = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
    return availableSlots;
  } catch (error) {
    console.error("[Google Calendar] Failed to get available slots:", error);
    throw error;
  }
}

export async function createCalendarEvent(
  clientName: string,
  clientEmail: string,
  service: string,
  appointmentDate: Date,
  notes?: string
) {
  try {
    const calendar = await getCalendarClient();
    const calendarId = ENV.googleCalendarId;

    const endTime = new Date(appointmentDate);
    endTime.setMinutes(endTime.getMinutes() + 60); // 1 hour appointment

    const event = {
      summary: `${service} - ${clientName}`,
      description: `Cliente: ${clientName}\nEmail: ${clientEmail}\nServiço: ${service}${notes ? `\nNotas: ${notes}` : ""}`,
      start: {
        dateTime: appointmentDate.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      attendees: [
        { email: clientEmail },
        { email: ENV.googleCalendarId },
      ],
    };

    const createdEvent = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return createdEvent.data.id;
  } catch (error) {
    console.error("[Google Calendar] Failed to create event:", error);
    throw error;
  }
}

export async function deleteCalendarEvent(eventId: string) {
  try {
    const calendar = await getCalendarClient();
    const calendarId = ENV.googleCalendarId;

    await calendar.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    console.error("[Google Calendar] Failed to delete event:", error);
    throw error;
  }
}
