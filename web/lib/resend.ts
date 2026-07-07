import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

if (!apiKey || !fromEmail) {
  throw new Error(
    "Missing Resend environment variables. Check web/.env.local against .env.example."
  );
}

export const resend = new Resend(apiKey);
export const RESEND_FROM = fromEmail;
