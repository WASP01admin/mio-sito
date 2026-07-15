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

            <div className="mt-8 flex justify-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-black">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
                    <path d="M17.05 13.5c-.91 0-1.64.54-2.05 1.29-.4-.75-1.14-1.29-2.05-1.29s-1.64.54-2.05 1.29c-.4-.75-1.14-1.29-2.05-1.29-1.66 0-3 1.34-3 3 0 1.66 1.34 3 3 3 .91 0 1.64-.54 2.05-1.29.4.75 1.14 1.29 2.05 1.29s1.64-.54 2.05-1.29c.4.75 1.14 1.29 2.05 1.29 1.66 0 3-1.34 3-3s-1.34-3-3-3M5 6.5C5 4.57 6.57 3 8.5 3S12 4.57 12 6.5c0 1.93-1.57 3.5-3.5 3.5S5 8.43 5 6.5m7 0C12 4.57 13.57 3 15.5 3S19 4.57 19 6.5c0 1.93-1.57 3.5-3.5 3.5S12 8.43 12 6.5Z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Apple Wallet</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-500">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Google Wallet</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-600">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
                    <path d="M18 6H2v12h16m0-14H2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 16H2V4h16v14z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Samsung Wallet</span>
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
