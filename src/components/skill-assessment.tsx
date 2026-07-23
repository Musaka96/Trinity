"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating, ScorePill } from "@/components/star-rating";
import { SkillRadar } from "@/components/charts/skill-radar";
import { useData } from "@/lib/store";
import {
  ChatterRating,
  RATING_CRITERIA,
  RATING_GROUPS,
  emptyRating,
  groupScore,
  overallScore,
  ratedCount,
  scoreColor,
} from "@/lib/ratings";

const inputCls =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]";

export function SkillAssessment({ chatterId, chatterName }: { chatterId: string; chatterName: string }) {
  const { ratings, setRating } = useData();
  const stored = ratings[chatterId];

  const [draft, setDraft] = React.useState<ChatterRating>(stored ?? emptyRating(chatterId));
  const [saved, setSaved] = React.useState(false);
  const dirty = React.useRef(false);

  // Adopt stored values until the user starts editing.
  React.useEffect(() => {
    if (!dirty.current) setDraft(stored ?? emptyRating(chatterId));
  }, [stored, chatterId]);

  const setScore = (id: string, v: number) => {
    dirty.current = true;
    setSaved(false);
    setDraft((d) => ({ ...d, chatterId, scores: { ...d.scores, [id]: v } }));
  };

  const save = async () => {
    await setRating({ ...draft, chatterId });
    dirty.current = false;
    setSaved(true);
  };

  const overall = overallScore(draft);
  const rated = ratedCount(draft);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div>
            <CardTitle>Skill assessment</CardTitle>
            <CardDescription>
              Your rating of {chatterName} — {rated}/{RATING_CRITERIA.length} rated
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-good">Saved</span>}
            <Button size="sm" onClick={save} disabled={!dirty.current}>
              <Save className="size-4" />
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {RATING_GROUPS.map((group) => (
            <div key={group}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{group}</p>
                {groupScore(draft, group) !== null && (
                  <span
                    className="text-xs font-medium tabular"
                    style={{ color: scoreColor(groupScore(draft, group)!) }}
                  >
                    {groupScore(draft, group)!.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {RATING_CRITERIA.filter((c) => c.group === group).map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2/60"
                  >
                    <div className="min-w-[160px] flex-1">
                      <p className="text-sm text-primary">{c.label}</p>
                      <p className="text-[11px] text-muted">{c.hint}</p>
                    </div>
                    <StarRating
                      value={draft.scores[c.id] ?? 0}
                      onChange={(v) => setScore(c.id, v)}
                      size={16}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-secondary">Notes</span>
            <textarea
              rows={3}
              className={inputCls}
              placeholder="Context, coaching points, things to watch…"
              value={draft.notes ?? ""}
              onChange={(e) => {
                dirty.current = true;
                setSaved(false);
                setDraft((d) => ({ ...d, notes: e.target.value }));
              }}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Skill profile</CardTitle>
            <CardDescription>All 12 criteria at a glance</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2 pt-0">
          <div className="flex flex-col items-center py-2">
            <span className="text-4xl font-semibold tracking-tight tabular" style={{ color: overall ? scoreColor(overall) : "var(--text-muted)" }}>
              {overall !== null ? overall.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-muted">overall out of 10</span>
            <div className="mt-2">
              <ScorePill score={overall} color={overall ? scoreColor(overall) : undefined} />
            </div>
          </div>
          <SkillRadar rating={draft} />
          {draft.updatedAt && (
            <p className="text-[11px] text-muted">
              Last saved {new Date(draft.updatedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
