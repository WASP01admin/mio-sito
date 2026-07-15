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
                  <i className="fab fa-apple text-2xl text-white"></i>
                </div>
                <span className="text-xs font-semibold">Apple Wallet</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-500">
                  <i className="fab fa-google text-2xl text-white"></i>
                </div>
                <span className="text-xs font-semibold">Google Wallet</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-600">
                  <i className="fas fa-wallet text-2xl text-white"></i>
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
