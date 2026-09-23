/** "Café Ñame" → "cafe name": what both the app and the database compare. */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Every word of the query appears somewhere in the fields (accents and case ignored). */
export function matches(query: string | undefined, ...fields: string[]): boolean {
  if (!query?.trim()) return true;
  const haystack = fold(fields.join(" "));
  return fold(query).split(/\s+/).filter(Boolean).every((word) => haystack.includes(word));
}

/**
 * Turns what someone typed into a Postgres full-text query where every word
 * is a prefix, so "tomat" already finds "tomates". Only letters and digits
 * survive, which keeps tsquery syntax out of user input. Null when nothing
 * searchable is left.
 */
export function toPrefixQuery(query: string): string | null {
  const words = fold(query).match(/[a-z0-9]+/g)?.slice(0, 8);
  return words?.length ? words.map((w) => `${w}:*`).join(" & ") : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Real rows have UUIDs; example content uses short ids like "p3" or "s1". */
export function isUuid(id: string | undefined): id is string {
  return typeof id === "string" && UUID.test(id);
}
