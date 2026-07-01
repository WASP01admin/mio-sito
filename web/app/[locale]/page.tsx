import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("HomePage");

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 text-center sm:p-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <p className="mt-2 text-sm text-gray-600 sm:text-base">
        {t("placeholder")}
      </p>
    </main>
  );
}
