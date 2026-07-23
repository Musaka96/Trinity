"use client";

import * as React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { RATING_CRITERIA, RATING_MAX, ChatterRating } from "@/lib/ratings";

/** Short axis labels so 12 spokes stay legible. */
const SHORT: Record<string, string> = {
  pressure: "Pressure",
  recovery: "Recovery",
  whale: "Whales",
  adaptability: "Adapt",
  conversation: "Convo",
  notes: "Notes",
  decision: "Decisions",
  independence: "Independent",
  communication: "Comms",
  collaboration: "Team",
  ownership: "Ownership",
  compliance: "Compliance",
};

export function SkillRadar({ rating }: { rating: ChatterRating | undefined }) {
  const data = RATING_CRITERIA.map((c) => ({
    axis: SHORT[c.id] ?? c.label,
    label: c.label,
    score: rating?.scores[c.id] ?? 0,
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--grid)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, RATING_MAX]} tick={false} axisLine={false} />
          <Tooltip
            content={({ active, payload }) => (
              <ChartTooltip
                active={active}
                label={payload?.[0]?.payload?.label}
                entries={(payload ?? []).map((p) => ({
                  name: "Score",
                  value: p.value as number,
                  color: "var(--accent)",
                }))}
                formatValue={(n) => (n > 0 ? `${n.toFixed(1)} / 10` : "Not rated")}
              />
            )}
          />
          <Radar
            dataKey="score"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="var(--accent)"
            fillOpacity={0.22}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
