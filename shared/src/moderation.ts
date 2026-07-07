// Deliberately short and English-only -- this is a first-pass filter to
// block the laziest trolling, not a comprehensive solution. Anything more
// robust belongs in manual admin review (Members -> Edit, or Chat Moderation).
const BLOCKED_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "faggot",
  "retard",
  "whore",
  "slut",
  "rape",
  "nazi",
  "hitler",
];

export function containsBlockedWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}
