import { useTranslations } from "next-intl";

export default function MarketAnalysisPage() {
  const t = useTranslations("MarketAnalysisPage");

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white/90 px-4 py-16 text-center sm:px-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
    </main>
  );
}
