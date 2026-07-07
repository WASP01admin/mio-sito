import { cookies } from "next/headers";
import { verifyChatSessionToken } from "";
import { CHAT_SESSION_COOKIE, chatAuthSecret } from "@/lib/chat";
import ChatRoom from "@/components/chat/ChatRoom";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHAT_SESSION_COOKIE)?.value;
  const payload = verifyChatSessionToken(token, chatAuthSecret());

  if (!payload || !token) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-bold text-wasp-yellow">Access denied</h1>
        <p className="mt-2 max-w-sm text-sm text-gray-400">
          This chat is only reachable via the link on your own WASP Card. If
          you have a card, open it and tap the chat link on the back.
        </p>
      </main>
    );
  }

  return (
    <ChatRoom
      token={token}
      nickname={payload.nickname}
      userProfileId={payload.userProfileId}
    />
  );
}
