import Link from "next/link";
import WalletButtons from "@/components/business-cards/WalletButtons";

export default async function BusinessCardVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ cardId?: string }>;
}) {
  const params = await searchParams;
  const cardId = params.cardId || null;

  if (!cardId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md rounded-lg bg-white text-center">
          <p className="text-red-600">Card ID not found</p>
          <Link href="/" className="text-blue-600 underline">
            Torna alla Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-lg bg-white text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-black">Perfetto!</h1>
        <p className="mt-2 text-lg font-semibold text-green-600">
          La tua WASP CARD di Amico degli Animali è attiva
        </p>

        {/* Card Details */}
        <div className="mt-8 rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
          <p className="text-xs text-gray-600">Numero Card</p>
          <p className="mt-1 font-mono text-xl font-bold text-black">{cardId}</p>
        </div>

        {/* Wallet Options */}
        <WalletButtons cardId={cardId} />

        {/* Instructions */}
        <div className="mt-8 space-y-4 text-left">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-900">✓ Cosa fare ora</h3>
            <ul className="mt-2 space-y-2 text-sm text-blue-800">
              <li>
                • La tua card è attiva e pronta all'uso
              </li>
              <li>
                • Potrai ora rispondere ai messaggi sulla mappa Amici degli Animali
              </li>
              <li>
                • Il nostro team revisionerà la tua richiesta e potrebbe contattarti per ulteriori informazioni
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4">
            <h3 className="font-semibold text-yellow-900">
              ⚠️ Una sola card per telefono
            </h3>
            <p className="mt-2 text-sm text-yellow-800">
              Se hai già una WASP CARD personale su questo telefono, sarà sostituita con questa card di Amico degli Animali. Se vuoi mantenere entrambe, usa 2 telefoni diversi.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="rounded-md bg-black px-6 py-3 font-bold text-white hover:bg-black/80 text-center"
          >
            Torna alla Home
          </Link>
          <Link
            href="/maps/donors"
            className="rounded-md border-2 border-black px-6 py-3 font-bold text-black hover:bg-gray-100 text-center"
          >
            Vai alla Mappa Amici degli Animali
          </Link>
        </div>
      </div>
    </main>
  );
}
