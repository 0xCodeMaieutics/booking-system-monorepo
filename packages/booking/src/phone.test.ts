import { describe, expect, it } from "vitest";

import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["599 44 64 50", "+995599446450"],
    ["+995 599 44 64 50", "+995599446450"],
    ["995599446450", "+995599446450"],
    ["00995599446450", "+995599446450"],
    ["+49 151 23456789", "+4915123456789"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["32 2 123456", "12345", "+995 322 123456"])("rejects %s", (input) => {
    expect(() => normalizePhone(input)).toThrow("INVALID_PHONE");
  });
});
