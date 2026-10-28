import { describe, expect, it, vi } from "vitest";

import { maskContact, normalizeEmail } from "./contact";
import type { EmailSender } from "./email";
import { createMessenger, patientMessages } from "./messages";
import type { SmsSender } from "./sms";

function senders({ smsDisabled = false } = {}) {
  const sms = { send: vi.fn<SmsSender["send"]>(async () => {}) };
  const email = { send: vi.fn<EmailSender["send"]>(async () => {}) };
  return { sms, email, messenger: createMessenger({ smsDisabled: async () => smsDisabled, sms, email }) };
}

describe("createMessenger", () => {
  const message = patientMessages.verificationCode("Face", "482113", "en");

  it("texts SMS Patients only the message text", async () => {
    const { sms, email, messenger } = senders();
    await messenger.send({ channel: "sms", phone: "+995599446450" }, message);
    expect(sms.send).toHaveBeenCalledWith("+995599446450", "Face: your code is 482113");
    expect(email.send).not.toHaveBeenCalled();
  });

  it("emails email Patients the same text under a subject", async () => {
    const { sms, email, messenger } = senders();
    await messenger.send({ channel: "email", email: "visitor@example.com" }, message);
    expect(email.send).toHaveBeenCalledWith({
      to: "visitor@example.com",
      subject: "Face: your verification code",
      text: "Face: your code is 482113",
    });
    expect(sms.send).not.toHaveBeenCalled();
  });

  it("emails SMS Patients who gave an email while SMS is switched off", async () => {
    const { sms, email, messenger } = senders({ smsDisabled: true });
    await messenger.send(
      { channel: "sms", phone: "+995599446450", fallbackEmail: "patient@example.com" },
      message,
    );
    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ to: "patient@example.com" }));
    expect(sms.send).not.toHaveBeenCalled();
  });

  it("skips SMS Patients without an email while SMS is switched off", async () => {
    const { sms, email, messenger } = senders({ smsDisabled: true });
    await expect(messenger.send({ channel: "sms", phone: "+995599446450" }, message)).rejects.toThrow(
      "SMS is switched off",
    );
    expect(sms.send).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Visitor@Example.COM ")).toBe("visitor@example.com");
  });

  it("rejects addresses without a domain", () => {
    expect(() => normalizeEmail("visitor@")).toThrow("INVALID_EMAIL");
  });
});

describe("maskContact", () => {
  it("hides most of an email", () => {
    expect(maskContact({ channel: "email", email: "visitor@example.com" })).toBe("v•••@example.com");
  });
});
