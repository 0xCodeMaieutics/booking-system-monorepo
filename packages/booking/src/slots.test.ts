import { describe, expect, it } from "vitest";

import { computeAvailableSlots, fitsWeeklySchedule, rankForAnyPractitioner } from "./slots";
import { formatTime, localInstant } from "./time";

// 2026-10-26 is a Monday.
const MONDAY = "2026-10-26";
const morning = { weekday: 1, startMinute: 9 * 60, endMinute: 13 * 60 };
const afternoon = { weekday: 1, startMinute: 14 * 60, endMinute: 18 * 60 };
const at = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return localInstant(MONDAY, h! * 60 + m!);
};

function times(input: Partial<Parameters<typeof computeAvailableSlots>[0]>) {
  return computeAvailableSlots({
    dates: [MONDAY],
    durationMinutes: 45,
    practitioners: [{ id: "anna", ranges: [morning], busy: [] }],
    clinicClosures: [],
    earliest: null,
    latest: null,
    ...input,
  }).map((s) => formatTime(s.startsAt));
}

describe("computeAvailableSlots", () => {
  it("uses a 15-minute grid and keeps Appointments inside the range", () => {
    const result = times({});
    expect(result[0]).toBe("09:00");
    expect(result.at(-1)).toBe("12:15");
    expect(result).toHaveLength(14);
  });

  it("works in Clinic-local time (Asia/Tbilisi, UTC+4)", () => {
    const [first] = computeAvailableSlots({
      dates: [MONDAY],
      durationMinutes: 45,
      practitioners: [{ id: "anna", ranges: [morning], busy: [] }],
      clinicClosures: [],
      earliest: null,
      latest: null,
    });
    expect(first?.startsAt.toISOString()).toBe("2026-10-26T05:00:00.000Z");
  });

  it("skips times overlapping a Booked Appointment", () => {
    const result = times({
      practitioners: [
        { id: "anna", ranges: [morning], busy: [{ startsAt: at("10:00"), endsAt: at("10:30") }] },
      ],
    });
    expect(result).toContain("09:15");
    expect(result).not.toContain("09:30");
    expect(result).not.toContain("10:15");
    expect(result).toContain("10:30");
  });

  it("treats the gap between ranges (lunch) as not bookable", () => {
    const result = times({ practitioners: [{ id: "anna", ranges: [morning, afternoon], busy: [] }] });
    expect(result).not.toContain("12:30");
    expect(result).toContain("14:00");
  });

  it("applies Clinic-wide Time Off to everyone", () => {
    const result = times({ clinicClosures: [{ startsAt: at("00:00"), endsAt: at("23:59") }] });
    expect(result).toEqual([]);
  });

  it("respects the Booking Window", () => {
    expect(times({ earliest: at("11:00"), latest: at("11:30") })).toEqual(["11:00", "11:15", "11:30"]);
  });

  it("returns nothing on days without a Weekly Schedule", () => {
    expect(times({ dates: ["2026-10-27"] })).toEqual([]);
  });
});

describe("fitsWeeklySchedule", () => {
  it("requires the whole Appointment inside one range", () => {
    expect(fitsWeeklySchedule({ startsAt: at("12:30"), endsAt: at("13:00") }, [morning, afternoon])).toBe(
      true,
    );
    expect(fitsWeeklySchedule({ startsAt: at("12:45"), endsAt: at("13:15") }, [morning, afternoon])).toBe(
      false,
    );
  });
});

describe("rankForAnyPractitioner", () => {
  const anna = { id: "anna", sortOrder: 1 };
  const khatuna = { id: "khatuna", sortOrder: 0 };

  it("prefers the Practitioner with fewer Appointments that day", () => {
    expect(rankForAnyPractitioner([khatuna, anna], new Map([["khatuna", 3]]))[0]).toBe(anna);
  });

  it("breaks ties by sort order", () => {
    expect(rankForAnyPractitioner([anna, khatuna], new Map())[0]).toBe(khatuna);
  });
});
