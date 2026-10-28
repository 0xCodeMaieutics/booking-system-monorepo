// Switches SMS off or on for every Clinic, e.g. while Sender.ge is down (ADR 0010):
// pnpm sms:disable | pnpm sms:enable
import { createOpsAlerts, setSmsDisabled } from "@tsami/booking";
import { getDb } from "@tsami/db";

const [mode] = process.argv.slice(2);
if (mode !== "disable" && mode !== "enable") {
  console.error("Usage: pnpm sms:disable | pnpm sms:enable");
  process.exit(1);
}

const changed = await setSmsDisabled(getDb(), mode === "disable", new Date());
if (!changed) {
  console.log(`SMS is already ${mode}d.`);
  process.exit(0);
}
const message =
  mode === "disable"
    ? "SMS switched off for every Clinic. Patients verify by email; SMS Patients without an email get no messages."
    : "SMS switched back on for every Clinic.";
await createOpsAlerts().send(message);
console.log(message);
process.exit(0);
