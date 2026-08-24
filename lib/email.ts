import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function queueEmail(prisma: any, userId: string, type: string, subject: string, body: string) {
  await prisma.notification.create({
    data: {
      userId,
      type,
      subject,
      body,
      status: "PENDING",
      nextRetryAt: new Date()
    }
  });
}

export async function sendEmail(to: string, subject: string, body: string) {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject,
    html: `<div style="font-family:sans-serif;max-width:600px">${body}</div>`
  });
}
