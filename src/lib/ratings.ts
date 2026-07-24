/**
 * Manual skill assessment for chatters — the human judgement that sales
 * numbers can't capture. Each criterion is scored 1–10 as a float
 * (half-star steps in the UI); 0 or missing means "not rated yet".
 */

export interface RatingCriterion {
  id: string;
  label: string;
  group: "Chatting skill" | "Professionalism";
  hint: string;
}

export const RATING_CRITERIA: RatingCriterion[] = [
  { id: "pressure", label: "Pressure Handling", group: "Chatting skill", hint: "Holds up during busy shifts and demanding fans" },
  { id: "recovery", label: "Recovery", group: "Chatting skill", hint: "Turns around a cold or damaged conversation" },
  { id: "whale", label: "Whale Handling", group: "Chatting skill", hint: "Builds and protects high-value spenders" },
  { id: "adaptability", label: "Adaptability", group: "Chatting skill", hint: "Adjusts tone and approach per model and fan" },
  { id: "conversation", label: "Conversation Quality", group: "Chatting skill", hint: "Natural, engaging, on-persona writing" },
  { id: "notes", label: "Notes Discipline", group: "Chatting skill", hint: "Keeps fan notes accurate and useful for the next shift" },
  { id: "decision", label: "Decision Making", group: "Professionalism", hint: "Good judgement on pricing, timing and escalation" },
  { id: "independence", label: "Independence", group: "Professionalism", hint: "Works without hand-holding" },
  { id: "communication", label: "Communication", group: "Professionalism", hint: "Clear, timely updates to the team" },
  { id: "collaboration", label: "Team Collaboration", group: "Professionalism", hint: "Hands over shifts well and supports others" },
  { id: "ownership", label: "Ownership", group: "Professionalism", hint: "Takes responsibility for results and mistakes" },
  { id: "compliance", label: "Rule/TOS Compliance", group: "Professionalism", hint: "Follows agency rules and platform terms" },
];

export const RATING_GROUPS = ["Chatting skill", "Professionalism"] as const;

export interface ChatterRating {
  chatterId: string;
  /** criterionId -> 0..10 (0 = unrated) */
  scores: Record<string, number>;
  notes?: string;
  updatedAt: string;
}

export const RATING_MAX = 5;

/** Guards against values saved under an older scale by clamping into range. */
export function normalizeRating(rating: ChatterRating): ChatterRating {
  const scores: Record<string, number> = {};
  for (const [k, v] of Object.entries(rating.scores ?? {})) {
    if (typeof v === "number" && v > 0) scores[k] = Math.min(RATING_MAX, v);
  }
  return { ...rating, scores };
}

/** settings key used for per-chatter persistence (one row per chatter). */
export const ratingKey = (chatterId: string) => `rating:${chatterId}`;
export const isRatingKey = (key: string) => key.startsWith("rating:");
export const chatterIdFromRatingKey = (key: string) => key.slice("rating:".length);

export function emptyRating(chatterId: string): ChatterRating {
  return { chatterId, scores: {}, notes: "", updatedAt: "" };
}

/** Mean of the rated criteria only, so partial assessments still read sensibly. */
export function overallScore(rating: ChatterRating | undefined): number | null {
  if (!rating) return null;
  const vals = RATING_CRITERIA.map((c) => rating.scores[c.id]).filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function groupScore(rating: ChatterRating | undefined, group: string): number | null {
  if (!rating) return null;
  const vals = RATING_CRITERIA.filter((c) => c.group === group)
    .map((c) => rating.scores[c.id])
    .filter((v): v is number => typeof v === "number" && v > 0);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function ratedCount(rating: ChatterRating | undefined): number {
  if (!rating) return 0;
  return RATING_CRITERIA.filter((c) => (rating.scores[c.id] ?? 0) > 0).length;
}

/** Colour for a score on the 1–5 scale, matching the status palette. */
export function scoreColor(score: number): string {
  if (score >= 4) return "var(--good)";
  if (score >= 3) return "var(--accent)";
  if (score >= 2) return "var(--warning)";
  return "var(--critical)";
}
