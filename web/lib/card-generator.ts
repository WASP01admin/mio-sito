// WASP Card number generator
// Format: ITA1258ABC12
// 7 digits (3-digit country code + 4-digit association number) + 5-digit random alphanumeric

export function generateCardNumber(associationCode: string): string {
  if (!associationCode || associationCode.length !== 7) {
    throw new Error("Association code must be exactly 7 digits (e.g., ITA1258)");
  }

  // Generate 5-digit random alphanumeric (letters and numbers)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${associationCode}${randomPart}`;
}

// Calculate card expiration (1 year from now)
export function calculateCardExpiration(issuedAt: Date = new Date()): Date {
  const expiresAt = new Date(issuedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  return expiresAt;
}

// Validate card number format
export function isValidCardNumber(cardNumber: string): boolean {
  const pattern = /^[A-Z]{3}\d{4}[A-Z0-9]{5}$/;
  return pattern.test(cardNumber);
}

// Check if card is expired
export function isCardExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
