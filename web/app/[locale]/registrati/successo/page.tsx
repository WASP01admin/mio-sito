import { getTranslations } from "next-intl/server";

interface SuccessPageProps {
  searchParams: Promise<{
    code?: string;
    mobile?: string;
    renewed?: string;
    chatToken?: string;
  }>;
}

export default async function RegistrationSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { code, mobile, renewed, chatToken } = await searchParams;
  const t = await getTranslations("RegistrationSuccess");
  const isRenewed = renewed === "true";
  const isMobile = mobile === "true";

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white/90 px-4 py-16 text-center sm:px-8">
      <div className="mx-auto max-w-md">
        {isRenewed ? (
          <>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {t("renewed.title")}
            </h1>
            <p className="mt-4 text-gray-700">{t("renewed.explanation")}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {t("pending.title")}
            </h1>

            <div className="mt-6 rounded-md border-2 border-yellow-400 bg-yellow-50 px-4 py-2 text-sm font-bold uppercase text-yellow-800">
              {t("pending.statusBadge")}
            </div>

            {code && (
              <p className="mt-6 font-mono text-lg font-bold tracking-wider">
                {t("pending.codeLabel")} {code}
              </p>
            )}

            <p className="mt-4 text-sm leading-relaxed text-gray-700">
              {t("pending.explanation")}
            </p>

            <p className="mt-4 rounded-md border-2 border-black bg-wasp-yellow/20 p-3 text-sm font-semibold leading-relaxed text-black">
              {t("pending.associationCta")}
            </p>

            {!isMobile && (
              <p className="mt-6 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
                {t("mobileWarning")}
              </p>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="rounded-lg border-2 border-black bg-black px-4 py-2 text-center text-white">
                <div className="text-xs font-bold">Apple Wallet</div>
              </div>
              <div className="rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-2 text-center">
                <div className="text-xs font-bold text-blue-600">Google Wallet</div>
              </div>
              <div className="rounded-lg border-2 border-blue-600 bg-blue-50 px-4 py-2 text-center">
                <div className="text-xs font-bold text-blue-700">Samsung Wallet</div>
              </div>
            </div>

            {chatToken && (
              <a
                href={`/api/chat/enter?token=${encodeURIComponent(chatToken)}`}
                className="mt-6 inline-block rounded-md bg-black px-6 py-3 text-sm font-bold text-wasp-yellow"
              >
                {t("pending.enterChat")}
              </a>
            )}
          </>
        )}
      </div>
    </main>
  );
}
