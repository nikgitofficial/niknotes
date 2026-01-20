import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function sendEmail(to: string, subject: string, text: string) {
  try {
    await resend.emails.send({
      from: "YourApp <noreply@yourapp.com>",
      to,
      subject,
      text,
    });
    console.log("Email sent to", to);
  } catch (err) {
    console.error("Failed to send email:", err);
    throw new Error("Email sending failed");
  }
}
