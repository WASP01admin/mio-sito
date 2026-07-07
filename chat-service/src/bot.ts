import type { Server } from "socket.io";
import type { ChatChannel, ChatMessage, ClientToServerEvents, ServerToClientEvents } from "@wasp/shared";
import type { AuthedSocketData } from "./auth";
import { insertMessage, listChannels } from "./channels";
import { getChannelNicknames, joinChannelPresence } from "./presence";

// Curated-content bot personas -- not an LLM. Every message posted is pulled
// from the static lists below, nothing generated, nothing pretending to be a
// real person (each nickname's "(A.I.)" tag makes that explicit). All three
// share one underlying account; only the displayed nickname rotates, and
// they aren't tied to a specific channel -- any of them can show up, post,
// or reply anywhere.
const POST_INTERVAL_MS = 3 * 60 * 60 * 1000; // ~3 hours
const POST_INTERVAL_JITTER_MS = 60 * 60 * 1000; // +/- up to 1 hour
const MENTION_COOLDOWN_MS = 60 * 1000;

interface BotPersona {
  nickname: string;
  triggerWord: string;
}

const BOT_PERSONAS: BotPersona[] = [
  { nickname: "FIDO (A.I.) 🐕", triggerWord: "fido" },
  { nickname: "Felix (A.I.) 🐈", triggerWord: "felix" },
  { nickname: "Luna (A.I.) 🐾", triggerWord: "luna" },
];

const FACTS_BY_SLUG: Record<string, string[]> = {
  "dog-life": [
    "Did you know a dog's sense of smell is up to 100,000 times more sensitive than a human's? 🐕",
    "Dogs can learn over 100 words and gestures with consistent, positive training!",
    "Spaying/neutering your dog can add years to their life and helps reduce shelter overpopulation.",
    "A dog's nose print is as unique as a human fingerprint.",
    "Senior shelter dogs are often the calmest, most grateful companions -- consider adopting one!",
    "Regular walks aren't just exercise for dogs -- they're essential mental stimulation too.",
    "Chocolate, grapes, and xylitol are toxic to dogs -- always double check before sharing snacks!",
    "Dogs dream, just like we do -- watch for those twitching paws during a nap.",
  ],
  "cats-9-lives": [
    "Cats spend around 70% of their lives asleep -- that's up to 16 hours a day!",
    "A cat's purr can operate at a frequency associated with promoting bone healing.",
    "Indoor cats can live 2-3x longer than outdoor cats on average.",
    "Cats have a third eyelid, sometimes called a 'haw', that helps protect their eyes.",
    "Spayed/neutered cats tend to be healthier and less likely to roam into danger.",
    "Cats lack the taste receptor for sweetness -- they simply can't taste sugar.",
    "Slow blinking at your cat is basically a kitty 'I love you.' Try it!",
    "Black cats are statistically among the hardest to get adopted -- give them a chance.",
  ],
  love4animals: [
    "Every small act of kindness -- a donation, a shared post, an adoption -- adds up to real change for animals.",
    "Farm animals, wildlife, and companion animals all deserve compassion, not just the ones we find cute.",
    "Supporting local shelters and rescues is one of the most direct ways to help animals in your own community.",
    "Choosing cruelty-free products is a small daily choice that protects animals used in testing.",
    "Wildlife corridors and habitat protection save far more animals than most people realize.",
    "If you can't adopt, fostering saves just as many lives -- ask your local shelter how to start.",
    "Animals can't advocate for themselves -- that's why every voice in this community matters.",
    "Thank you for being part of a global community that shows up for animals. You matter here. 🐾",
  ],
};

const MENTION_REPLIES = [
  "Hey, I heard my name! 🐾 Just a reminder: I'm an AI, not a real member -- here to keep things lively while you wait for other humans to wander in.",
  "You called? 🐾 Heads up, I'm an AI assistant, not a person -- but I'm always happy to share a random animal fact if you're bored.",
  "🐾 Quick disclosure: I'm an AI, not a real cardholder -- but the fact-sharing offer is genuine if you want one.",
];

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function postFact(
  io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, AuthedSocketData>,
  botUserProfileId: string
) {
  try {
    const channels = await listChannels();
    const withFacts = channels.filter((c) => FACTS_BY_SLUG[c.slug]);
    if (withFacts.length === 0) return;

    const channel = randomFrom(withFacts);
    const fact = randomFrom(FACTS_BY_SLUG[channel.slug]);
    const persona = randomFrom(BOT_PERSONAS);
    const message = await insertMessage(channel.id, botUserProfileId, persona.nickname, fact);
    io.to(channel.id).emit("newMessage", message);
  } catch (error) {
    console.error("Chat bot: failed to post scheduled fact:", error);
  }
}

// Registers all three personas as permanently "online" in a channel. Not
// real sockets -- these fixed keys just give each persona a stable slot in
// the same in-memory presence map real sockets use.
function registerPresenceForChannel(channelId: string): void {
  for (const persona of BOT_PERSONAS) {
    joinChannelPresence(channelId, `bot-presence-${persona.triggerWord}`, persona.nickname);
  }
}

export function startBot(
  io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, AuthedSocketData>
) {
  const envUserProfileId = process.env.BOT_USER_PROFILE_ID;

  if (!envUserProfileId) {
    console.warn("Chat bot: BOT_USER_PROFILE_ID not set, bot disabled.");
    return { maybeReplyToMention: async () => {}, registerPresenceForChannel: () => {} };
  }
  const botUserProfileId: string = envUserProfileId;

  function scheduleNextPost() {
    const delay = POST_INTERVAL_MS + Math.random() * POST_INTERVAL_JITTER_MS;
    setTimeout(async () => {
      await postFact(io, botUserProfileId);
      scheduleNextPost();
    }, delay);
  }
  scheduleNextPost();

  async function registerPresence() {
    try {
      const channels: ChatChannel[] = await listChannels();
      for (const channel of channels) {
        registerPresenceForChannel(channel.id);
        io.to(channel.id).emit("channelPresence", {
          channelId: channel.id,
          nicknames: getChannelNicknames(channel.id),
        });
      }
    } catch (error) {
      console.error("Chat bot: failed to register presence:", error);
    }
  }
  registerPresence();

  // Keyed by channelId + persona, not just channelId -- mentioning Felix
  // shouldn't put Luna and FIDO on cooldown too in the same room.
  const lastReplyByChannelAndPersona = new Map<string, number>();

  async function maybeReplyToMention(message: ChatMessage) {
    if (message.userProfileId === botUserProfileId) return; // never reply to itself

    const lower = message.body.toLowerCase();
    const persona = BOT_PERSONAS.find((p) => new RegExp(`\\b${p.triggerWord}\\b`).test(lower));
    if (!persona) return;

    const cooldownKey = `${message.channelId}:${persona.triggerWord}`;
    const lastReply = lastReplyByChannelAndPersona.get(cooldownKey) ?? 0;
    if (Date.now() - lastReply < MENTION_COOLDOWN_MS) return;
    lastReplyByChannelAndPersona.set(cooldownKey, Date.now());

    try {
      const reply = await insertMessage(
        message.channelId,
        botUserProfileId,
        persona.nickname,
        randomFrom(MENTION_REPLIES)
      );
      io.to(message.channelId).emit("newMessage", reply);
    } catch (error) {
      console.error("Chat bot: failed to reply to mention:", error);
    }
  }

  return { maybeReplyToMention, registerPresenceForChannel };
}
