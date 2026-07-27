"use client";

import { useRouter } from "@/i18n/navigation";
import BusinessCardSignupForm from "@/components/business-cards/BusinessCardSignupForm";

export default function BusinessCardSignupPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black">
            Richiedi la tua WASP CARD
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            di Amico degli Animali
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            Entra a far parte della comunità di attività che supportano gli animali. Con la WASP CARD potrai rispondere ai messaggi degli utenti sulla mappa Amici degli Animali e godere di tanti altri vantaggi.
          </p>
        </div>

        <BusinessCardSignupForm onClose={() => router.back()} />

        <div className="mt-6 border-t border-gray-200 pt-6">
          <button
            onClick={() => router.back()}
            className="w-full text-center text-sm text-gray-600 hover:text-gray-900 underline"
          >
            ← Torna alla mappa
          </button>
        </div>
      </div>
    </main>
  );
}
