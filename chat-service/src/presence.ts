// In-memory presence tracking (single-process; fine at this scale). Not
// persisted -- presence resets on service restart, which is correct
// behavior (nobody's actually connected right after a restart anyway).
const channelMembers = new Map<string, Map<string, string>>(); // channelId -> (socketId -> nickname)
const socketChannels = new Map<string, Set<string>>(); // socketId -> set of channelIds

export function joinChannelPresence(
  channelId: string,
  socketId: string,
  nickname: string
): void {
  if (!channelMembers.has(channelId)) channelMembers.set(channelId, new Map());
  channelMembers.get(channelId)!.set(socketId, nickname);

  if (!socketChannels.has(socketId)) socketChannels.set(socketId, new Set());
  socketChannels.get(socketId)!.add(channelId);
}

export function getChannelNicknames(channelId: string): string[] {
  const members = channelMembers.get(channelId);
  if (!members) return [];
  return Array.from(new Set(members.values())).sort();
}

// Returns the channelIds the socket was part of, so the caller can
// broadcast an updated presence list to each of them.
export function leaveAllChannels(socketId: string): string[] {
  const channels = socketChannels.get(socketId);
  socketChannels.delete(socketId);
  if (!channels) return [];
  for (const channelId of channels) {
    channelMembers.get(channelId)?.delete(socketId);
  }
  return Array.from(channels);
}
