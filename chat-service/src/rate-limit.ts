interface RateLimiter {
  isLimited(socketId: string): boolean;
  clear(socketId: string): void;
}

function createRateLimiter(windowMs: number, maxEvents: number): RateLimiter {
  const history = new Map<string, number[]>();

  return {
    isLimited(socketId: string): boolean {
      const now = Date.now();
      const timestamps = (history.get(socketId) ?? []).filter((t) => now - t < windowMs);
      timestamps.push(now);
      history.set(socketId, timestamps);
      return timestamps.length > maxEvents;
    },
    clear(socketId: string): void {
      history.delete(socketId);
    },
  };
}

const messageLimiter = createRateLimiter(3000, 5);
// Channel creation is rarer and heavier than sending a message -- much
// stricter window so someone can't flood-create junk channels.
const channelCreationLimiter = createRateLimiter(10 * 60 * 1000, 3);

export function isRateLimited(socketId: string): boolean {
  return messageLimiter.isLimited(socketId);
}

export function isChannelCreationRateLimited(socketId: string): boolean {
  return channelCreationLimiter.isLimited(socketId);
}

export function clearRateLimit(socketId: string): void {
  messageLimiter.clear(socketId);
  channelCreationLimiter.clear(socketId);
}
