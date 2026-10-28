import { describe, expect, it } from "vitest";

import { maskPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["599 44 64 50", "+995599446450"],
    ["+995 599 44 64 50", "+995599446450"],
    ["995599446450", "+995599446450"],
    ["00995599446450", "+995599446450"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["32 2 123456", "12345", "+995 322 123456", "+49 151 23456789", "0049 151 2345678"])(
    "rejects %s",
    (input) => {
      expect(() => normalizePhone(input)).toThrow("INVALID_PHONE");
    },
  );
});

describe("maskPhone", () => {
  it("keeps the first and last digits", () => {
    expect(maskPhone("+995599446450")).toBe("+995 5•• ••• 450");
  });
});
