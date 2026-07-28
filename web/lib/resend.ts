import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

const resendClient = apiKey ? new Resend(apiKey) : null;
export const RESEND_FROM = fromEmail || "noreply@waspnest.org";

export const resend = {
  emails: {
    send: async (params: any) => {
      if (!resendClient) {
        console.warn("Resend not configured, skipping email send:", params);
        return { id: "skipped" };
      }
      return resendClient.emails.send(params);
    }
  }
};
