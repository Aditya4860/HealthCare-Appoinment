import { google } from "googleapis";
import { prisma } from "./prisma";
import { APP_TIMEZONE } from "./timezone";
import { env } from "@/lib/env";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(userId: string) {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state: userId
  });
}

export async function storeTokens(userId: string, code: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  await prisma.calendarToken.upsert({
    where: { userId },
    update: { 
      accessToken: tokens.access_token as string, 
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: new Date(tokens.expiry_date as number) 
    },
    create: { 
      userId, 
      accessToken: tokens.access_token as string, 
      refreshToken: tokens.refresh_token as string,
      expiresAt: new Date(tokens.expiry_date as number) 
    }
  });
}

async function getAuthenticatedClient(userId: string) {
  const stored = await prisma.calendarToken.findUnique({ where: { userId } });
  if (!stored) return null;
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({ access_token: stored.accessToken, refresh_token: stored.refreshToken });
  oauth2.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.calendarToken.update({ where: { userId }, 
        data: { accessToken: tokens.access_token, expiresAt: new Date(tokens.expiry_date as number) }});
    }
  });
  return oauth2;
}

export async function createEvent(userId: string, appointment: any): Promise<string | null> {
  try {
    const auth = await getAuthenticatedClient(userId);
    if (!auth) return null;
    const calendar = google.calendar({ version: "v3", auth });
    
    // Convert slot (e.g. "09:00") into Date objects
    // Extract date and slot from the scheduledAt if it's available, otherwise from appointment directly
    const scheduledAt = appointment.scheduledAt instanceof Date ? appointment.scheduledAt : new Date(appointment.scheduledAt);
    
    // In our DB, appointment.doctor is User, and might not have doctorProfile included depending on query.
    // Let's refetch to ensure we have slotDuration and names
    const fullAppt = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: { doctor: { include: { doctorProfile: true } }, patient: true }
    });
    
    if (!fullAppt || !fullAppt.doctor.doctorProfile) return null;
    
    const start = new Date(fullAppt.scheduledAt);
    const end = new Date(start.getTime() + fullAppt.doctor.doctorProfile.slotDuration * 60000);
    
    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `Medical Appointment`,
        description: `Appointment with Dr. ${fullAppt.doctor.name}\nPatient: ${fullAppt.patient.name}`,
        start: { dateTime: start.toISOString(), timeZone: APP_TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: APP_TIMEZONE }
      }
    });
    return event.data.id || null;
  } catch (e) {
    console.error("Calendar create failed:", e);
    return null;
  }
}

export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  try {
    const auth = await getAuthenticatedClient(userId);
    if (!auth || !eventId) return;
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch (e) {
    console.error("Calendar delete failed:", e);
  }
}
