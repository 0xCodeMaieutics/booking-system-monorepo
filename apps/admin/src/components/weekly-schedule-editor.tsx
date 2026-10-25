"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatMinute, parseMinute } from "@visita/booking/time";
import { Button, Input } from "@visita/ui";
import { useState } from "react";

import { weekdayLabel } from "@/lib/labels";
import { useTRPC } from "@/trpc/client";

import { errorMessage } from "./errors";

type Range = { key: string; weekday: number; start: string; end: string };

export function WeeklyScheduleEditor({
  practitionerId,
  ranges: initial,
}: {
  practitionerId: string;
  ranges: { weekday: number; startMinute: number; endMinute: number }[];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [ranges, setRanges] = useState<Range[]>(() =>
    initial.map((r) => ({
      key: crypto.randomUUID(),
      weekday: r.weekday,
      start: formatMinute(r.startMinute),
      end: formatMinute(r.endMinute),
    })),
  );
  const save = useMutation(
    trpc.practitioners.setWeeklySchedule.mutationOptions({
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.practitioners.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.attention.pathKey() }),
        ]),
    }),
  );

  const update = (index: number, patch: Partial<Range>) =>
    setRanges((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5, 6, 7].map((weekday) => (
        <div key={weekday} className="flex flex-wrap items-center gap-2 border-b border-ink/5 pb-3">
          <span className="w-28 text-sm font-medium">{weekdayLabel[weekday]}</span>
          {ranges.every((r) => r.weekday !== weekday) && (
            <span className="text-sm text-ink-soft">არ მუშაობს</span>
          )}
          {ranges.map((r, i) =>
            r.weekday !== weekday ? null : (
              <span key={r.key} className="flex items-center gap-1">
                <Input
                  type="time"
                  step={900}
                  value={r.start}
                  onChange={(e) => update(i, { start: e.target.value })}
                  className="h-9 w-28"
                />
                –
                <Input
                  type="time"
                  step={900}
                  value={r.end}
                  onChange={(e) => update(i, { end: e.target.value })}
                  className="h-9 w-28"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRanges((rs) => rs.filter((_, j) => j !== i))}
                  aria-label="წაშლა"
                >
                  ×
                </Button>
              </span>
            ),
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setRanges((rs) => [...rs, { key: crypto.randomUUID(), weekday, start: "09:00", end: "18:00" }])
            }
          >
            + დიაპაზონი
          </Button>
        </div>
      ))}
      <p className="text-xs text-ink-soft">
        შესვენებისთვის დაამატეთ ორი დიაპაზონი, მაგ. 09:00–13:00 და 14:00–18:00.
      </p>
      {save.error && <p className="text-sm text-danger">{errorMessage(save.error)}</p>}
      {save.isSuccess && <p className="text-sm text-success">შენახულია. არსებული ვიზიტები არ შეცვლილა.</p>}
      <Button
        className="self-start"
        disabled={save.isPending}
        onClick={() =>
          save.mutate({
            id: practitionerId,
            ranges: ranges.map((r) => ({
              weekday: r.weekday,
              startMinute: parseMinute(r.start),
              endMinute: r.end === "00:00" ? 1440 : parseMinute(r.end),
            })),
          })
        }
      >
        განრიგის შენახვა
      </Button>
    </div>
  );
}
