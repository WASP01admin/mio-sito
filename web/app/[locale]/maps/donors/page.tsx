import { cookies } from "next/headers";
import { verifyChatSessionToken } from "@wasp/shared";
import { CHAT_SESSION_COOKIE, chatAuthSecret } from "@/lib/chat";
import { Link } from "@/i18n/navigation";
import MapView from "@/components/maps/MapView";

export default async function DonorsMapsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHAT_SESSION_COOKIE)?.value;
  const payload = verifyChatSessionToken(token, chatAuthSecret());
  const isAuthenticated = !!payload;

  return (
    <main className="flex h-screen flex-col bg-white">
      <div className="border-b border-gray-200 bg-gray-50 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Amici degli Animali</h1>
          <p className="text-sm text-gray-600">
            🟠 Regular supporters  |  🔴 Super friends with special treatment for WASP cardholders
          </p>
        </div>
        <Link
          href="/business-card-signup"
          className="rounded-md bg-black px-4 py-2 text-sm font-bold text-white hover:bg-black/80 whitespace-nowrap"
        >
          Richiedi WASP CARD
        </Link>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full rounded-lg border border-gray-200 bg-white p-4">
          <MapView type="donor" isAuthenticated={isAuthenticated} />
        </div>
      </div>

      {!isAuthenticated && (
        <div className="border-t border-gray-200 bg-blue-50 p-3 text-center text-sm text-gray-700">
          <a href="/chat" className="font-semibold text-blue-600 hover:underline">
            Sign in with WASP Card
          </a>
          {" "} to interact with markers
        </div>
      )}
    </main>
  );
}
