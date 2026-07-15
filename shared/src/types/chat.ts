// Curated set only -- keeps the picker simple and stops arbitrary strings
// being smuggled in through the reaction field.
export const ALLOWED_REACTION_EMOJIS: string[] = ["❤️", "🐾", "😂", "👍", "😢", "🎉"];

export interface ChatChannel {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export interface ChatReactionSummary {
  emoji: string;
  userProfileIds: string[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userProfileId: string;
  nickname: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  reactions: ChatReactionSummary[];
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  senderNickname: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface DirectConversation {
  userId: string;
  nickname: string;
  lastMessage: string;
  lastMessageAt: string;
  isUnread: boolean;
}

// Socket.io event contracts shared between chat-service and the web client.
export interface ServerToClientEvents {
  channelList: (channels: ChatChannel[]) => void;
  channelHistory: (payload: { channelId: string; messages: ChatMessage[] }) => void;
  newMessage: (message: ChatMessage) => void;
  messageDeleted: (payload: { channelId: string; messageId: string }) => void;
  channelCreated: (channel: ChatChannel) => void;
  errorMessage: (message: string) => void;
  globalOnlineCount: (count: number) => void;
  channelPresence: (payload: { channelId: string; nicknames: string[] }) => void;
  userTyping: (payload: { channelId: string; nickname: string }) => void;
  reactionsUpdated: (payload: {
    channelId: string;
    messageId: string;
    reactions: ChatReactionSummary[];
  }) => void;

  // Direct Messages
  directMessageReceived: (message: DirectMessage) => void;
  directMessageHistory: (payload: { messages: DirectMessage[] }) => void;
  directConversationsList: (payload: { conversations: DirectConversation[] }) => void;
  directMessageDeleted: (payload: { messageId: string }) => void;

  // User Blocking
  userBlocked: (payload: { userId: string; nickname: string }) => void;
  userUnblocked: (payload: { userId: string; nickname: string }) => void;
}

export interface ClientToServerEvents {
  joinChannel: (channelId: string) => void;
  sendMessage: (payload: { channelId: string; body: string; imagePath?: string }) => void;
  deleteOwnMessage: (payload: { channelId: string; messageId: string }) => void;
  createChannel: (payload: { slug: string; name: string; description?: string }) => void;
  typing: (channelId: string) => void;
  toggleReaction: (payload: { channelId: string; messageId: string; emoji: string }) => void;
  reportMessage: (payload: { channelId: string; messageId: string }) => void;

  // Direct Messages
  sendDirectMessage: (payload: { recipientId: string; body: string; imagePath?: string }) => void;
  startDirectConversation: (payload: { userId: string | null }) => void;
  deleteDirectMessage: (payload: { messageId: string }) => void;

  // User Blocking
  blockUser: (payload: { userId: string; reason?: string }) => void;
  unblockUser: (payload: { userId: string }) => void;
}
