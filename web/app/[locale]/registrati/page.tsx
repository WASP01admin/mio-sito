import { headers } from "next/headers";
import { userAgent } from "next/server";
import { getTranslations } from "next-intl/server";
import DirectMembershipForm from "@/components/registrati/DirectMembershipForm";

export default async function RegisterPage() {
  const t = await getTranslations("RegisterPage");
  const { device } = userAgent({ headers: await headers() });
  const isMobile = device.type === "mobile";

  return (
    <main className="flex flex-1 flex-col bg-white/90 px-4 py-16 sm:px-8">
      <h1 className="text-center text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <div className="mt-10">
        <DirectMembershipForm isMobile={isMobile} />
      </div>
    </main>
  );
}
