// Initial registration categories. Coordinate changes with database validation.
// Existing legacy categories remain readable until explicitly migrated.
export const CLUB_CATEGORIES = [
  "Governance & Leadership",
  "Academic & Professional",
  "Sports & Recreation",
  "Arts & Culture",
  "Community & Welfare",
  "Special Interest & Others",
] as const;

export type ClubCategory = (typeof CLUB_CATEGORIES)[number];

export function isClubCategory(value: unknown): value is ClubCategory {
  return typeof value === "string" && CLUB_CATEGORIES.some(category => category === value);
}
