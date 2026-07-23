"use client";

import * as React from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/lib/store";
import { availableDates } from "@/lib/analytics";
import { EVENT_META, EVENT_TYPES, EventType, TrinityEvent } from "@/lib/events";
import { ShiftId } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const inputCls =
  "h-9 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-primary placeholder:text-muted focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]";

interface Draft {
  id?: string;
  type: EventType;
  title: string;
  note: string;
  date: string;
  endDate: string;
  modelId: string;
  chatterId: string;
  shift: string;
}

function emptyDraft(defaultDate: string): Draft {
  return { type: "promotion", title: "", note: "", date: defaultDate, endDate: "", modelId: "", chatterId: "", shift: "" };
}

export default function EventsPage() {
  const { dataset, chatters, models, events, addEvent, updateEvent, deleteEvent } = useData();
  const dates = availableDates(dataset.rows);
  const defaultDate = dates[dates.length - 1] ?? new Date().toISOString().slice(0, 10);

  const [draft, setDraft] = React.useState<Draft>(() => emptyDraft(defaultDate));
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => {
    if (!editing && !draft.date) setDraft(emptyDraft(defaultDate));
  }, [defaultDate, editing, draft.date]);

  function startEdit(ev: TrinityEvent) {
    setEditing(true);
    setDraft({
      id: ev.id,
      type: ev.type,
      title: ev.title,
      note: ev.note ?? "",
      date: ev.date,
      endDate: ev.endDate ?? "",
      modelId: ev.modelId ?? "",
      chatterId: ev.chatterId ?? "",
      shift: ev.shift ?? "",
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancel() {
    setEditing(false);
    setDraft(emptyDraft(defaultDate));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || !draft.date) return;
    const payload = {
      type: draft.type,
      title: draft.title.trim(),
      note: draft.note.trim() || undefined,
      date: draft.date,
      endDate: draft.endDate || undefined,
      modelId: draft.modelId || undefined,
      chatterId: draft.chatterId || undefined,
      shift: (draft.shift || undefined) as ShiftId | undefined,
    };
    if (editing && draft.id) {
      const original = events.find((x) => x.id === draft.id);
      updateEvent({ ...payload, id: draft.id, createdAt: original?.createdAt ?? new Date().toISOString() });
    } else {
      addEvent(payload);
    }
    cancel();
  }

  return (
    <div>
      <PageHeader
        title="Events"
        description="Tag promotions, takeovers, bad days, holidays and notes. They surface everywhere the numbers appear."
      >
        <Badge variant="neutral">{events.length} events</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{editing ? "Edit event" : "New event"}</CardTitle>
              <CardDescription>Leave a scope blank to apply to everything</CardDescription>
            </div>
            {editing && (
              <Button variant="ghost" size="icon" onClick={cancel} aria-label="Cancel edit">
                <X className="size-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <Field label="Type">
                <div className="flex flex-wrap gap-1.5">
                  {EVENT_TYPES.map((tp) => {
                    const meta = EVENT_META[tp];
                    const active = draft.type === tp;
                    return (
                      <button
                        type="button"
                        key={tp}
                        onClick={() => setDraft((d) => ({ ...d, type: tp }))}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          active ? "border-transparent bg-accent text-white" : "border-border text-secondary hover:bg-surface-2"
                        }`}
                      >
                        <span>{meta.emoji}</span>
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Title">
                <input
                  className={inputCls}
                  placeholder="e.g. Weekend PPV promo"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date">
                  <input
                    type="date"
                    className={inputCls}
                    value={draft.date}
                    onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  />
                </Field>
                <Field label="End date (optional)">
                  <input
                    type="date"
                    className={inputCls}
                    value={draft.endDate}
                    onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label="Model (optional)">
                <select className={inputCls} value={draft.modelId} onChange={(e) => setDraft((d) => ({ ...d, modelId: e.target.value }))}>
                  <option value="">All models</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Chatter (optional)">
                  <select
                    className={inputCls}
                    value={draft.chatterId}
                    onChange={(e) => setDraft((d) => ({ ...d, chatterId: e.target.value }))}
                  >
                    <option value="">All chatters</option>
                    {chatters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Shift (optional)">
                  <select className={inputCls} value={draft.shift} onChange={(e) => setDraft((d) => ({ ...d, shift: e.target.value }))}>
                    <option value="">All shifts</option>
                    <option value="morning">Morning (04–12)</option>
                    <option value="afternoon">Afternoon (12–20)</option>
                    <option value="night">Night (20–04)</option>
                    <option value="full">Full day</option>
                  </select>
                </Field>
              </div>

              <Field label="Note (optional)">
                <textarea
                  className={`${inputCls} h-auto py-2`}
                  rows={2}
                  placeholder="Extra context…"
                  value={draft.note}
                  onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                />
              </Field>

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={!draft.title.trim() || !draft.date}>
                  <Plus className="size-4" />
                  {editing ? "Save changes" : "Add event"}
                </Button>
                {editing && (
                  <Button type="button" variant="ghost" onClick={cancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>All events</CardTitle>
              <CardDescription>Newest first</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {events.length === 0 ? (
              <p className="px-2 py-12 text-center text-sm text-muted">
                No events yet. Add your first one to annotate the data.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {events.map((ev) => {
                  const meta = EVENT_META[ev.type];
                  const scopeParts: string[] = [];
                  if (ev.modelId) scopeParts.push(models.find((m) => m.id === ev.modelId)?.name ?? ev.modelId);
                  if (ev.chatterId) scopeParts.push(chatters.find((c) => c.id === ev.chatterId)?.name ?? ev.chatterId);
                  if (ev.shift) scopeParts.push(ev.shift);
                  return (
                    <li key={ev.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface-2/40 p-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-base">
                        {meta.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-primary">{ev.title}</p>
                          <Badge variant={meta.badge}>{meta.label}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {ev.endDate && ev.endDate !== ev.date
                            ? `${formatDate(ev.date)} – ${formatDate(ev.endDate)}`
                            : formatDate(ev.date)}
                          {scopeParts.length ? ` · ${scopeParts.join(" · ")}` : " · All models"}
                        </p>
                        {ev.note && <p className="mt-1 text-xs text-secondary">{ev.note}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(ev)} aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteEvent(ev.id)} aria-label="Delete">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-secondary">{label}</span>
      {children}
    </label>
  );
}
