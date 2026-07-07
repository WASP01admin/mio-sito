import { getTranslations } from "next-intl/server";
import ResendVerificationForm from "@/components/registrati/ResendVerificationForm";

interface ErrorPageProps {
  searchParams: Promise<{ reason?: string }>;
}

const KNOWN_REASONS = ["missing_token", "invalid_token", "expired_token", "server_error"];

export default async function RegistrationErrorPage({ searchParams }: ErrorPageProps) {
  const { reason } = await searchParams;
  const t = await getTranslations("RegistrationError");
  const resolvedReason = KNOWN_REASONS.includes(reason ?? "") ? reason! : "server_error";

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white/90 px-4 py-16 text-center sm:px-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        <p className="mt-4 text-gray-700">
          {t(`reasons.${resolvedReason}`)}
        </p>

        {resolvedReason === "expired_token" && <ResendVerificationForm />}
      </div>
    </main>
  );
}
