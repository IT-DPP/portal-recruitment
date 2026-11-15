/**
 * Helper utility for generating SEO-friendly and human-readable URL slugs
 */

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // split accented characters into their base chars and diacritical marks
    .replace(/[\u0300-\u036f]/g, "") // remove all accent marks
    .replace(/&/g, "-and-") // replace & with 'and'
    .replace(/[^\w\s-]/g, "") // remove non-alphanumeric chars except space and hyphen
    .trim()
    .replace(/[\s_-]+/g, "-") // collapse whitespace, underscores and repeated dashes into single hyphen
    .replace(/^-+|-+$/g, ""); // trim leading and trailing hyphens
}

export function generateJobSlug(position: string, customer: string, suffix?: string | number): string {
  const cleanPos = slugify(position) || "posisi";
  const cleanCust = slugify(customer) || "dpp";
  const base = `${cleanPos}-at-${cleanCust}`;
  return suffix !== undefined && suffix !== "" ? `${base}-${suffix}` : base;
}
