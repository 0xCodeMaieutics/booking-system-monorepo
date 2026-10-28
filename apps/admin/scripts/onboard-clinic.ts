// Onboards a Clinic and invites its first Admin:
// pnpm clinic:onboard --handle face-kutaisi --name-ka "…" --name-en "…" --phone +995… \
//   --admin-email owner@example.com --admin-name "…"
import { parseArgs } from "node:util";

import { isValidHandle } from "@tsami/booking";
import { eq, getDb, schema } from "@tsami/db";

import { adminAccounts } from "../src/server/auth";

const { values } = parseArgs({
  options: {
    handle: { type: "string" },
    "name-ka": { type: "string" },
    "name-en": { type: "string" },
    phone: { type: "string", default: "" },
    "admin-email": { type: "string" },
    "admin-name": { type: "string" },
  },
});
const handle = values.handle ?? "";
const nameKa = values["name-ka"];
const nameEn = values["name-en"];
const adminEmail = values["admin-email"];
const adminName = values["admin-name"];

if (!nameKa || !nameEn || !adminEmail || !adminName) {
  console.error(
    'Usage: pnpm clinic:onboard --handle <handle> --name-ka "<name>" --name-en "<name>" [--phone <phone>] --admin-email <email> --admin-name "<name>"',
  );
  process.exit(1);
}
if (!isValidHandle(handle)) {
  console.error(
    `"${handle}" is not a valid Handle: 3–40 lowercase letters, digits and single hyphens, not api, en or ka.`,
  );
  process.exit(1);
}

const db = getDb();
const [clinic] = await db
  .insert(schema.clinic)
  .values({ handle, nameKa, nameEn, phone: values.phone })
  .onConflictDoNothing({ target: schema.clinic.handle })
  .returning();
if (!clinic) {
  console.error(`The Handle "${handle}" is already taken; Handles are never reused.`);
  process.exit(1);
}

try {
  await adminAccounts.invite({ clinicId: clinic.id, name: adminName, email: adminEmail });
} catch (error) {
  // Nothing references the Clinic yet, so the Handle can be freed for a retry.
  await db.delete(schema.clinic).where(eq(schema.clinic.id, clinic.id));
  throw error;
}
const siteUrl = process.env.BOOKING_BASE_URL ?? "http://localhost:3000";
console.log(`Onboarded ${nameEn}: ${siteUrl}/${handle}`);
console.log(`Invited ${adminName} <${adminEmail}> as its first Admin.`);
process.exit(0);
