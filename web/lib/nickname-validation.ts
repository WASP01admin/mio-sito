import { containsBlockedWord } from "";

const MIN_LENGTH = 2;
const MAX_LENGTH = 20; // Kept short so it also works as an IRC handle.
const MIN_ALPHANUMERIC = 2;

export type NicknameValidationResult =
  | { valid: true; value: string }
  | { valid: false; error: "too_short" | "too_long" | "too_many_symbols" | "inappropriate" };

export function validateNickname(raw: string): NicknameValidationResult {
  const value = raw.trim();

  if (value.length < MIN_LENGTH) {
    return { valid: false, error: "too_short" };
  }
  if (value.length > MAX_LENGTH) {
    return { valid: false, error: "too_long" };
  }

  const alphanumericCount = (value.match(/[\p{L}\p{N}]/gu) ?? []).length;
  if (alphanumericCount < MIN_ALPHANUMERIC) {
    return { valid: false, error: "too_many_symbols" };
  }

  if (containsBlockedWord(value)) {
    return { valid: false, error: "inappropriate" };
  }

  return { valid: true, value };
}

export const NICKNAME_MAX_LENGTH = MAX_LENGTH;
