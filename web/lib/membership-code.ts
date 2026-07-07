import "server-only";
import { randomBytes, randomInt } from "crypto";
import { supabaseAdmin } from "./supabase-admin";

// Excludes 0/O/1/I so a code that has to be read aloud or retyped by
// support staff can't be confused between characters.
const SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SUFFIX_LENGTH = 4;
const MAX_ATTEMPTS = 10;

function randomSuffix(): string {
  let out = "";
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    out += SUFFIX_CHARS[randomInt(SUFFIX_CHARS.length)];
  }
  return out;
}

// associationCode + 4-char suffix, e.g. "CAN0041" -> "CAN0041X9F2".
// Retries on collision since the suffix is random, not sequential.
export async function generateUniqueMembershipCode(
  associationCode: string
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = `${associationCode}${randomSuffix()}`;
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("unique_membership_code", candidate)
      .maybeSingle();

    if (error) throw error;
    if (!data) return candidate;
  }

  throw new Error(
    "Could not generate a unique membership code after multiple attempts."
  );
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}
