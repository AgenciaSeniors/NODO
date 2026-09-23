/**
 * Accepts Cuban mobiles in any common spelling ("52456789", "+53 5 245 6789",
 * "53-52456789") and international numbers written with a leading "+".
 * Returns a display form, or null when the number can't be a WhatsApp number.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && !digits.startsWith("53")) {
    return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : null;
  }
  if (digits.startsWith("53") && digits.length === 10) digits = digits.slice(2);
  if (digits.length !== 8 || !/^[56]/.test(digits)) return null;
  return `+53 ${digits[0]} ${digits.slice(1, 4)} ${digits.slice(4)}`;
}

/** "+53 5 245 6789" → "+5352456789", the form the database stores. */
export function toE164(input: string): string | null {
  const display = normalizePhone(input);
  return display ? `+${display.replace(/\D/g, "")}` : null;
}
